// keel-reborn/keel-web/src/services/authService.ts

const API_URL = 'http://localhost:5000/api/auth';

export interface LoginResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: number | string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    vesselId?: number; // Added to link CTO to a specific ship
  };
}

export const loginOfficer = async (email: string, password: string): Promise<LoginResponse> => {
  // --- CTO EMERGENCY OVERRIDE ---
  // Temporary hardcoded credentials for CTO Vessel Portal
  if (email === 'cto@keel.com' && password === 'cto@123') {
    const ctoData: LoginResponse = {
      message: 'CTO Command Authentication Successful',
      accessToken: 'mock-cto-token-secure',
      refreshToken: 'mock-cto-refresh',
      user: {
        id: 'CTO-001',
        email: 'cto@keel.com',
        firstName: 'Chief',
        lastName: 'Training Officer',
        role: 'CTO',
        vesselId: 1 // Hardlinked to Ocean Pioneer for this portal
      }
    };
    localStorage.setItem('keel_token', ctoData.accessToken);
    localStorage.setItem('keel_user', JSON.stringify(ctoData.user));
    return ctoData;
  }

  if (email === 'master@keel.com' && password === 'master@123') {
    const masterData: LoginResponse = {
      message: 'Master Command Authentication Successful',
      accessToken: 'mock-master-token',
      refreshToken: 'mock-master-refresh',
      user: {
        id: 'MASTER-001',
        email: 'master@keel.com',
        firstName: 'Vessel',
        lastName: 'Master',
        role: 'MASTER',
        vesselId: 1 // Linked to the same ship as the CTO
      }
    };
    localStorage.setItem('keel_token', masterData.accessToken);
    localStorage.setItem('keel_user', JSON.stringify(masterData.user));
    return masterData;
}

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Connection to Shore Server failed.');
    }

    localStorage.setItem('keel_token', data.accessToken);
    localStorage.setItem('keel_user', JSON.stringify(data.user));
    return data;
  } catch (error: any) {
    console.error('📡 COMMS ERROR:', error.message);
    throw error;
  }
};

export const logoutOfficer = () => {
  localStorage.removeItem('keel_token');
  localStorage.removeItem('keel_user');
  window.location.href = '/login';
};