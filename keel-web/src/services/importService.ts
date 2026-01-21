//keel-web/src/services/importService.ts

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ImportSummary {
  total_rows: number;
  imported: number;
  skipped_count: number;
  skipped_details: Array<{
    email?: string;
    name?: string;
    reason: string;
    row?: any;
  }>;
}

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Import failed with status ${res.status}`);
  }
  return res.json();
};

export const importCadetsBulk = async (file: File): Promise<{ message: string; summary: ImportSummary }> => {
  const token = localStorage.getItem('keel_token');
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/import/cadets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  return handleResponse(res);
};

export const importVesselsBulk = async (file: File): Promise<{ message: string; summary: ImportSummary }> => {
  const token = localStorage.getItem('keel_token');
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/import/vessels`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  return handleResponse(res);
};