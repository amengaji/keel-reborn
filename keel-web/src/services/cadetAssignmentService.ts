// keel-web/src/services/cadetAssignmentService.ts

const API_URL = 'http://localhost:5000/api/trainee-assignments';

const getAuthHeaders = () => {
  const token = localStorage.getItem('keel_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const cadetAssignmentService = {
  // GET ACTIVE ASSIGNMENTS
  getActive: async () => {
    const res = await fetch(API_URL, {
      headers: getAuthHeaders()
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch assignments');
    return json;
  },

  // ASSIGN TRAINEE TO VESSEL
  // We use trainee_id here to match your Backend Controller
  assign: async (payload: {
    trainee_id: number;
    vessel_id: number;
    sign_on_date: string;
  }) => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Assignment failed');
    return json;
  },

  // UNASSIGN TRAINEE (SIGN-OFF)
  unassign: async (traineeId: number) => {
    const res = await fetch(`${API_URL}/${traineeId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error('Unassign failed');
    return true;
  }
};