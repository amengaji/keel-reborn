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
  // --------------------------------------------------
  // GET ACTIVE ASSIGNMENTS (WITH TRAINEE + VESSEL)
  // --------------------------------------------------
  getActive: async () => {
    const res = await fetch(API_URL, {
      headers: getAuthHeaders()
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch assignments');
    return json;
  },

  // --------------------------------------------------
  // ASSIGN TRAINEE TO VESSEL
  // --------------------------------------------------
  assign: async (payload: {
    cadet_id: number;
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

  // --------------------------------------------------
  // UNASSIGN TRAINEE (SIGN-OFF)
  // --------------------------------------------------
  unassign: async (cadetId: number) => {
    const res = await fetch(`${API_URL}/${cadetId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error('Unassign failed');
    return true;
  }
};
