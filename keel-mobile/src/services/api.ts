//keel-mobile/src/services/api.ts

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------------------------
// MARITIME EXPERT TIP: When switching between home and office, ensure your 
// backend server is bound to 0.0.0.0 and this IP matches your host machine.
export const API_URL = 'http://192.168.86.247:5000/api'; 

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 second timeout for weak satellite links
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// INTERCEPTORS (The Security Bridge)
// ---------------------------------------------------------------------------

// Request: Attach Digital Signature (Token)
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('keel_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // LOG: Only for debugging cross-PC auth issues
      // console.log(`[API] Secure Request to: ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('[API] Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response: Handling the "401 Unauthorized" Loop
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401: Unauthorized / Session Expired
    if (error.response?.status === 401) {
      console.warn('[API] 401 Unauthorized detected. Clearing stale credentials.');
      
      // Clear storage to prevent infinite sync loops
      await AsyncStorage.multiRemove(['keel_token', 'keel_user']);
      
      // UX DECISION: We return a specific error message so the 
      // SyncEngine knows to STOP and wait for re-authentication.
      error.message = "SESSION_EXPIRED";
    }

    if (error.code === 'ECONNABORTED') {
      console.error('[API] Link Timeout. Vessel server is taking too long to respond.');
    }

    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// EXPORTED MARITIME SERVICES
// ---------------------------------------------------------------------------

export const authService = {
  /**
   * Primary Login for Trainees
   */
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      console.error('[AuthService] Login failure');
      throw error;
    }
  },
  
  /**
   * Refresh the local user profile from the server
   */
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export const vesselService = {
  /**
   * Fetches the global fleet list for onboarding
   */
  getAll: async () => {
    const response = await api.get('/vessels');
    return response.data;
  }
};

export const assignmentService = {
  /**
   * Retrieves tasks linked to the current vessel assignment
   */
  getMyTasks: async () => {
    const response = await api.get('/trainee-assignments/my-tasks'); 
    return response.data;
  },
  
  /**
   * Updates general career progress
   */
  updateProgress: async (assignmentId: number, progress: number) => {
    const response = await api.put(`/assignments/${assignmentId}/progress`, { progress });
    return response.data;
  },

  /**
   * Joins a new vessel (Creates active assignment)
   */
  joinVessel: async (data: { sign_on_date: string; sign_on_port: string; vesselId?: number }) => {
    const response = await api.post('/trainee-assignments/join', data);
    return response.data;
  }
};

export const taskService = {
  /**
   * Mobile Sync: Downloads all required TRB tasks for a specific rank
   */
  getByRank: async (rank: string) => {
    const response = await api.get(`/tasks/sync?rank=${encodeURIComponent(rank)}`);
    return response.data; 
  },

  /**
   * Pushes completed tasks and evidence to the cloud/vessel server
   */
  syncProgress: async (progressData: any) => {
    const response = await api.post('/tasks/sync-progress', progressData);
    return response.data;
  }
};

/**
 * REVIEW SERVICE
 * Added to resolve the "Failed to fetch reviews" error in your logs.
 */
export const reviewService = {
  getRecent: async () => {
    const response = await api.get('/monthly-reviews/my-reviews');
    return response.data;
  }
};

export default api;