//keel-web/src/services/companyService.ts

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to handle responses
const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${res.status}`);
  }
  return res.json();
};

export const getCompanies = async () => {
  const token = localStorage.getItem('keel_token');
  const res = await fetch(`${API_URL}/companies`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(res);
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
  return handleResponse(res);
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
  return handleResponse(res);
};

export const deleteCompany = async (id: number) => {
  const token = localStorage.getItem('keel_token');
  const res = await fetch(`${API_URL}/companies/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete company');
  }
};