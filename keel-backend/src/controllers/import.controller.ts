//keel-backend/src/controllers/import.controller.ts

import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import User from '../models/User';
import Vessel from '../models/Vessel';
import Role from '../models/Role';
import Subscription from '../models/Subscription';
import bcrypt from 'bcrypt';

// --- HELPER: ROBUST KEY MATCHER ---
const getValue = (row: any, targetKeys: string[]) => {
  const normalize = (k: string) => String(k || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const rowKeys = Object.keys(row);
  
  for (const target of targetKeys) {
    const foundKey = rowKeys.find(k => normalize(k) === normalize(target));
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
        return String(row[foundKey]).trim();
    }
  }
  return null;
};

// --- HELPER: SAFE DATE PARSER ---
const parseDate = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    const d = new Date(value);
    if (isNaN(d.getTime()) || d.getFullYear() <= 1900) return null;
    return d;
};

// --- HELPER: READ EXCEL TO JSON ---
const parseExcel = (buffer: Buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
};

// --- HELPER: PASSWORD HASH ---
const getDefaultPasswordHash = async () => {
  return await bcrypt.hash('Keel@123', 10);
};

// --- 1. IMPORT CADETS ---
export const importCadets = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // @ts-ignore
    const companyId = req.user.company_id;
    const rows: any[] = parseExcel(req.file.buffer);

    // License Check
    const subscription = await Subscription.findOne({ where: { company_id: companyId } });
    if (!subscription) return res.status(403).json({ message: 'No active subscription found.' });
    
    const cadetRole = await Role.findOne({ where: { name: 'CADET' } });
    if (!cadetRole) return res.status(500).json({ message: 'System Error: Cadet Role missing.' });

    const currentCount = await User.count({ where: { company_id: companyId, role_id: cadetRole.id } });
    const remainingSeats = subscription.cadet_limit - currentCount;

    const success: any[] = [];
    const skipped: any[] = [];
    const defaultPasswordHash = await bcrypt.hash('Keel1234!', 10);
    let newUsersCreated = 0;

    for (const row of rows) {
      if (newUsersCreated >= remainingSeats) {
        skipped.push({ email: 'Remaining Rows', reason: 'License Limit Reached' });
        break; 
      }

      const email = getValue(row, ['Email', 'Email Address', 'email']);
      
      if (!email) {
        skipped.push({ row, reason: 'Missing Email Address' });
        continue;
      }

      const userPayload = {
        /* ============================================================
        * CORE IDENTITY
        * ========================================================== */

        first_name:
          getValue(row, ['First Name', 'first_name']) ||
          getValue(row, ['Full Name', 'Name'])?.split(' ')[0] ||
          'Cadet',

        last_name:
          getValue(row, ['Last Name', 'last_name']) ||
          getValue(row, ['Full Name'])?.split(' ').slice(1).join(' ') ||
          '',

        email: email.toLowerCase(),
        password_hash: defaultPasswordHash,
        role_id: cadetRole.id,
        company_id: companyId,
        status: 'Ready',

        /* ============================================================
        * PERSONAL
        * ========================================================== */

        dob: parseDate(getValue(row, ['Date of Birth', 'DOB'])),
        gender: getValue(row, ['Gender']),
        blood_group: getValue(row, ['Blood Group']),
        phone: getValue(row, ['Mobile', 'Phone', 'Contact No']),

        nationality: getValue(row, ['Nationality', 'Passport Nationality']),

        /* ============================================================
        * ADDRESS (these DO exist in User model)
        * ========================================================== */

        address: getValue(row, ['Address']),
        city: getValue(row, ['City']),
        state: getValue(row, ['State']),
        country: getValue(row, ['Country']),
        pincode: getValue(row, ['Pincode', 'Postal Code']),

        /* ============================================================
        * MARITIME / EMPLOYMENT
        * ========================================================== */

        rank: getValue(row, ['Rank', 'Trainee Type']) || 'CADET',
        department: getValue(row, ['Department']),

        indos_number: getValue(row, ['INDoS No', 'INDoS']),
        sid_number: getValue(row, ['SID No', 'Seaman ID']),

        /* ============================================================
        * PASSPORT (VALID DB COLUMNS)
        * ========================================================== */

        passport_number: getValue(row, ['Passport No', 'Passport Number']),
        passport_place: getValue(row, ['Passport Place']),
        passport_issue_date: parseDate(getValue(row, ['Passport Issue Date'])),
        passport_expiry_date: parseDate(getValue(row, ['Passport Expiry Date'])),

        /* ============================================================
        * CDC / SEAMAN BOOK (VALID DB COLUMNS)
        * ========================================================== */

        cdc_number: getValue(row, ['CDC No', 'Seaman Book No']),
        cdc_country: getValue(row, ['CDC Country']),
        cdc_issue_date: parseDate(getValue(row, ['CDC Issue Date'])),
        cdc_expiry_date: parseDate(getValue(row, ['CDC Expiry Date'])),

        /* ============================================================
        * NEXT OF KIN (VALID DB COLUMNS)
        * ========================================================== */

        kin_name: getValue(row, ['Next of Kin Name', 'NOK Name']),
        kin_relation: getValue(row, ['Relationship']),
        kin_mobile: getValue(row, ['Kin Mobile', 'Emergency Contact']),
        kin_email: getValue(row, ['Kin Email'])
      };




      try {
        const [user, created] = await User.findOrCreate({
            where: { email: userPayload.email },
            defaults: userPayload
        });

        if (created) {
            newUsersCreated++;
            success.push(email);
        } else {
            await user.update(userPayload);
            success.push(`${email} (Updated)`);
        }

      } catch (err: any) {
        skipped.push({ email, reason: 'Database Error' });
      }
    }

    res.json({
      message: 'Import processed',
      summary: { total_rows: rows.length, imported: success.length, skipped_count: skipped.length, skipped_details: skipped }
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to process import file' });
  }
};

// --- 2. IMPORT VESSELS (UPDATED WITH AUTO-CREATION) ---
export const importVessels = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // @ts-ignore
    const companyId = req.user.company_id;
    const rows: any[] = parseExcel(req.file.buffer);
    
    const success: any[] = [];
    const skipped: any[] = [];

    // Pre-fetch roles and hash to speed up loop
    const ctoRole = await Role.findOne({ where: { name: 'CTO' } });
    const masterRole = await Role.findOne({ where: { name: 'MASTER' } });
    const defaultPass = await getDefaultPasswordHash();

    if (!ctoRole || !masterRole) {
        return res.status(500).json({ message: "System Roles (CTO/MASTER) missing in DB." });
    }

    for (const row of rows) {
      const name = getValue(row, ['Vessel Name', 'VesselName', 'Name']);
      const imo = getValue(row, ['IMO Number', 'IMO', 'Imo']);
      const type = getValue(row, ['Vessel Type', 'Type']) || 'Bulk Carrier';
      const flag = getValue(row, ['Flag', 'Country']) || 'Unknown';
      const society = getValue(row, ['Classification Society', 'Class']) || 'Unknown';
      
      // Optional: Check if Master Email is in Excel (e.g., column "Master Email")
      const masterEmail = getValue(row, ['Master Email', 'Captain Email', 'MasterEmail']);

      if (!name || !imo) {
        skipped.push({ row, reason: 'Missing Name or IMO Number' });
        continue;
      }

      const existing = await Vessel.findOne({ where: { imo_number: imo } });
      if (existing) {
        skipped.push({ row: { name, imo }, reason: `IMO ${imo} already registered` });
        continue;
      }

      try {
        // 1. Create Vessel
        const newVessel = await Vessel.create({
          name: name,
          imo_number: imo,
          company_id: companyId,
          vessel_type: type,
          flag: flag,
          class_society: society,
          status: 'Active'
        });

        // 2. Auto-Create CTO Accounts (Linked to IMO)
        const ctoAccounts = [
            { id: `ctodeck.${imo}`, name: 'CTO Deck', dept: 'Deck' },
            { id: `ctoeng.${imo}`, name: 'CTO Engine', dept: 'Engine' },
            { id: `ctoeto.${imo}`, name: 'CTO Electrical', dept: 'Electrical' },
            { id: `ctocat.${imo}`, name: 'CTO Catering', dept: 'Catering' },
        ];

        for (const cto of ctoAccounts) {
            await User.create({
                email: cto.id, // Username
                password_hash: defaultPass,
                first_name: 'Chief Training Officer',
                last_name: `(${cto.dept})`,
                role_id: ctoRole.id,
                rank: cto.name,
                vessel_id: newVessel.id,
                status: 'Onboard',
                company_id: companyId,
                department: cto.dept
            }).catch(err => console.error(`Failed to create ${cto.id}:`, err.message));
        }

        // 3. Create Master Account (If email provided in Excel)
        if (masterEmail) {
             await User.create({
                email: masterEmail,
                password_hash: defaultPass,
                first_name: 'Captain',
                last_name: 'Master',
                role_id: masterRole.id,
                rank: 'Master',
                vessel_id: newVessel.id,
                status: 'Onboard',
                company_id: companyId,
                department: 'Deck'
            }).catch(err => console.error("Master creation error:", err.message));
        }

        success.push(name);
      } catch (err: any) {
        console.error("Vessel DB Error:", err);
        skipped.push({ row: { name }, reason: 'Database Error' }); 
      }
    }

    res.json({
      message: 'Vessel Import processed',
      summary: {
        total_rows: rows.length,
        imported: success.length,
        skipped_count: skipped.length,
        skipped_details: skipped
      }
    });

  } catch (error) {
    console.error('Import Vessel Error:', error);
    res.status(500).json({ message: 'Failed to process import file' });
  }
};