// keel-backend/src/controllers/task.controller.ts

import { Request, Response } from 'express';
import Task from '../models/Task';
import sequelize from '../config/database';

const STCW_MAP: Record<string, string> = {
  'Function 1': 'Navigation',
  'Function 2': 'Cargo Handling & Stowage',
  'Function 3': 'Ship Operations & Care',
  'Function 4': 'Marine Engineering',
  'Function 5': 'Electrical & Control',
  'Function 6': 'Maintenance & Repair',
  'Function 7': 'Radio Communications'
};

// GET ALL TASKS
export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await Task.findAll({ order: [['function_code', 'ASC'], ['code', 'ASC']] });
    
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
        
        // FIXED: Return the stored STCW code
        stcw: task.stcw_code || '', 
        
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
    res.json(tree); 
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

// CREATE TASK
export const createTask = async (req: Request, res: Response) => {
  try {
    const { 
      code, stcw, title, description, instructions, instruction,
      department, dept, section, category, partNum, function_code, 
      safety_level, safety, trainee_type, traineeType,
      frequency, mandatory, mandatory_for_all,
      evidence_type, evidence, verification_method, verification
    } = req.body;

    const payload = {
      code: code || `TRB-${Date.now()}`, 
      
      // FIXED: Store STCW Reference specifically
      stcw_code: stcw || '', 
      
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
    const { id } = req.params;
    const body = req.body;
    const payload = {
      title: body.title,
      stcw_code: body.stcw, // Map form 'stcw' to DB 'stcw_code'
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
    await Task.update(payload, { where: { id } });
    const updated = await Task.findByPk(id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

// DELETE TASK
export const deleteTask = async (req: Request, res: Response) => {
  try {
    await Task.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};

// BULK DELETE
export const deleteAllTasks = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    // 1️⃣ Delete dependent records FIRST
    // ⚠️ Adjust table/model names if yours differ

    await sequelize.query(`DELETE FROM assignments`, { transaction: t });
    // If you have more FK tables, add them here in correct order:
    // await sequelize.query(`DELETE FROM cadet_tasks`, { transaction: t });

    // 2️⃣ Delete tasks (NO TRUNCATE)
    await Task.destroy({
      where: {},
      truncate: false,
      transaction: t,
    });

    await t.commit();
    res.json({ message: 'All tasks deleted successfully.' });

  } catch (error: any) {
    await t.rollback();
    console.error('BULK DELETE ERROR:', error);
    res.status(500).json({
      message: 'Failed to delete all tasks safely',
      error: error.message,
    });
  }
};