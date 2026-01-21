//keel-web/src/services/analyticsService.ts

const API_URL = 'http://localhost:5000/api/analytics';

// --- TYPE DEFINITIONS ---
export interface PlatformStats {
  overview: {
    total_companies: number;
    active_companies: number;
    total_users: number;
    total_cadets: number;
  };
  financials: {
    projected_monthly_revenue: number;
    total_seats_sold: number;
    seat_utilization: number;
  };
  leaderboard: Array<{
    company_name: string;
    tasks_completed: number;
  }>;
}

export interface UtilizationStat {
  id: number;
  name: string;
  usage: string; // e.g. "45/50"
  percent: number;
  contact: string;
}

// --- API METHODS ---

/**
 * Fetches the high-level "God Mode" stats for the Owner Dashboard.
 */
export const getPlatformStats = async (): Promise<PlatformStats> => {
  const token = localStorage.getItem('keel_token');
  
  const response = await fetch(`${API_URL}/platform`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Critical for the global security barrier
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch platform analytics');
  }

  return await response.json();
};

/**
 * Fetches the list of companies that are running out of seats (Upsell Candidates).
 */
export const getHighUtilizationTenants = async (): Promise<UtilizationStat[]> => {
  const token = localStorage.getItem('keel_token');

  const response = await fetch(`${API_URL}/utilization`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch utilization data');
  }

  return await response.json();
};