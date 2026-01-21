// keel-backend/src/controllers/import.controller.ts

import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import User from '../models/User';
import Vessel from '../models/Vessel';
import Role from '../models/Role';
import Subscription from '../models/Subscription';
import bcrypt from 'bcryptjs';

// --- HELPER: ROBUST KEY MATCHER ---
// Finds a key like "First Name" even if the row has "firstname" or "First_Name"
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
// Handles JS Date objects (from cellDates:true) and ISO Strings
const parseDate = (value: any): Date | null => {
    if (!value) return null;
    
    // If it is already a Date object
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
    }

    // If it is a string/number, try to parse
    const d = new Date(value);
    
    // Validate (Must be a valid date and generally after 1970 to avoid excel epoch bugs)
    if (isNaN(d.getTime()) || d.getFullYear() <= 1900) return null;
    
    return d;
};

// --- HELPER: READ EXCEL TO JSON ---
const parseExcel = (buffer: Buffer) => {
  // 🔥 FIX: cellDates goes here! This converts Excel serials (45293) to JS Dates.
  const workbook = XLSX.read(buffer, { 
    type: 'buffer', 
    cellDates: true 
  });
  
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Remove invalid 'cellDates' from here
  return XLSX.utils.sheet_to_json(sheet, { 
    defval: "" 
  });
};

// --- 1. IMPORT CADETS ---
export const importCadets = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // @ts-ignore
    const companyId = req.user.company_id;
    const rows: any[] = parseExcel(req.file.buffer);

    // 1. Check License Limits
    const subscription = await Subscription.findOne({ where: { company_id: companyId } });
    if (!subscription) return res.status(403).json({ message: 'No active subscription found.' });
    
    const cadetRole = await Role.findOne({ where: { name: 'CADET' } });
    if (!cadetRole) return res.status(500).json({ message: 'System Error: Cadet Role missing.' });

    const currentCount = await User.count({ where: { company_id: companyId, role_id: cadetRole.id } });
    const remainingSeats = subscription.cadet_limit - currentCount;

    // 2. Process Rows
    const success: any[] = [];
    const skipped: any[] = [];
    const defaultPasswordHash = await bcrypt.hash('Keel1234!', 10);
    let newUsersCreated = 0;

    for (const row of rows) {
      // License Check for NEW users
      if (newUsersCreated >= remainingSeats) {
        skipped.push({ email: 'Remaining Rows', reason: 'License Limit Reached' });
        break; 
      }

      const email = getValue(row, ['Email', 'Email Address', 'email']);
      
      if (!email) {
        skipped.push({ row, reason: 'Missing Email Address' });
        continue;
      }

      // Map ALL Fields
      const userPayload = {
        // Identity
        first_name: getValue(row, ['First Name', 'first_name', 'Name', 'FirstName'])?.split(' ')[0] || 'Cadet',
        last_name: getValue(row, ['Last Name', 'last_name', 'Surname']) || getValue(row, ['Full Name'])?.split(' ').slice(1).join(' ') || '',
        email: email.toLowerCase(),
        password_hash: defaultPasswordHash,
        role_id: cadetRole.id,
        company_id: companyId,
        status: 'Ready',

        // 🔥 DATES: Parsed safely
        dob: parseDate(row['Date of Birth'] || row['dob'] || row['DOB']),
        sign_on_date: parseDate(row['Date of Joining'] || row['DOJ'] || row['sign_on_date']),
        passport_issue_date: parseDate(row['Passport Issue Date'] || row['passport_issue_date']),
        passport_expiry_date: parseDate(row['Passport Expiry Date'] || row['passport_expiry_date']),
        cdc_issue_date: parseDate(row['CDC Issue Date'] || row['cdc_issue_date']),
        cdc_expiry_date: parseDate(row['CDC Expiry Date'] || row['cdc_expiry_date']),

        // Employment & Personal
        rank: getValue(row, ['Rank', 'Trainee Type', 'Designation', 'rank']) || 'CADET',
        nationality: getValue(row, ['Nationality', 'Country', 'nationality']) || 'Unknown',
        gender: getValue(row, ['Gender', 'Sex', 'gender']),
        blood_group: getValue(row, ['Blood Group', 'BloodGroup', 'blood_group']),
        
        // Contact
        phone: getValue(row, ['Mobile', 'Phone', 'Cell', 'phone']),
        address: getValue(row, ['Address', 'Home Address', 'address']),
        city: getValue(row, ['City', 'city']),
        state: getValue(row, ['State', 'state']),
        country: getValue(row, ['Country (ISO)', 'Country', 'country']),
        pincode: getValue(row, ['Pin Code', 'Zip', 'pincode']),

        // Next of Kin
        kin_name: getValue(row, ['Emergency Contact Name', 'Kin Name', 'Next of Kin']),
        kin_relation: getValue(row, ['Relation', 'Kin Relation']),
        kin_mobile: getValue(row, ['Emergency Mobile', 'Kin Mobile']),
        kin_email: getValue(row, ['Emergency Email', 'Kin Email']),

        // Documents
        passport_number: getValue(row, ['Passport No', 'Passport Number']),
        passport_place: getValue(row, ['Passport Place', 'Place of Issue']),
        cdc_number: getValue(row, ['CDC No', 'CDC Number']),
        cdc_country: getValue(row, ['CDC Country']),
        indos_number: getValue(row, ['INDoS No', 'INDoS']),
        sid_number: getValue(row, ['SID No', 'SID'])
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
        console.error("Row Error:", err);
        skipped.push({ email, reason: 'Database Error' });
      }
    }

    res.json({
      message: 'Import processed',
      summary: {
        total_rows: rows.length,
        imported: success.length,
        skipped_count: skipped.length,
        skipped_details: skipped
      }
    });

  } catch (error) {
    console.error('Import Error:', error);
    res.status(500).json({ message: 'Failed to process import file' });
  }
};

// --- 2. IMPORT VESSELS ---
export const importVessels = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // @ts-ignore
    const companyId = req.user.company_id;
    const rows: any[] = parseExcel(req.file.buffer);
    
    const success: any[] = [];
    const skipped: any[] = [];

    for (const row of rows) {
      const name = getValue(row, ['Vessel Name', 'VesselName', 'Name']);
      const imo = getValue(row, ['IMO Number', 'IMO', 'Imo']);
      const type = getValue(row, ['Vessel Type', 'Type']) || 'Bulk Carrier';
      const flag = getValue(row, ['Flag', 'Country']) || 'Unknown';
      const society = getValue(row, ['Classification Society', 'Class', 'Society']) || 'Unknown';

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
        await Vessel.create({
          name: name,
          imo_number: imo,
          company_id: companyId,
          vessel_type: type,
          flag: flag,
          class_society: society,
          status: 'Active'
        });
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