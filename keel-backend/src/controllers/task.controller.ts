//keel-backend/src/controllers/task.controller.ts

import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Task from '../models/Task';
import sequelize from '../config/database';
import TaskEvidence from '../models/TaskEvidence';

const STCW_MAP: Record<string, string> = {
  'Function 1': 'Navigation',
  'Function 2': 'Cargo Handling & Stowage',
  'Function 3': 'Ship Operations & Care',
  'Function 4': 'Marine Engineering',
  'Function 5': 'Electrical & Control',
  'Function 6': 'Maintenance & Repair',
  'Function 7': 'Radio Communications'
};

/**
 * ============================================================
 * GET MOBILE TASKS (SYNC ENDPOINT) - UPDATED
 * ============================================================
 */
export const getMobileTasks = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const user = req.user;
    const rank = req.query.rank as string;

    if (!rank) {
      return res.status(400).json({ message: "Rank query parameter is required." });
    }

    const visibilityClause = user.role === 'SUPER_ADMIN' 
      ? {} 
      : {
          [Op.or]: [
            { company_id: null },
            { company_id: user.company_id }
          ]
        };

    // Filter by Exact Rank Match for now
    const rankClause = { trainee_type: rank };

    const tasks = await Task.findAll({
      where: {
        ...visibilityClause,
        ...rankClause
      },
      // ✅ UPDATED: Added all requested metadata fields
      attributes: [
        'id', 'code', 'title', 'description', 'instructions', 
        'category', 'function_code', 'trainee_type', 'mandatory',
        'stcw_code', 'safety_level', 'frequency'
      ]
    });

    // Map to Mobile Schema
    const mobileData = tasks.map(t => ({
      id: t.id,
      task_key: t.code,        
      title: t.title,          // This is the Group Title (e.g. "COLREGS")
      description: t.description || t.title, // This is the specific item (e.g. "Rule 01")
      
      // ✅ NEW FIELDS
      instructions: t.instructions,
      stcw_code: t.stcw_code,
      safety_level: t.safety_level,
      frequency: t.frequency,

      section: t.function_code, 
      category: t.category,     
      rank: t.trainee_type,
      min_evidence: t.mandatory ? 1 : 0 
    }));

    res.json(mobileData);

  } catch (error: any) {
    console.error("Mobile Sync Error:", error);
    res.status(500).json({ message: "Failed to fetch mobile tasks", error: error.message });
  }
};

// --- UPLOAD EVIDENCE ---
export const uploadEvidence = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { taskId, description } = req.body;
    const file = req.file; 

    if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const fileUrl = `/uploads/${file.filename}`; 

    const evidence = await TaskEvidence.create({
        user_id: userId,
        task_id: taskId,
        file_url: fileUrl,
        file_type: 'IMAGE', 
        description
    });

    res.status(201).json(evidence);
  } catch (error) {
    console.error("Evidence Upload Error:", error);
    res.status(500).json({ message: "Failed to upload evidence" });
  }
};

// --- GET EVIDENCE FOR TASK ---
export const getTaskEvidence = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { taskId } = req.params;

    const evidence = await TaskEvidence.findAll({
        where: { user_id: userId, task_id: taskId }
    });

    res.json(evidence);
  } catch (error) {
    res.status(500).json({ message: "Error fetching evidence" });
  }
};

// GET ALL TASKS (Tree Structure for Web)
export const getTasks = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const user = req.user;
    
    let whereClause = {
      [Op.or]: [
        { company_id: null },
        { company_id: user.company_id }
      ]
    };
 
    const tasks = await Task.findAll({
      where: whereClause,
      order: [['function_code', 'ASC'], ['code', 'ASC']]
    });
    
    const tree: any[] = [];
 
    tasks.forEach((task: any) => {
      const funcNum =
        task.function_code && STCW_MAP[task.function_code]
          ? task.function_code
          : '1';
 
      const funcId = `FUNC-${funcNum}`;
      
      let funcNode = tree.find(f => f.id === funcId);
      if (!funcNode) {
        funcNode = {
          id: funcId,
          title: `Function ${funcNum}: ${STCW_MAP[funcNum] || 'General'}`,
          topics: []
        };
        tree.push(funcNode);
      }
 
      const topicTitle = task.category || 'General Tasks';
      const topicId = `TOPIC-${topicTitle.replace(/\s+/g, '-')}`;
      
      let topicNode = funcNode.topics.find((t: any) => t.id === topicId);
      if (!topicNode) {
        topicNode = { id: topicId, title: topicTitle, tasks: [] };
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
        rank: task.trainee_type,
        safety: task.safety_level,
        frequency: task.frequency,
        mandatory: task.mandatory,
        evidence: task.evidence_type,
        verification: task.verification_method,
      });
    });
 
    tree.sort((a, b) => a.id.localeCompare(b.id));
    return res.status(200).json({ success: true, message: "Tasks fetched successfully", data: tree });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Error fetching tasks', error: error.message });
  }
};

// CREATE TASK
export const createTask = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const user = req.user;
    
    const { 
      code, stcw, title, description, instructions, instruction,
      department, dept, section, category, partNum, function_code, 
      safety_level, safety, trainee_type, traineeType,
      frequency, mandatory, mandatory_for_all,
      evidence_type, evidence, verification_method, verification
    } = req.body;

    let companyIdToSet = null;
    if (user.role === 'SUPER_ADMIN') {
        companyIdToSet = null; 
    } else {
        if (!user.company_id) return res.status(400).json({ message: 'User not linked to a company' });
        companyIdToSet = user.company_id; 
    }

    const payload = {
      code: code || `TRB-${Date.now()}`, 
      stcw_code: stcw || '', 
      company_id: companyIdToSet, 
      title: title,
      description: description,
      instructions: instructions || instruction,
      department: department || dept || 'Deck',
      category: section || category || 'General',
      function_code: partNum || function_code || '1', 
      trainee_type: trainee_type || traineeType || 'DECK_CADET',
      safety_level: ['Green', 'Amber', 'Red'].includes(safety_level || safety) ? (safety_level || safety) : 'None',
      frequency: frequency || 'ONCE',
      mandatory: mandatory !== undefined ? mandatory : (mandatory_for_all !== undefined ? mandatory_for_all : true),
      evidence_type: evidence_type || evidence || 'DOCUMENT/PHOTO',
      verification_method: verification_method || verification || 'OBSERVATION'
    };

    if (!payload.title) return res.status(400).json({ message: 'Task Title is required.' });

    const newTask = await Task.create(payload);
    res.status(201).json(newTask);
  } catch (error: any) {
    console.error("Backend Create Error:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Task code must be unique.' });
    }
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

// UPDATE TASK
export const updateTask = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const user = req.user;
    const { id } = req.params;
    
    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (task.company_id === null && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Cannot edit Global Standard Tasks.' });
    }
    if (task.company_id !== null && task.company_id !== user.company_id && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Forbidden: This task belongs to another company.' });
    }

    const body = req.body;
    const payload = {
      title: body.title,
      stcw_code: body.stcw,
      description: body.description,
      instructions: body.instruction || body.instructions,
      category: body.section || body.category,
      function_code: body.partNum || body.function_code,
      department: body.dept || body.department,
      trainee_type: body.traineeType || body.trainee_type,
      safety_level: body.safety || body.safety_level,
      frequency: body.frequency,
      mandatory: body.mandatory,
      evidence_type: body.evidence || body.evidence_type,
      verification_method: body.verification || body.verification_method
    };
    
    Object.keys(payload).forEach(key => (payload as any)[key] === undefined && delete (payload as any)[key]);
    
    await task.update(payload);
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

// DELETE TASK
export const deleteTask = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const user = req.user;
    const { id } = req.params;

    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (task.company_id === null && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Cannot delete Global Standard Tasks.' });
    }
    if (task.company_id !== null && task.company_id !== user.company_id && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Forbidden: This task belongs to another company.' });
    }

    await task.destroy();
    res.json({ message: 'Task deleted' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};

// BULK DELETE
export const deleteAllTasks = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  try {
    // @ts-ignore
    const user = req.user;

    let whereClause = {};
    if (user.role === 'SUPER_ADMIN') {
        whereClause = {}; 
    } else {
        whereClause = { company_id: user.company_id };
    }

    if (user.role !== 'SUPER_ADMIN') {
        const tasksToDelete = await Task.findAll({ attributes: ['id'], where: whereClause, transaction: t });
        const ids = tasksToDelete.map(task => task.id);
        
        if (ids.length > 0) {
            await sequelize.query(`DELETE FROM assignments WHERE task_id IN (:ids)`, { 
                replacements: { ids }, 
                transaction: t 
            });
            await Task.destroy({ where: { id: ids }, transaction: t });
        }
    } else {
        await sequelize.query(`DELETE FROM assignments`, { transaction: t });
        await Task.destroy({ where: {}, truncate: false, transaction: t });
    }

    await t.commit();
    res.json({ message: 'Tasks deleted successfully based on your permission level.' });

  } catch (error: any) {
    await t.rollback();
    console.error('BULK DELETE ERROR:', error);
    res.status(500).json({
      message: 'Failed to delete all tasks safely',
      error: error.message,
    });
  }
};

