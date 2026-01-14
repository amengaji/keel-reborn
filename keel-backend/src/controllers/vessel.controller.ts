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
    const newVessel = await Vessel.create(req.body);
    res.status(201).json(newVessel);
  } catch (error: any) {
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