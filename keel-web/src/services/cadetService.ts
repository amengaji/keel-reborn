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
  // FIXED: Returns raw SQL data so that nested vessel associations are preserved for counting.
  getAll: async () => {
    const res = await fetch(API_URL, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch trainee data');

    const json = await res.json();
    
    // Return raw data directly. The UI components handle name formatting.
    return Array.isArray(json?.data) ? json.data : json;
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

  // DELETE a cadet profile
  delete: async (id: string | number) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to remove trainee');
    return true;
  }
};