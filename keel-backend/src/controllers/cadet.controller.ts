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
    /**
     * ACCEPT MULTIPLE PAYLOAD SHAPES SAFELY
     * Supports:
     * - fullName
     * - first_name + last_name
     */
    const {
      fullName,
      first_name,
      last_name,
      email,
      password,
      indos,
      rank,
      nationality,
      phone,
    } = req.body;

    // ------------------------------------------------------------------
    // 1. VALIDATE EMAIL (MANDATORY)
    // ------------------------------------------------------------------
    if (!email) {
      return res.status(400).json({
        message: "Email is required to create cadet",
      });
    }

    // ------------------------------------------------------------------
    // 2. RESOLVE FIRST & LAST NAME (NO NULLS ALLOWED)
    // ------------------------------------------------------------------
    let resolvedFirstName: string;
    let resolvedLastName: string;

    if (first_name && last_name) {
      resolvedFirstName = first_name.trim();
      resolvedLastName = last_name.trim();
    } else if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      resolvedFirstName = parts[0];
      resolvedLastName =
        parts.length > 1 ? parts.slice(1).join(" ") : "Trainee";
    } else {
      return res.status(400).json({
        message:
          "Cadet name is required (provide fullName or first_name + last_name)",
      });
    }

    // Extra hard safety (never allow empty strings)
    if (!resolvedFirstName || !resolvedLastName) {
      return res.status(400).json({
        message: "Invalid cadet name provided",
      });
    }

    // ------------------------------------------------------------------
    // 3. FIND CADET ROLE
    // ------------------------------------------------------------------
    const cadetRole = await Role.findOne({ where: { name: "CADET" } });
    if (!cadetRole) {
      return res.status(500).json({
        message: "System configuration error: CADET role missing",
      });
    }

    // ------------------------------------------------------------------
    // 4. HASH PASSWORD (MANDATORY)
    // ------------------------------------------------------------------
    const passwordHash = await bcrypt.hash(password || "cadet123", 10);

    // ------------------------------------------------------------------
    // 5. CREATE USER (AUTHORITATIVE IDENTITY)
    // ------------------------------------------------------------------
    const newUser = await User.create({
      first_name: resolvedFirstName,
      last_name: resolvedLastName,
      email,
      password_hash: passwordHash,
      role_id: cadetRole.id,
      indos_number: indos || null,
      rank: rank || "Deck Cadet",
      nationality: nationality || null,
      phone: phone || null,
      status: "Ready",
    });

    // ------------------------------------------------------------------
    // 6. RESPONSE
    // ------------------------------------------------------------------
    return res.status(201).json({
      message: "Cadet profile created successfully",
      cadet: {
        id: newUser.id,
        name: `${newUser.first_name} ${newUser.last_name}`,
        email: newUser.email,
        rank: newUser.rank,
        nationality: newUser.nationality,
        phone: newUser.phone,
        status: newUser.status,
      },
    });
  } catch (error: any) {
    console.error("CREATE CADET ERROR:", error);
    return res.status(500).json({
      message: "Error creating cadet",
      error: error.message,
    });
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