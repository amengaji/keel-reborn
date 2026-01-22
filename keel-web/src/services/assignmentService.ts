//keel-web/src/services/assignmentService.ts

const API_URL = 'http://localhost:5000/api/assignments';

const getAuthHeaders = () => {
  const token = localStorage.getItem('keel_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const assignmentService = {
  
  initializeTRB: async (data: { userId: number; department: string }) => {
    const res = await fetch(`${API_URL}/initialize`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to initialize TRB');
    return res.json();
  },

  // --- CTO ---
  getPendingCTOApprovals: async () => {
    const res = await fetch(`${API_URL}/cto/pending`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch CTO queue');
    return res.json();
  },

  ctoSignOff: async (assignmentId: number) => {
    const res = await fetch(`${API_URL}/${assignmentId}/cto-sign`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to sign off as CTO');
    return res.json();
  },

  // --- MASTER ---
  getPendingMasterApprovals: async () => {
    const res = await fetch(`${API_URL}/master/pending`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch Master queue');
    return res.json();
  },

  signOffTask: async (assignmentId: number) => {
    const res = await fetch(`${API_URL}/${assignmentId}/sign-off`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to sign off as Master');
    return res.json();
  }
};