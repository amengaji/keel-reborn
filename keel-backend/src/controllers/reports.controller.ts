//keel-backend/src/controllers/reports.controller.ts

import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import User from '../models/User';
import Vessel from '../models/Vessel';
import Assignment from '../models/Assignment';
import Role from '../models/Role';
import { Op } from 'sequelize';

// --- HELPER: FETCH REPORT DATA ---
const getFleetData = async (companyId: number) => {
  // 1. Get Cadets
  const cadetRole = await Role.findOne({ where: { name: 'CADET' } });
  const cadets = await User.findAll({
    where: { company_id: companyId, role_id: cadetRole?.id },
    include: [{ model: Vessel, as: 'vessel' }]
  });

  // 2. Get Vessels
  const vessels = await Vessel.findAll({ where: { company_id: companyId } });

  // 3. Get Task Stats (Simple count for now)
  const stats = {
    total_cadets: cadets.length,
    onboard: cadets.filter(c => c.status === 'Onboard').length,
    ready: cadets.filter(c => c.status === 'Ready').length,
    total_vessels: vessels.length,
    active_vessels: vessels.filter(v => v.status === 'Active').length
  };

  return { cadets, vessels, stats };
};

// --- 1. GENERATE PDF REPORT ---
export const generateFleetPDF = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company_id;
    const { cadets, vessels, stats } = await getFleetData(companyId);

    const doc = new PDFDocument({ margin: 50 });

    // Set headers to force download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Fleet_Report.pdf');

    doc.pipe(res); // Stream directly to client

    // -- HEADER --
    doc.fontSize(20).text('Monthly Fleet Training Report', { align: 'center' });
    doc.fontSize(12).text(`Generated on: ${new Date().toDateString()}`, { align: 'center' });
    doc.moveDown();

    // -- STATS BOX --
    doc.rect(50, 100, 500, 70).stroke();
    doc.fontSize(10).text(`Total Cadets: ${stats.total_cadets}`, 60, 110);
    doc.text(`Onboard: ${stats.onboard}`, 200, 110);
    doc.text(`Ready Pool: ${stats.ready}`, 350, 110);
    
    doc.text(`Total Vessels: ${stats.total_vessels}`, 60, 130);
    doc.text(`Active Vessels: ${stats.active_vessels}`, 200, 130);

    doc.moveDown(5);

    // -- ONBOARD LIST --
    doc.fontSize(14).text('Cadets Currently Onboard', 50, 200);
    doc.fontSize(10).text('--------------------------------------------------------------------------');
    
    let y = 230;
    const onboardCadets = cadets.filter(c => c.status === 'Onboard');

    if (onboardCadets.length === 0) {
      doc.text('No cadets currently onboard.', 50, y);
    } else {
      // Table Header
      doc.font('Helvetica-Bold');
      doc.text('Name', 50, y);
      doc.text('Vessel', 200, y);
      doc.text('Rank', 350, y);
      doc.text('Sign On', 450, y);
      y += 20;
      doc.font('Helvetica');

      // Rows
      onboardCadets.forEach(c => {
        doc.text(`${c.first_name} ${c.last_name}`, 50, y);
        doc.text(c.vessel?.name || 'Unknown', 200, y);
        doc.text(c.rank || 'Cadet', 350, y);
        doc.text(c.sign_on_date ? new Date(c.sign_on_date).toLocaleDateString() : '-', 450, y);
        y += 20;
      });
    }

    doc.end();

  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ message: 'Failed to generate PDF report' });
  }
};

// --- 2. GENERATE EXCEL REPORT ---
export const generateFleetExcel = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company_id;
    const { cadets } = await getFleetData(companyId);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Cadet Roster');

    // Define Columns
    sheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Full Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Rank', key: 'rank', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Current Vessel', key: 'vessel', width: 20 },
      { header: 'Nationality', key: 'nationality', width: 15 },
      { header: 'Sign On Date', key: 'sign_on', width: 15 },
    ];

    // Style Header
    sheet.getRow(1).font = { bold: true };
    
    // Add Rows
    cadets.forEach(c => {
      sheet.addRow({
        id: c.id,
        name: `${c.first_name} ${c.last_name}`,
        email: c.email,
        rank: c.rank,
        status: c.status,
        vessel: c.vessel?.name || '-',
        nationality: c.nationality,
        sign_on: c.sign_on_date ? new Date(c.sign_on_date).toLocaleDateString() : '-'
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Fleet_Roster.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Excel Generation Error:', error);
    res.status(500).json({ message: 'Failed to generate Excel report' });
  }
};