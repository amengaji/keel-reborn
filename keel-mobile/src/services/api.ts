//keel-mobile/src/services/api.ts

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// NOTE: Use your PC's Local IP if testing on a real device (e.g., http://192.168.1.5:5000/api)
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
      // In a real app, you might trigger a navigation event to Login here
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

export const assignmentService = {
  getMyTasks: async () => {
    // We need to create this endpoint in the backend for the Cadet View
    const response = await api.get('/trainee-assignments/my-tasks'); 
    return response.data;
  },
  
  updateProgress: async (assignmentId: number, progress: number) => {
    const response = await api.put(`/assignments/${assignmentId}/progress`, { progress });
    return response.data;
  }
};

export default api;