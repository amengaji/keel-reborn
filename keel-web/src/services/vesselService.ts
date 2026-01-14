// keel-web/src/services/vesselService.ts

const API_URL = 'http://localhost:5000/api/vessels';

const getAuthHeaders = () => {
  const token = localStorage.getItem('keel_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const vesselService = {
  // GET all vessels
  getAll: async () => {
    const res = await fetch(API_URL, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch fleet data');
    return res.json();
  },

  // CREATE new vessel
  create: async (data: any) => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add vessel');
    return res.json();
  },

  // UPDATE existing vessel
  update: async (id: string | number, data: any) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update vessel');
    return res.json();
  },

  // DELETE vessel
  delete: async (id: string | number) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to remove vessel');
    return true;
  }
};