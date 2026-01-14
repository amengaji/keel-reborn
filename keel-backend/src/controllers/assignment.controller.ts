import { Request, Response } from 'express';
import Assignment from '../models/Assignment';
import Task from '../models/Task';

export const initializeTRB = async (req: Request, res: Response) => {
  try {
    const { userId, department } = req.body; // e.g., userId: 5, department: 'Deck'

    // 1. Get all tasks for that department
    const tasks = await Task.findAll({ where: { department } });

    // 2. Bulk create assignments for this user
    const assignments = tasks.map(task => ({
      user_id: userId,
      task_id: task.id,
      status: 'Not Started',
      progress: 0
    }));

    await Assignment.bulkCreate(assignments);

    res.status(201).json({ message: `TRB Initialized with ${tasks.length} tasks.` });
  } catch (error: any) {
    res.status(500).json({ message: 'Error initializing TRB', error: error.message });
  }
};