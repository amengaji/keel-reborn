//keel-backend/src/controllers/assignment.controller.ts

import { Request, Response } from 'express';
import Assignment from '../models/Assignment';
import Task from '../models/Task';
import User from '../models/User';
import { Op } from 'sequelize';

// --- INITIALIZATION ---
export const initializeTRB = async (req: Request, res: Response) => {
  try {
    const { userId, department } = req.body; 

    // 1. Get all tasks for that department
    const tasks = await Task.findAll({ where: { department } });

    if (!tasks.length) {
      return res.status(404).json({ message: `No tasks found for department: ${department}` });
    }

    // 2. Bulk create assignments
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

/**
 * ============================================================
 * MOBILE SYNC STATUS UPDATE
 * This receives the 'PENDING_REVIEW' status from the app.
 * ============================================================
 */
export const syncMobileStatus = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const { taskKey, status, evidenceUrl } = req.body;

        // 1. Find the task ID based on the taskKey (e.g. "D-1.1")
        const task = await Task.findOne({ where: { code: taskKey } });
        if (!task) return res.status(404).json({ message: "Task code not found" });

        // 2. Find or Create the Assignment
        const [assignment, created] = await Assignment.findOrCreate({
            where: { user_id: userId, task_id: task.id },
            defaults: { status: 'Not Started', progress: 0 }
        });

        // 3. Update Status
        if (status === 'PENDING_REVIEW') {
            await assignment.update({ 
                status: 'Pending Review',
                progress: 100, // Submission implies work is done
                evidence_url: evidenceUrl || assignment.evidence_url 
            });
        } else if (status === 'IN_PROGRESS') {
             await assignment.update({ status: 'In Progress' });
        }

        res.json({ message: "Status synced", status: assignment.status });
    } catch (error: any) {
        console.error("Sync Error:", error);
        res.status(500).json({ message: "Sync failed", error: error.message });
    }
};

// --- CTO APPROVALS (STEP 1) ---

/**
 * GET PENDING CTO APPROVALS
 * Criteria: Status is 'Pending Review' AND CTO has NOT signed yet.
 */
export const getPendingCTOApprovals = async (req: Request, res: Response) => {
  try {
    const pendingTasks = await Assignment.findAll({
      where: {
        // ✅ UPDATED: Look for explicit status OR 100% progress
        [Op.or]: [
             { status: 'Pending Review' },
             { progress: { [Op.gte]: 100 } } 
        ],
        cto_id: null // Not verified by CTO yet
      },
      include: [
        { 
          model: User, 
          as: 'cadet', 
          attributes: ['id', 'first_name', 'last_name', 'rank', 'department'] 
        },
        { 
          model: Task, 
          as: 'template',
          attributes: ['id', 'title', 'code', 'category']
        }
      ]
    });

    res.json(pendingTasks);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching CTO queue', error: error.message });
  }
};

/**
 * CTO SIGN OFF
 */
export const ctoSignOff = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    // @ts-ignore
    const ctoId = req.user?.userId;

    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    await assignment.update({
      cto_id: ctoId,
      cto_signed_at: new Date(),
      status: 'Review' // Marks it as ready for Master (or we can keep as In Progress until Master signs)
    });

    res.json({ message: 'Technical verification complete.', assignment });
  } catch (error: any) {
    res.status(500).json({ message: 'Error signing off', error: error.message });
  }
};


// --- MASTER APPROVALS (STEP 2) ---

/**
 * GET PENDING MASTER APPROVALS
 * Criteria: CTO HAS signed, but Master has NOT.
 */
export const getPendingMasterApprovals = async (req: Request, res: Response) => {
  try {
    const pendingTasks = await Assignment.findAll({
      where: {
        cto_id: { [Op.not]: null }, // CTO must have signed first
        officer_id: null            // Master hasn't signed yet
      },
      include: [
        { 
          model: User, 
          as: 'cadet', 
          attributes: ['id', 'first_name', 'last_name', 'rank', 'department'] 
        },
        { 
          model: Task, 
          as: 'template',
          attributes: ['id', 'title', 'code', 'category']
        }
      ]
    });

    res.json(pendingTasks);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching Master queue', error: error.message });
  }
};

/**
 * MASTER SIGN OFF (Final)
 */
export const masterSignOff = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    // @ts-ignore
    const officerId = req.user?.userId;

    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Enforce Chain of Command: Fail if CTO hasn't signed
    if (!assignment.cto_id) {
        return res.status(403).json({ message: 'Chain of Command Violation: CTO must verify this task first.' });
    }

    await assignment.update({
      officer_id: officerId,
      signed_off_at: new Date(),
      status: 'Completed' // Final Closed State
    });

    res.json({ message: 'Task approved and closed.', assignment });
  } catch (error: any) {
    res.status(500).json({ message: 'Error signing off', error: error.message });
  }
};