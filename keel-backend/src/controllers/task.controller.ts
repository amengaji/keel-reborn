// keel-backend/src/controllers/task.controller.ts
// ============================================================================
// TASK CONTROLLER (WEB + MOBILE)
// FIX APPLIED:
// - GET /tasks now returns ARRAY directly (frontend-safe)
// - No response wrapping { success, data }
// - All existing logic preserved
// ============================================================================

import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Task from '../models/Task';
import sequelize from '../config/database';
import TaskEvidence from '../models/TaskEvidence';

// ---------------------------------------------------------------------------
// STCW FUNCTION MAP
// ---------------------------------------------------------------------------
const STCW_MAP: Record<string, string> = {
  '1': 'Navigation',
  '2': 'Cargo Handling & Stowage',
  '3': 'Ship Operations & Care',
  '4': 'Marine Engineering',
  '5': 'Electrical & Control',
  '6': 'Maintenance & Repair',
  '7': 'Radio Communications',
};

// ---------------------------------------------------------------------------
// GET MOBILE TASKS (SYNC ENDPOINT)
// ---------------------------------------------------------------------------
export const getMobileTasks = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const user = req.user;
    const rank = req.query.rank as string;

    if (!rank) {
      return res.status(400).json({ message: 'Rank query parameter is required.' });
    }

    const visibilityClause =
      user.role === 'SUPER_ADMIN'
        ? {}
        : {
            [Op.or]: [{ company_id: null }, { company_id: user.company_id }],
          };

    const tasks = await Task.findAll({
      where: {
        ...visibilityClause,
        trainee_type: rank,
      },
      attributes: [
        'id',
        'code',
        'title',
        'description',
        'instructions',
        'category',
        'function_code',
        'trainee_type',
        'mandatory',
        'stcw_code',
        'safety_level',
        'frequency',
      ],
    });

    const mobileData = tasks.map((t) => ({
      id: t.id,
      task_key: t.code,
      title: t.title,
      description: t.description || t.title,
      instructions: t.instructions,
      stcw_code: t.stcw_code,
      safety_level: t.safety_level,
      frequency: t.frequency,
      section: t.function_code,
      category: t.category,
      rank: t.trainee_type,
      min_evidence: t.mandatory ? 1 : 0,
    }));

    res.json(mobileData);
  } catch (error: any) {
    console.error('Mobile Sync Error:', error);
    res.status(500).json({
      message: 'Failed to fetch mobile tasks',
      error: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// GET TASK EVIDENCE
// ---------------------------------------------------------------------------
export const getTaskEvidence = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { taskId } = req.params;

    const evidence = await TaskEvidence.findAll({
      where: { user_id: userId, task_id: taskId },
    });

    res.json(evidence);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching evidence', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// UPLOAD TASK EVIDENCE
// ---------------------------------------------------------------------------
export const uploadEvidence = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { taskId, description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${file.filename}`;

    const evidence = await TaskEvidence.create({
      user_id: userId,
      task_id: taskId,
      file_url: fileUrl,
      file_type: 'IMAGE',
      description,
    });

    res.status(201).json(evidence);
  } catch (error: any) {
    console.error('Evidence Upload Error:', error);
    res.status(500).json({
      message: 'Failed to upload evidence',
      error: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// GET ALL TASKS (WEB TREE VIEW)  ✅ FIXED
// IMPORTANT:
// - RETURNS ARRAY DIRECTLY
// - FRONTEND EXPECTS Array.isArray(response) === true
// ---------------------------------------------------------------------------
export const getTasks = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const user = req.user;

    const whereClause = {
      [Op.or]: [{ company_id: null }, { company_id: user.company_id }],
    };

    const tasks = await Task.findAll({
      where: whereClause,
      order: [['function_code', 'ASC'], ['code', 'ASC']],
    });

    const tree: any[] = [];

    tasks.forEach((task: any) => {
      const funcNum =
        String(task.function_code || '1').match(/\d+/)?.[0] || '1';

      const funcId = `FUNC-${funcNum}`;

      let funcNode = tree.find((f) => f.id === funcId);
      if (!funcNode) {
        funcNode = {
          id: funcId,
          title: `Function ${funcNum}: ${STCW_MAP[funcNum] || 'General'}`,
          topics: [],
        };
        tree.push(funcNode);
      }

      const topicTitle = task.category || 'General Tasks';
      const topicId = `TOPIC-${topicTitle.replace(/\s+/g, '-')}`;

      let topicNode = funcNode.topics.find((t: any) => t.id === topicId);
      if (!topicNode) {
        topicNode = {
          id: topicId,
          title: topicTitle,
          tasks: [],
        };
        funcNode.topics.push(topicNode);
      }

      topicNode.tasks.push({
        id: task.id,
        code: task.code,
        title: task.title,
        description: task.description || '',
        instructions: task.instructions || '',
        stcw: task.stcw_code || '',
        company_id: task.company_id,
        is_global: task.company_id === null,
        function_code: task.function_code,
        category: task.category,
        department: task.department,
        trainee_type: task.trainee_type,
        safety_level: task.safety_level,
        frequency: task.frequency,
        mandatory: task.mandatory,
        evidence_type: task.evidence_type,
        verification_method: task.verification_method,
      });
    });

    tree.sort((a, b) => a.id.localeCompare(b.id));

    // ✅ CRITICAL FIX: RETURN ARRAY DIRECTLY
    return res.status(200).json(tree);
  } catch (error: any) {
    console.error('GET TASKS ERROR:', error);
    res.status(500).json({
      message: 'Error fetching tasks',
      error: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// CREATE TASK
// ---------------------------------------------------------------------------
export const createTask = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const user = req.user;

    const {
      code,
      stcw,
      title,
      description,
      instructions,
      department,
      category,
      function_code,
      safety_level,
      trainee_type,
      frequency,
      mandatory,
      evidence_type,
      verification_method,
    } = req.body;

    const company_id =
      user.role === 'SUPER_ADMIN' ? null : user.company_id;

    if (!title) {
      return res.status(400).json({ message: 'Task title is required.' });
    }

    const newTask = await Task.create({
      code: code || `TRB-${Date.now()}`,
      stcw_code: stcw || '',
      title,
      description,
      instructions,
      department: department || 'Deck',
      category: category || 'General',
      function_code: function_code || '1',
      trainee_type: trainee_type || 'DECK_CADET',
      safety_level: safety_level || 'None',
      frequency: frequency || 'ONCE',
      mandatory: mandatory ?? true,
      evidence_type: evidence_type || 'DOCUMENT/PHOTO',
      verification_method: verification_method || 'OBSERVATION',
      company_id,
    });

    res.status(201).json(newTask);
  } catch (error: any) {
    console.error('CREATE TASK ERROR:', error);
    res.status(500).json({
      message: 'Error creating task',
      error: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// UPDATE TASK
// ---------------------------------------------------------------------------
export const updateTask = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const user = req.user;
    const { id } = req.params;

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.company_id === null && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        message: 'Forbidden: Cannot edit global tasks',
      });
    }

    await task.update(req.body);
    res.json(task);
  } catch (error: any) {
    console.error('UPDATE TASK ERROR:', error);
    res.status(500).json({
      message: 'Error updating task',
      error: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// DELETE TASK
// ---------------------------------------------------------------------------
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.destroy();
    res.json({ message: 'Task deleted' });
  } catch (error: any) {
    console.error('DELETE TASK ERROR:', error);
    res.status(500).json({
      message: 'Error deleting task',
      error: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// DELETE ALL TASKS (ROLE SAFE)
// ---------------------------------------------------------------------------
export const deleteAllTasks = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    // @ts-ignore
    const user = req.user;

    const whereClause =
      user.role === 'SUPER_ADMIN'
        ? {}
        : { company_id: user.company_id };

    await Task.destroy({ where: whereClause, transaction });
    await transaction.commit();

    res.json({ message: 'All permitted tasks deleted.' });
  } catch (error: any) {
    await transaction.rollback();
    console.error('BULK DELETE ERROR:', error);
    res.status(500).json({
      message: 'Failed to delete tasks',
      error: error.message,
    });
  }
};
