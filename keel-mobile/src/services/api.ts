//keel-mobile/src/services/api.ts

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------------------------
// IMPORTANT: Change this IP address to your computer's local IP address.
// If your IP changes (e.g. office vs home), you must update this line.
export const API_URL = 'http://192.168.86.247:5000/api'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// INTERCEPTORS
// ---------------------------------------------------------------------------

// Request: Attach Token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('keel_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response: Handle 401 (Auto-Logout)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['keel_token', 'keel_user']);
    }
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// SERVICES
// ---------------------------------------------------------------------------

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export const vesselService = {
  getAll: async () => {
    const response = await api.get('/vessels');
    return response.data;
  }
};

export const assignmentService = {
  getMyTasks: async () => {
    const response = await api.get('/trainee-assignments/my-tasks'); 
    return response.data;
  },
  
  updateProgress: async (assignmentId: number, progress: number) => {
    const response = await api.put(`/assignments/${assignmentId}/progress`, { progress });
    return response.data;
  },

  joinVessel: async (data: { sign_on_date: string; sign_on_port: string; vesselId?: number }) => {
    const response = await api.post('/trainee-assignments/join', data);
    return response.data;
  }
};

export const taskService = {
  /**
   * Fetches tasks for Mobile Sync.
   * Endpoint: /api/tasks/sync?rank=...
   */
  getByRank: async (rank: string) => {
    // ✅ FIXED: Updated path to match Backend ('/tasks/sync')
    const response = await api.get(`/tasks/sync?rank=${encodeURIComponent(rank)}`);
    return response.data; 
  },

  syncProgress: async (progressData: any) => {
    // ✅ FIXED: Updated path to match Backend logic if you implemented a specific sync route
    // For now, assuming you might add this later.
    const response = await api.post('/tasks/sync-progress', progressData);
    return response.data;
  }
};

export default api;