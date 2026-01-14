import { Request, Response } from 'express';
import User from '../models/User';
import Role from '../models/Role';
import Vessel from '../models/Vessel';
import bcrypt from 'bcryptjs';

// GET ALL CADETS
export const getCadets = async (req: Request, res: Response) => {
  try {
    const cadets = await User.findAll({
      include: [
        { 
          model: Role, 
          as: 'role', 
          where: { name: 'CADET' } // Filter by Role
        },
        {
          model: Vessel,
          as: 'vessel',
          attributes: ['id', 'name'] // Include vessel name
        }
      ],
      attributes: { exclude: ['password_hash'] } // Don't send passwords
    });
    
    // Transform data to match frontend expectations if needed
    const formatted = cadets.map((c: any) => ({
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      email: c.email,
      rank: c.rank || 'Cadet',
      nationality: c.nationality || 'Unknown',
      vessel: c.vessel?.name || 'Unassigned',
      vesselId: c.vessel_id,
      status: c.status,
      indos: c.indos_number,
      signOnDate: c.sign_on_date,
      mobile: c.phone
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching cadets', error: error.message });
  }
};

// CREATE CADET
export const createCadet = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, indos, rank, nationality, phone } = req.body;

    // Find Cadet Role ID
    const cadetRole = await Role.findOne({ where: { name: 'CADET' } });
    if (!cadetRole) return res.status(500).json({ message: 'System Error: Cadet Role not found' });

    // Hash Password
    // Note: For now we accept plain text in 'password' field from frontend form
    // In production, use bcrypt.hash(password, 10)
    
    const newUser = await User.create({
      first_name: firstName,
      last_name: lastName,
      email,
      password_hash: password || 'cadet123', // Default password if not provided
      role_id: cadetRole.id,
      indos_number: indos,
      rank: rank || 'Deck Cadet',
      nationality,
      phone,
      status: 'Ready'
    });

    res.status(201).json({ message: 'Cadet profile created', cadet: newUser });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating cadet', error: error.message });
  }
};

// DELETE CADET
export const deleteCadet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await User.destroy({ where: { id } });
    res.json({ message: 'Cadet removed' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error removing cadet', error: error.message });
  }
};