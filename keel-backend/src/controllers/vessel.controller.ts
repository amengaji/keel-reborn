import { Request, Response } from 'express';
import bcrypt from 'bcryptjs'; 
import Vessel from '../models/Vessel';
import User from '../models/User';
import Role from '../models/Role';

// Helper: Standardized Password Hash
const getDefaultPasswordHash = async () => {
  return await bcrypt.hash('Keel@123', 10);
};

// GET ALL (Supports Multi-Tenancy)
export const getVessels = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - 'user' is attached by auth middleware
    const currentUser = req.user; 

    const whereClause: any = {};
    
    // If NOT Super Admin, filter by their company
    if (currentUser && currentUser.role !== 'SUPER_ADMIN' && currentUser.company_id) {
        whereClause.company_id = currentUser.company_id;
    }

    const vessels = await Vessel.findAll({
      where: whereClause, // <--- ADDED FILTER
      include: [{
        model: User,
        as: 'crew',
        required: false,
        attributes: ['email', 'rank', 'role_id', 'first_name', 'last_name'] 
      }],
      order: [['created_at', 'DESC']]
    });

    const formattedVessels = vessels.map((v: any) => {
      const users = v.crew || [];
      const crewEmails = {
        master: users.find((u: any) => u.rank === 'Master')?.email || '',
        ctoDeck: users.find((u: any) => u.rank === 'CTO Deck')?.email || '',
        ctoEngine: users.find((u: any) => u.rank === 'CTO Engine')?.email || '',
        ctoEto: users.find((u: any) => u.rank === 'CTO Electrical')?.email || '',
        ctoCatering: users.find((u: any) => u.rank === 'CTO Catering')?.email || '',
      };
      
      return { ...v.toJSON(), crewEmails };
    });

    res.json(formattedVessels);
  } catch (error: any) {
    console.error("Fetch Error:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// CREATE VESSEL
export const createVessel = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    // @ts-ignore
    const currentUser = req.user;

    // Determine Company ID: Use payload if Super Admin, otherwise use creator's company
    let companyId = data.companyId;
    if (currentUser && currentUser.role !== 'SUPER_ADMIN') {
        companyId = currentUser.company_id;
    }

    const payload = {
      name: data.name,
      imo_number: data.imo || data.imoNumber || data.imo_number,
      vessel_type: data.type || data.vesselType || data.vessel_type,
      flag: data.flag || 'Unknown',
      class_society: data.classSociety || data.class_society,
      status: data.is_active === 'on' || data.is_active === true ? 'Active' : 'Inactive',
      is_active: data.is_active === 'on' || data.is_active === true,
      company_id: companyId // <--- ASSIGN COMPANY
    };

    if (!payload.name || !payload.imo_number) {
      return res.status(400).json({ message: "Name and IMO Number are required." });
    }

    const newVessel = await Vessel.create(payload);

    // Create Command Users
    if (data.crewEmails) {
      const { master, ctoDeck, ctoEngine, ctoEto, ctoCatering } = data.crewEmails;
      
      const defaultPass = await getDefaultPasswordHash();
      const masterRole = await Role.findOne({ where: { name: 'MASTER' } });
      const ctoRole = await Role.findOne({ where: { name: 'CTO' } });

      if (masterRole && ctoRole) {
        const accountsToCreate = [
          { email: master, roleId: masterRole.id, fname: 'Captain', lname: 'Master', rank: 'Master' },
          { email: ctoDeck, roleId: ctoRole.id, fname: 'Chief', lname: 'Training Officer (Deck)', rank: 'CTO Deck' },
          { email: ctoEngine, roleId: ctoRole.id, fname: 'Chief', lname: 'Training Officer (Engine)', rank: 'CTO Engine' },
          { email: ctoEto, roleId: ctoRole.id, fname: 'Chief', lname: 'Training Officer (Electrical)', rank: 'CTO Electrical' },
          { email: ctoCatering, roleId: ctoRole.id, fname: 'Chief', lname: 'Training Officer (Catering)', rank: 'CTO Catering' }
        ];

        for (const acc of accountsToCreate) {
          if (acc.email && acc.email.trim() !== '') {
            await User.create({
              email: acc.email,
              password_hash: defaultPass,
              first_name: acc.fname,
              last_name: acc.lname,
              role_id: acc.roleId,
              rank: acc.rank,
              vessel_id: newVessel.id,
              status: 'Onboard',
              nationality: payload.flag,
              company_id: companyId // <--- ASSIGN CREW TO SAME COMPANY
            }).catch(err => console.error(`Failed to create user ${acc.email}:`, err.message));
          }
        }
      }
    }

    res.status(201).json(newVessel);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE (Preserves Company Logic)
export const updateVessel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 1. Update Vessel Details
    const [updated] = await Vessel.update(req.body, { where: { id } });
    
    // 2. Update Associated Users if crewEmails provided
    if (req.body.crewEmails) {
      const { master, ctoDeck, ctoEngine, ctoEto, ctoCatering } = req.body.crewEmails;
      
      // Fetch vessel to get company_id
      const vessel = await Vessel.findByPk(id);
      const companyId = vessel?.company_id;

      const defaultPass = await getDefaultPasswordHash();
      const masterRole = await Role.findOne({ where: { name: 'MASTER' } });
      const ctoRole = await Role.findOne({ where: { name: 'CTO' } });

      const updates = [
        { rank: 'Master', email: master, roleId: masterRole?.id, fname: 'Captain', lname: 'Master' },
        { rank: 'CTO Deck', email: ctoDeck, roleId: ctoRole?.id, fname: 'Chief', lname: 'Training Officer (Deck)' },
        { rank: 'CTO Engine', email: ctoEngine, roleId: ctoRole?.id, fname: 'Chief', lname: 'Training Officer (Engine)' },
        { rank: 'CTO Electrical', email: ctoEto, roleId: ctoRole?.id, fname: 'Chief', lname: 'Training Officer (Electrical)' },
        { rank: 'CTO Catering', email: ctoCatering, roleId: ctoRole?.id, fname: 'Chief', lname: 'Training Officer (Catering)' }
      ];

      for (const update of updates) {
        if (update.email && update.email.trim() !== '') {
          const user = await User.findOne({ where: { vessel_id: id, rank: update.rank } });
          
          if (user) {
            if (user.email !== update.email) {
              user.email = update.email;
              await user.save();
            }
          } else if (update.roleId) {
            await User.create({
              email: update.email,
              password_hash: defaultPass,
              first_name: update.fname,
              last_name: update.lname,
              role_id: update.roleId,
              rank: update.rank,
              vessel_id: parseInt(id),
              status: 'Onboard',
              company_id: companyId // <--- Ensure new users get company_id
            }).catch(err => console.error("Error creating missing user on update:", err.message));
          }
        }
      }
    }

    const updatedVessel = await Vessel.findOne({ 
      where: { id },
      include: [{ model: User, as: 'crew', attributes: ['email', 'rank'] }]
    });
    
    res.json(updatedVessel);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating vessel', error: error.message });
  }
};

export const deleteVessel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await User.destroy({ where: { vessel_id: id } });
    const deleted = await Vessel.destroy({ where: { id } });
    if (deleted) {
      return res.status(200).json({ message: "Vessel and Crew Accounts removed successfully" });
    }
    throw new Error("Vessel not found");
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};