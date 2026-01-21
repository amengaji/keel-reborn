//keel-backend/src/controllers/company.controller.ts

import { Request, Response } from 'express';
import sequelize from '../config/database'; // Needed for transactions
import Company from '../models/Company';
import User from '../models/User';
import Subscription from '../models/Subscription';

/**
 * GET /api/companies
 * Fetches all companies with their User Counts and Active Subscription details.
 */
export const getCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await Company.findAll({
      include: [
        { 
          model: User, 
          as: 'employees', 
          attributes: ['id'] // Optimized: We only need ID to count
        },
        {
          model: Subscription,
          as: 'subscription'
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // Transform data for the frontend
    const data = companies.map((c: any) => {
      const sub = c.subscription;
      return {
        ...c.toJSON(),
        user_count: c.employees?.length || 0,
        // Flatten subscription data for easier table display
        subscription_status: sub?.status || 'INACTIVE',
        valid_until: sub?.valid_until || null,
        cadet_limit: sub?.cadet_limit || 0,
        price_per_cadet: sub?.price_per_cadet || 500, // <--- RETURNED TO FRONTEND
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
 * Transactional creation of Company + Subscription
 */
export const createCompany = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();

  try {
    const { 
      name, domain, contact_email, address, // Company Basic Info
      cadet_limit, price_per_cadet, valid_until, // Subscription Info
      plan_tier 
    } = req.body;

    // 1. Create the Company Record
    const company = await Company.create({
      name,
      domain,
      contact_email,
      address,
      plan_tier: plan_tier || 'STANDARD',
      is_active: true
    }, { transaction });

    // 2. Create the Subscription Record
    // We default to "ACTIVE" and set the Grace Period to 15 days as per your rules
    await Subscription.create({
      company_id: company.id,
      cadet_limit: cadet_limit || 5, // Default 5 seats if not specified
      price_per_cadet: price_per_cadet || 500.00,
      valid_until: valid_until, // Must be provided by frontend
      status: 'ACTIVE',
      grace_period_days: 15
    }, { transaction });

    // 3. Commit Transaction
    await transaction.commit();

    res.status(201).json({ message: 'Company and License provisioned successfully.', company });

  } catch (error) {
    await transaction.rollback(); // Undo everything if step 2 fails
    console.error('Create Company Error:', error);
    res.status(500).json({ message: 'Error creating company. Please check inputs.' });
  }
};

/**
 * PUT /api/companies/:id
 * Updates Company Details AND Subscription Limits
 */
export const updateCompany = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { 
      name, domain, contact_email, is_active, // Company Fields
      cadet_limit, valid_until, price_per_cadet // Subscription Fields
    } = req.body;

    // 1. Update Company Basic Info
    await Company.update({ 
      name, domain, contact_email, is_active 
    }, { where: { id }, transaction });

    // 2. Update Subscription Info (if provided)
    if (cadet_limit || valid_until || price_per_cadet) {
      const updateData: any = {};
      if (cadet_limit) updateData.cadet_limit = cadet_limit;
      if (valid_until) updateData.valid_until = valid_until;
      if (price_per_cadet) updateData.price_per_cadet = price_per_cadet; // <--- NOW SAVES PRICE UPDATES

      // Find existing subscription or create if missing (self-healing)
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
    
    // Return the fresh data
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
    // Sequelize CASCADE will automatically delete the Subscription due to our model setup
    await Company.destroy({ where: { id } });
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting company' });
  }
};