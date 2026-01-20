import { Request, Response } from 'express';
import Company from '../models/Company';
import User from '../models/User';

export const getCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await Company.findAll({
      include: [{ model: User, as: 'employees', attributes: ['id'] }], // To count users
      order: [['created_at', 'DESC']]
    });
    
    // Map to include user count
    const data = companies.map((c: any) => ({
      ...c.toJSON(),
      user_count: c.employees?.length || 0
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching companies' });
  }
};

export const createCompany = async (req: Request, res: Response) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json(company);
  } catch (error) {
    res.status(500).json({ message: 'Error creating company' });
  }
};

export const updateCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Company.update(req.body, { where: { id } });
    const updated = await Company.findByPk(id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating company' });
  }
};

export const deleteCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Optional: Check if company has active users/vessels before delete
    await Company.destroy({ where: { id } });
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting company' });
  }
};