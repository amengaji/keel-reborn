const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getCompanies = async () => {
  const token = localStorage.getItem('keel_token');
  const res = await fetch(`${API_URL}/companies`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const createCompany = async (data: any) => {
  const token = localStorage.getItem('keel_token');
  const res = await fetch(`${API_URL}/companies`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const updateCompany = async (id: number, data: any) => {
  const token = localStorage.getItem('keel_token');
  const res = await fetch(`${API_URL}/companies/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const deleteCompany = async (id: number) => {
  const token = localStorage.getItem('keel_token');
  await fetch(`${API_URL}/companies/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
};