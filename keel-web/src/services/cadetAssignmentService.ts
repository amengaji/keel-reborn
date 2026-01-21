//keel-web/src/services/cadetAssignmentService.ts

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${res.status}`);
  }
  return res.json();
};

export const cadetAssignmentService = {
  // Get all active assignments for the company
  getActive: async () => {
    const token = localStorage.getItem('keel_token');
    const res = await fetch(`${API_URL}/trainee-assignments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return handleResponse(res);
  },

  // Assign a cadet to a vessel
  assign: async (data: { trainee_id: number; vessel_id: number; sign_on_date: string }) => {
    const token = localStorage.getItem('keel_token');
    const res = await fetch(`${API_URL}/trainee-assignments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Sign off a cadet (Unassign)
  unassign: async (traineeId: number) => {
    const token = localStorage.getItem('keel_token');
    const res = await fetch(`${API_URL}/trainee-assignments/${traineeId}/sign-off`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      // Sign-off date defaults to today if not provided
      body: JSON.stringify({ sign_off_date: new Date().toISOString() })
    });
    return handleResponse(res);
  }
};