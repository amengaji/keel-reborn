import { Request, Response } from 'express';
import Vessel from '../models/Vessel';

// GET ALL
export const getVessels = async (req: Request, res: Response) => {
  try {
    const vessels = await Vessel.findAll();
    res.json(vessels);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// CREATE
export const createVessel = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // Mapping Frontend Keys -> Database Columns
    const payload = {
      name: data.name,
      imo_number: data.imo || data.imoNumber || data.imo_number,
      vessel_type: data.type || data.vesselType || data.vessel_type,
      flag: data.flag || 'Unknown',
      class_society: data.classSociety || data.class_society,
      status: data.is_active === 'on' || data.is_active === true ? 'Active' : 'Inactive',
      is_active: data.is_active === 'on' || data.is_active === true
    };

    if (!payload.name || !payload.imo_number) {
      return res.status(400).json({ message: "Name and IMO Number are required." });
    }

    const newVessel = await Vessel.create(payload);
    res.status(201).json(newVessel);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE
export const updateVessel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [updated] = await Vessel.update(req.body, { where: { id } });
    if (updated) {
      const updatedVessel = await Vessel.findOne({ where: { id } });
      res.json(updatedVessel);
    } else {
      res.status(404).json({ message: 'Vessel not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating vessel', error: error.message });
  }
};

// DELETE
export const deleteVessel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Vessel.destroy({ where: { id } });
    
    if (deleted) {
      return res.status(200).json({ message: "Vessel removed successfully" });
    }
    throw new Error("Vessel not found");
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};