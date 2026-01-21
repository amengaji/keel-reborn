//keel-backend/src/controllers/import.controller.ts

import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import User from '../models/User';
import Vessel from '../models/Vessel';
import Role from '../models/Role';
import Subscription from '../models/Subscription';
import bcrypt from 'bcryptjs';

// --- HELPER: ROBUST KEY MATCHER ---
// Allows finding 'Vessel Name' even if we ask for 'vesselname'
const getValue = (row: any, targetKeys: string[]) => {
  const normalize = (k: string) => String(k || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const rowKeys = Object.keys(row);
  
  for (const target of targetKeys) {
    const foundKey = rowKeys.find(k => normalize(k) === normalize(target));
    if (foundKey && row[foundKey]) return row[foundKey];
  }
  return null;
};

// --- HELPER: READ EXCEL TO JSON ---
const parseExcel = (buffer: Buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet);
};

// --- 1. IMPORT CADETS ---
export const importCadets = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const companyId = (req as any).user.company_id;
    const rows: any[] = parseExcel(req.file.buffer);

    // 1. Check License Limits
    const subscription = await Subscription.findOne({ where: { company_id: companyId } });
    if (!subscription) return res.status(403).json({ message: 'No active subscription found.' });
    
    const cadetRole = await Role.findOne({ where: { name: 'CADET' } });
    if (!cadetRole) return res.status(500).json({ message: 'System Error: Cadet Role missing.' });

    const currentCount = await User.count({ where: { company_id: companyId, role_id: cadetRole.id } });
    const remainingSeats = subscription.cadet_limit - currentCount;

    if (remainingSeats <= 0) {
      return res.status(403).json({ message: 'License limit reached. Cannot import new cadets.' });
    }

    // 2. Process Rows
    const success: any[] = [];
    const skipped: any[] = [];
    const defaultPasswordHash = await bcrypt.hash('Keel1234!', 10);

    for (const row of rows) {
      if (success.length >= remainingSeats) {
        skipped.push({ row, reason: 'License Limit Reached during import' });
        continue;
      }

      // Use Fuzzy Matching for Headers
      const email = getValue(row, ['Email', 'Email Address'])?.trim();
      const firstName = getValue(row, ['First Name', 'Name', 'Full Name'])?.trim()?.split(' ')[0] || 'Cadet';
      const lastName = getValue(row, ['Last Name', 'Surname'])?.trim() || getValue(row, ['Full Name'])?.trim()?.split(' ').slice(1).join(' ') || 'Unknown';
      const rank = getValue(row, ['Rank', 'Trainee Type', 'Designation']) || 'CADET';
      const nationality = getValue(row, ['Nationality', 'Country']) || 'Unknown';

      if (!email) {
        skipped.push({ row, reason: 'Missing Email Address' });
        continue;
      }

      // Check Duplicate
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        skipped.push({ email, reason: 'Email already exists' });
        continue;
      }

      try {
        await User.create({
          first_name: firstName,
          last_name: lastName,
          email: email,
          password_hash: defaultPasswordHash,
          role_id: cadetRole.id,
          company_id: companyId,
          rank: rank,
          status: 'Ready',
          nationality: nationality
        });
        success.push(email);
      } catch (err) {
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

    const companyId = (req as any).user.company_id;
    const rows: any[] = parseExcel(req.file.buffer);
    
    const success: any[] = [];
    const skipped: any[] = [];

    for (const row of rows) {
      const name = getValue(row, ['Vessel Name', 'VesselName', 'Name'])?.trim();
      const imo = getValue(row, ['IMO Number', 'IMO', 'Imo'])?.toString().trim();
      const type = getValue(row, ['Vessel Type', 'Type']) || 'Bulk Carrier';
      const flag = getValue(row, ['Flag', 'Country']) || 'Unknown';
      const society = getValue(row, ['Classification Society', 'Class', 'Society']) || 'Unknown';

      if (!name || !imo) {
        skipped.push({ row, reason: 'Missing Name or IMO Number' });
        continue;
      }

      // Check Duplicate IMO
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
          vessel_type: type, // <--- FIXED: Now maps correctly to database column 'vessel_type'
          flag: flag,
          class_society: society,
          status: 'Active'
        });
        success.push(name);
      } catch (err: any) {
        console.error("Vessel DB Error:", err);
        // Better error logging for debugging
        const reason = err.errors ? err.errors.map((e: any) => e.message).join(', ') : 'Database Error';
        skipped.push({ row: { name }, reason }); 
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