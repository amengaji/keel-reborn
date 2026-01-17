// keel-reborn/keel-web/src/services/authService.ts

/**
 * UI/UX EXPERT NOTE:
 * This service handles all communication regarding Officer Identity.
 * It is built to be resilient; if the ship's server is unreachable, 
 * it returns clear maritime-themed error messages.
 */

const API_URL = 'http://localhost:5000/api/auth';

export interface LoginResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export const loginOfficer = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // MARITIME TRAINING NOTE: 
      // We throw the specific message from the backend (e.g., "Invalid credentials")
      throw new Error(data.message || 'Connection to Shore Server failed.');
    }

    // UX Note: Store the token securely so the Officer stays logged in during their watch
    localStorage.setItem('keel_token', data.accessToken);
    localStorage.setItem('keel_user', JSON.stringify(data.user));

    return data;
  } catch (error: any) {
    console.error('📡 COMMS ERROR:', error.message);
    throw error;
  }
};

/**
 * UX Note: Simple helper to log out and clear all maritime credentials
 */
export const logoutOfficer = () => {
  localStorage.removeItem('keel_token');
  localStorage.removeItem('keel_user');
  window.location.href = '/login';
};