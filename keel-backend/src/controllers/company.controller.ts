//keel-backend/src/controllers/company.controller.ts

import { Request, Response } from 'express';
import sequelize from '../config/database'; 
import Company from '../models/Company';
import User from '../models/User';
import Subscription from '../models/Subscription';
import Role from '../models/Role'; 
import bcrypt from 'bcrypt';    

/**
 * GET /api/companies
 */
export const getCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await Company.findAll({
      include: [
        { 
          model: User, 
          as: 'employees', 
          attributes: ['id'] 
        },
        {
          model: Subscription,
          as: 'subscription'
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    const data = companies.map((c: any) => {
      const sub = c.subscription;
      return {
        ...c.toJSON(),
        user_count: c.employees?.length || 0,
        subscription_status: sub?.status || 'INACTIVE',
        valid_until: sub?.valid_until || null,
        cadet_limit: sub?.cadet_limit || 0,
        price_per_cadet: sub?.price_per_cadet || 500,
        seats_used: 0 
      };
    });

    res.json(data);
  } catch (error) {
    console.error('Fetch Companies Error:', error);
    res.status(500).json({ message: 'Error fetching companies' });
  }
};

/**
 * POST /api/companies
 * Transactional creation of Company + Subscription + Admin User
 */
export const createCompany = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();

  try {
    const { 
      name, domain, contact_email, address, 
      cadet_limit, price_per_cadet, valid_until, 
      plan_tier 
    } = req.body;

    // 1. Create Company
    const company = await Company.create({
      name,
      domain,
      contact_email,
      address,
      plan_tier: plan_tier || 'STANDARD',
      is_active: true
    }, { transaction });

    // 2. Create Subscription
    await Subscription.create({
      company_id: company.id,
      cadet_limit: cadet_limit || 5,
      price_per_cadet: price_per_cadet || 500.00,
      valid_until: valid_until,
      status: 'ACTIVE',
      grace_period_days: 15
    }, { transaction });

    // 3. Create Default Admin User (The "Manager")
    const adminRole = await Role.findOne({ where: { name: 'ADMIN' } });
    
    if (!adminRole) {
      throw new Error("System Error: 'ADMIN' role not found in database. Please seed roles.");
    }

    const defaultPassword = 'Keel2024!'; 
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await User.create({
      first_name: 'Company',
      last_name: 'Admin',
      email: contact_email, 
      password_hash: hashedPassword, // <--- FIXED: Was 'password', now 'password_hash'
      role_id: adminRole.id,
      company_id: company.id,
      rank: 'Shore Manager',
      status: 'Ready', // Changed to Ready to match Enum
      nationality: 'Global'
    }, { transaction });

    // 4. Commit Transaction
    await transaction.commit();

    res.status(201).json({ 
      message: 'Company, License, and Admin Account provisioned successfully.', 
      company,
      admin_credentials: {
        email: contact_email,
        temporary_password: defaultPassword
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Create Company Error:', error);
    res.status(500).json({ message: 'Error creating company. Please check inputs.' });
  }
};

/**
 * PUT /api/companies/:id
 */
export const updateCompany = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { 
      name, domain, contact_email, is_active, 
      cadet_limit, valid_until, price_per_cadet 
    } = req.body;

    await Company.update({ 
      name, domain, contact_email, is_active 
    }, { where: { id }, transaction });

    if (cadet_limit || valid_until || price_per_cadet) {
      const updateData: any = {};
      if (cadet_limit) updateData.cadet_limit = cadet_limit;
      if (valid_until) updateData.valid_until = valid_until;
      if (price_per_cadet) updateData.price_per_cadet = price_per_cadet;

      const sub = await Subscription.findOne({ where: { company_id: id } });
      if (sub) {
        await sub.update(updateData, { transaction });
      } else {
        await Subscription.create({
          company_id: Number(id),
          cadet_limit: cadet_limit || 5,
          price_per_cadet: price_per_cadet || 500,
          valid_until: valid_until || new Date(),
          status: 'ACTIVE'
        }, { transaction });
      }
    }

    await transaction.commit();
    const updated = await Company.findByPk(id, { include: ['subscription'] });
    res.json(updated);

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: 'Error updating company details.' });
  }
};

export const deleteCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Company.destroy({ where: { id } });
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting company' });
  }
};