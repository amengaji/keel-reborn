//keel-web/src/services/taskService.ts

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * MANDATORY INTERFACE FOR MARITIME TASKS
 * Ensures all tasks follow the STCW Function categorization
 */
export interface Task {
  id?: number;
  code: string;
  title: string;
  description?: string;
  instructions?: string;
  stcw_code?: string;
  function_code: string; 
  department: string;
  category: string;
  safety_level: string;
  trainee_type: string;
  frequency: string;
  mandatory: boolean;
  evidence_type: string;
  verification_method: string;
}

/**
 * HELPER: GET AUTH HEADERS
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('keel_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

/**
 * GET ALL TASKS (STCW SYLLABUS STRUCTURE)
 * Backend returns:
 * [
 *   {
 *     id: "FUNC-1",
 *     topics: [
 *       {
 *         id: "TOPIC-1",
 *         title: "...",
 *         tasks: [...]
 *       }
 *     ]
 *   }
 * ]
 */
export const getTasks = async (): Promise<any[]> => {
  const res = await fetch(`${API_URL}/tasks`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch tasks");
  }

  return res.json();
};

/**
 * CREATE TASK
 * Required for manual task entry
 */
export const createTask = async (taskData: Partial<Task>): Promise<Task> => {
  const res = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData)
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to create task');
  }
  return res.json();
};

/**
 * UPDATE TASK
 */
export const updateTask = async (id: number, taskData: Partial<Task>): Promise<Task> => {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData)
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
};

/**
 * DELETE SINGLE TASK
 * This name MUST match the import in TasksPage.tsx exactly
 */
export const deleteSingleTask = async (id: number): Promise<void> => {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete task');
};

/**
 * DELETE ALL TASKS
 */
export const deleteAllTasks = async (): Promise<void> => {
  const res = await fetch(`${API_URL}/tasks`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to wipe task library');
};