// Update the URL to match the new Admin path
const API_URL = 'http://localhost:5000/api/v1/admin/vessels';

export const fetchVessels = async () => {
  const token = localStorage.getItem('keel_token');
  const response = await fetch(API_URL, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Failed to fetch fleet data');
  
  // Notice: The legacy controller returns { success: true, data: [...] }
  return result.data; 
};