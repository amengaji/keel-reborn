//keel-backend/src/controllers/cadet.controller.ts

import { Request, Response } from 'express';
import User from '../models/User';
import Role from '../models/Role';
import Vessel from '../models/Vessel';
import Task from '../models/Task';
import Assignment from '../models/Assignment';
import TraineeAssignment from '../models/TraineeAssignment'; 
import bcrypt from 'bcrypt';

/**
 * GET ALL CADETS
 */
export const getCadets = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const currentUser = req.user;
    const whereClause: any = {};
    const totalTasksCount = await Task.count();

    // FILTER BY COMPANY (Multi-Tenancy)
    if (currentUser && currentUser.role !== 'SUPER_ADMIN' && currentUser.company_id) {
        whereClause.company_id = currentUser.company_id;
    }

    const cadets = await User.findAll({
      where: whereClause, // <--- Apply Company Filter
      include: [
        { model: Role, as: 'role', where: { name: 'CADET' } },
        {
          model: TraineeAssignment,
          as: 'assignments',
          where: { status: 'ACTIVE' },
          required: false, // Left Join (get cadet even if not assigned)
          include: [
            { 
              model: Vessel, 
              as: 'vessel', // <--- FIX: Matches the alias defined in associations.ts
              attributes: ['name'] 
            }
          ]
        },
        {
          model: Assignment, 
          as: 'taskAssignments',
          required: false,
        }
      ],
      attributes: { exclude: ['password_hash'] },
      order: [['first_name', 'ASC']]
    });

    const formattedCadets = cadets.map((c: any) => {
      const plainCadet = c.get({ plain: true });
      const activeAssignment = plainCadet.assignments?.[0];
      const completedTasksCount = plainCadet.taskAssignments ? plainCadet.taskAssignments.length : 0;

      // Safe check for vessel name using the alias structure
      const vesselName = activeAssignment?.vessel?.name || null;

      return {
        ...plainCadet,

        /* ------------------ UI EXPECTED KEYS ------------------ */

        // Identity
        fullName: `${plainCadet.first_name || ''} ${plainCadet.last_name || ''}`.trim(),
        mobile: plainCadet.phone,

        // Address
        country: plainCadet.country,
        state: plainCadet.state,
        city: plainCadet.city,

        // Emergency (Next of Kin)
        kinName: plainCadet.kin_name,
        kinRelation: plainCadet.kin_relation,
        kinMobile: plainCadet.kin_mobile,
        kinEmail: plainCadet.kin_email,

        // Passport
        passportNo: plainCadet.passport_number,
        passportIssueDate: plainCadet.passport_issue_date,
        passportExpiryDate: plainCadet.passport_expiry_date,
        passportPlace: plainCadet.passport_place,

        // CDC / Seaman Book
        cdcNo: plainCadet.cdc_number,
        cdcCountry: plainCadet.cdc_country,
        cdcIssueDate: plainCadet.cdc_issue_date,
        cdcExpiryDate: plainCadet.cdc_expiry_date,

        // Other Documents
        indosNo: plainCadet.indos_number,
        sidNo: plainCadet.sid_number,

        // Role / Employment
        traineeType: plainCadet.rank,
        department: plainCadet.department,

        // Assignment-based
        doj: activeAssignment?.sign_on_date || null,
        vessel: vesselName,

        // Progress
        completed_tasks_count: completedTasksCount,
        total_tasks_count: totalTasksCount,
        progress:
          totalTasksCount > 0
            ? Math.round((completedTasksCount / totalTasksCount) * 100)
            : 0
      };

    });
    
    res.json(formattedCadets);
  } catch (error: any) {
    console.error("FETCH CADETS ERROR:", error);
    res.status(500).json({ message: 'Error fetching cadets', error: error.message });
  }
};

/**
 * CREATE CADET (Updated to support full profile & Multi-Tenancy)
 */
export const createCadet = async (req: Request, res: Response) => {
  try {
    const data = req.body; // Shortcut for full payload
    // @ts-ignore
    const currentUser = req.user;

    if (!data.email) return res.status(400).json({ message: "Email is required" });

    // Determine Company ID
    let companyId = data.companyId;
    if (currentUser && currentUser.role !== 'SUPER_ADMIN') {
        companyId = currentUser.company_id;
    }

    // Name Resolution
    let resolvedFirstName = data.first_name;
    let resolvedLastName = data.last_name;

    if (!resolvedFirstName && data.fullName) {
      const parts = data.fullName.trim().split(/\s+/);
      resolvedFirstName = parts[0];
      resolvedLastName = parts.length > 1 ? parts.slice(1).join(" ") : "Trainee";
    }

    const cadetRole = await Role.findOne({ where: { name: "CADET" } });
    if (!cadetRole) return res.status(500).json({ message: "System Error: CADET role missing" });

    const passwordHash = await bcrypt.hash(data.password || "cadet123", 10);

    const newUser = await User.create({
      // Core Auth
      first_name: resolvedFirstName,
      last_name: resolvedLastName,
      email: data.email,
      password_hash: passwordHash,
      role_id: cadetRole.id,
      status: "Ready",
      company_id: companyId, // <--- Assign Company
      
      // Professional / Maritime
      rank: data.rank || data.traineeType || "Deck Cadet",
      indos_number: data.indos_number || data.indosNo || null,
      sid_number: data.sid_number || data.sidNo || null,
      nationality: data.nationality || null,
      phone: data.phone || data.mobile || null,
      
      // Personal
      dob: data.dob || null,
      gender: data.gender || null,
      blood_group: data.bloodGroup || null,
      
      // Address
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      country: data.country || null,
      pincode: data.pincode || null,

      // Passport
      passport_number: data.passportNo || null,
      passport_issue_date: data.passportIssueDate || null,
      passport_expiry_date: data.passportExpiryDate || null,
      passport_place: data.passportPlace || null,

      // CDC
      cdc_number: data.cdcNo || null,
      cdc_country: data.cdcCountry || null,
      cdc_issue_date: data.cdcIssueDate || null,
      cdc_expiry_date: data.cdcExpiryDate || null,

      // Kin
      kin_name: data.kinName || null,
      kin_relation: data.kinRelation || null,
      kin_mobile: data.kinMobile || null,
      kin_email: data.kinEmail || null,
    });

    return res.status(201).json({ message: "Cadet profile created successfully", cadet: newUser });
  } catch (error: any) {
    console.error("CREATE CADET ERROR:", error);
    return res.status(500).json({ message: "Error creating cadet", error: error.message });
  }
};

/**
 * UPDATE CADET (New functionality)
 */
export const updateCadet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Resolve Name if provided
    let nameUpdates = {};
    if (data.fullName) {
       const parts = data.fullName.trim().split(/\s+/);
       nameUpdates = {
         first_name: parts[0],
         last_name: parts.slice(1).join(" ") || ""
       };
    } else if (data.first_name || data.last_name) {
       nameUpdates = {
         first_name: data.first_name,
         last_name: data.last_name
       };
    }

    // Map Frontend keys to DB keys
    const updatePayload = {
      ...nameUpdates,
      email: data.email,
      phone: data.mobile || data.phone,
      
      // Maritime
      rank: data.traineeType || data.rank,
      indos_number: data.indosNo || data.indos_number,
      sid_number: data.sidNo || data.sid_number,
      nationality: data.nationality,
      
      // Personal
      dob: data.dob,
      gender: data.gender,
      blood_group: data.bloodGroup || data.blood_group,
      
      // Address
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      pincode: data.pincode,

      // Passport
      passport_number: data.passportNo || data.passport_number,
      passport_issue_date: data.passportIssueDate || data.passport_issue_date,
      passport_expiry_date: data.passportExpiryDate || data.passport_expiry_date,
      passport_place: data.passportPlace || data.passport_place,

      // CDC
      cdc_number: data.cdcNo || data.cdc_number,
      cdc_country: data.cdcCountry || data.cdc_country,
      cdc_issue_date: data.cdcIssueDate || data.cdc_issue_date,
      cdc_expiry_date: data.cdcExpiryDate || data.cdc_expiry_date,

      // Kin
      kin_name: data.kinName || data.kin_name,
      kin_relation: data.kinRelation || data.kin_relation,
      kin_mobile: data.kinMobile || data.kin_mobile,
      kin_email: data.kinEmail || data.kin_email,
    };

    // Remove undefined keys to prevent overwriting with null
    Object.keys(updatePayload).forEach(key => (updatePayload as any)[key] === undefined && delete (updatePayload as any)[key]);

    const [updated] = await User.update(updatePayload, { where: { id } });

    if (updated) {
      const updatedUser = await User.findByPk(id);
      return res.json({ message: "Profile updated", cadet: updatedUser });
    }
    
    return res.status(404).json({ message: "Cadet not found" });
  } catch (error: any) {
    console.error("UPDATE CADET ERROR:", error);
    res.status(500).json({ message: "Error updating cadet", error: error.message });
  }
};

/**
 * DELETE CADET
 */
export const deleteCadet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Clean up assignments before deleting user to avoid foreign key constraints
    await TraineeAssignment.destroy({ where: { trainee_id: id } });
    await Assignment.destroy({ where: { user_id: id } }); // Also clear TRB tasks

    const deletedCount = await User.destroy({ where: { id } });

    if (deletedCount === 0) return res.status(404).json({ message: 'Trainee not found in database' });

    res.json({ message: 'Trainee and all associated records removed successfully' });
  } catch (error: any) {
    console.error("DELETE CADET ERROR:", error);
    res.status(500).json({ message: 'Error removing cadet', error: error.message });
  }
};

/**
 * DELETE ALL CADETS (Bulk Action)
 */
export const deleteAllCadets = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const currentUser = req.user;
    const whereClause: any = {};

    // Safety: Only SUPER_ADMIN can wipe everything. 
    // Regular Admins only wipe their company's cadets.
    if (currentUser && currentUser.role !== 'SUPER_ADMIN' && currentUser.company_id) {
        whereClause.company_id = currentUser.company_id;
    }

    // 1. Find all target IDs first to clean associations
    const cadetsToDelete = await User.findAll({
        where: whereClause,
        include: [{ model: Role, as: 'role', where: { name: 'CADET' } }],
        attributes: ['id']
    });

    const ids = cadetsToDelete.map((c: any) => c.id);

    if (ids.length === 0) {
        return res.status(200).json({ message: 'No trainees found to delete.' });
    }

    // 2. Clean up Associations (Foreign Keys)
    await TraineeAssignment.destroy({ where: { trainee_id: ids } });
    await Assignment.destroy({ where: { user_id: ids } }); 

    // 3. Delete Users
    await User.destroy({ where: { id: ids } });

    res.json({ message: `Successfully deleted ${ids.length} trainee profiles.` });
  } catch (error: any) {
    console.error("DELETE ALL CADETS ERROR:", error);
    res.status(500).json({ message: 'Error deleting all cadets', error: error.message });
  }
};