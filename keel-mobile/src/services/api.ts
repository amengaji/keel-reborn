//keel-mobile/src/services/api.ts

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// NOTE: Use your PC's Local IP if testing on a real device
// Use http://10.0.2.2:5000/api if using Android Emulator
export const API_URL = 'http://192.168.86.247:5000/api'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add Token
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

// Response Interceptor: Handle 401 (Unauthorized)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.multiRemove(['keel_token', 'keel_user']);
    }
    return Promise.reject(error);
  }
);

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

// ✅ NEW: Service to handle Vessel Lists
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

  // ✅ NEW: Explicit function to Join a Ship
  joinVessel: async (data: { sign_on_date: string; sign_on_port: string; vesselId?: number }) => {
    const response = await api.post('/trainee-assignments/join', data);
    return response.data;
  }
};

// Add this inside your existing 'api' object or create a new 'taskService' export

export const taskService = {
  /**
   * Fetches tasks assigned to a specific rank (e.g. 'DECK_CADET')
   * Backend should return: { id, title, description, section, category, min_evidence }
   */
  getByRank: async (rank: string) => {
    // We assume the backend handles the filtering based on the query param
    const response = await api.get(`/training-tasks?rank=${encodeURIComponent(rank)}`);
    return response.data; 
  },

  /**
   * Optional: Upload local progress to backend
   */
  syncProgress: async (progressData: any) => {
    const response = await api.post('/training-tasks/sync', progressData);
    return response.data;
  }
};

export default api;