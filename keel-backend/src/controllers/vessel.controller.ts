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
    const { 
      name, 
      imoNumber, imo_number, 
      vesselType, vessel_type,
      flag, 
      classSociety, 
      is_active = true
    } = req.body;

    console.log(req.body)

    const payload = {
      name: name,
      // Map whatever name the frontend uses to 'imo_number'
      imo_number: String(imoNumber || imo_number || ''), 
      vessel_type: String(vesselType || vessel_type || 'Other'),
      flag: flag || 'Unknown',
      classSociety:classSociety,
      is_active:is_active
    };

    // Validation
    if (!payload.name || payload.imo_number === 'undefined' || !payload.imo_number) {
      return res.status(400).json({ message: "Vessel Name and valid IMO Number are required." });
    }

    const newVessel = await Vessel.create(payload);
    res.status(201).json(newVessel);
  } catch (error: any) {
    console.error("Vessel Create Error:", error);
    res.status(500).json({ message: 'Error creating vessel', error: error.message });
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
      res.json({ message: 'Vessel deleted' });
    } else {
      res.status(404).json({ message: 'Vessel not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting vessel', error: error.message });
  }
};