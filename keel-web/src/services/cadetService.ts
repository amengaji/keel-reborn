// keel-web/src/services/cadetService.ts

const API_URL = 'http://localhost:5000/api/trainees'; // Matches the route we set in backend

const getAuthHeaders = () => {
  const token = localStorage.getItem('keel_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const cadetService = {
  // GET all cadets
  getAll: async () => {
    const res = await fetch(API_URL, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch trainee data');

    const json = await res.json();
    const data = Array.isArray(json?.data) ? json.data : json;

    // 🔥 FIX: backend has first_name + last_name, UI expects full_name
    return data.map((u: any) => ({
      ...u,
      full_name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(),
    }));
  },


  // CREATE new cadet
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

  // DELETE cadet
  delete: async (id: string | number) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to remove trainee');
    return true;
  }
};