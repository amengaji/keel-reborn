//keel-web/src/services/reportService.ts

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const downloadBlob = async (endpoint: string, filename: string) => {
  const token = localStorage.getItem('keel_token');
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to generate report');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadFleetPDF = async () => {
  await downloadBlob('/reports/fleet/pdf', `Fleet_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const downloadFleetExcel = async () => {
  await downloadBlob('/reports/fleet/excel', `Fleet_Roster_${new Date().toISOString().split('T')[0]}.xlsx`);
};