//keel-web/src/services/authService.ts

const API_URL = 'http://localhost:5000/api/auth';

export interface UserProfile {
  id: number | string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  
  rank?: string;       
  department?: string; 
  status?: string;
  companyId?: number;
  companyName?: string;
  avatar?: string;

  // ✅ ADDED VESSEL INFO
  vesselId?: number;
  vesselName?: string;

  cocNumber?: string;
  seamanBookNumber?: string;
  mfaEnabled?: boolean;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  refreshToken?: string;
  user: UserProfile;
}

export const getCurrentUser = (): UserProfile | null => {
  try {
    const data = localStorage.getItem('keel_user');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const loginOfficer = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed.');
    }

    localStorage.setItem('keel_token', data.accessToken);
    localStorage.setItem('keel_user', JSON.stringify(data.user));
    return data;
  } catch (error: any) {
    console.error('Login Error:', error.message);
    throw error;
  }
};

export const logoutOfficer = () => {
  localStorage.removeItem('keel_token');
  localStorage.removeItem('keel_user');
  window.location.href = '/login';
};

// --- SETTINGS METHODS ---

export const changePassword = async (userId: number | string, currentPassword: string, newPassword: string) => {
  const response = await fetch(`${API_URL}/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, currentPassword, newPassword }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to change password');
  }
  return await response.json();
};

export const updateProfile = async (userId: number | string, data: { cocNumber?: string, seamanBookNumber?: string, mfaEnabled?: boolean }) => {
  const response = await fetch(`${API_URL}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...data }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update profile');
  }
  
  const result = await response.json();
  if (result.user) {
    const currentUser = getCurrentUser() || {};
    const updatedUser = { ...currentUser, ...result.user };
    localStorage.setItem('keel_user', JSON.stringify(updatedUser));
  }
  return result;
};