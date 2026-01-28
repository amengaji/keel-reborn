// keel-web/src/services/cadetService.ts

const API_URL = 'http://localhost:5000/api/trainees'; 

/**
 * Helper to generate Authorization headers for secure API calls.
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('keel_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const cadetService = {
  // GET all cadets (Trainees)
  getAll: async () => {
    const res = await fetch(API_URL, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch trainee data');

    const json = await res.json();
    // Return raw data directly. The UI components handle name formatting.
    return Array.isArray(json?.data) ? json.data : json;
  },

  // ✅ ADDED: GET Single Cadet by ID
  getById: async (id: number) => {
    const res = await fetch(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch trainee profile');
    return res.json();
  },

  // CREATE new cadet profile
  create: async (data: any) => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to add trainee');
    return json;
  },

  // UPDATE existing cadet profile
  update: async (id: string | number, data: any) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update trainee');
    return json;
  },

  // DELETE a cadet profile
  delete: async (id: string | number) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to remove trainee');
    return true;
  },

  getWatchStats: async (id: number) => {
    const res = await fetch(`http://localhost:5000/api/watchkeeping/stats/${id}`, { 
        headers: getAuthHeaders() 
    });
    if (!res.ok) return { steering_hours: 0, bridge_hours: 0, night_hours: 0 };
    return res.json();
  },

  // DELETE ALL cadet profiles
  deleteAll: async () => {
    const res = await fetch(`${API_URL}/all`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete all trainees');
    return true;
  }

  
};