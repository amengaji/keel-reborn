// keel-reborn/keel-web/src/pages/Dashboard.tsx
import React from 'react';
import { logoutOfficer } from '../services/authService';

const Dashboard: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('keel_user') || '{}');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* WELCOME CARD */}
      <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Welcome back, {user.firstName || 'Captain'}
        </h1>
        <p className="text-muted-foreground mt-2">
          System is fully operational. You are currently logged into the <span className="font-semibold text-primary">Shore Command Interface</span>.
        </p>
        
        <div className="mt-6 flex space-x-4">
          <button 
            onClick={logoutOfficer}
            className="bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            End Watch (Logout)
          </button>
        </div>
      </div>

      {/* STATS GRID (Example of Semantic Colors) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['Fleet Status', 'Active Cadets', 'Pending Actions'].map((title, i) => (
          <div key={i} className="bg-card border border-border p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
            <p className="text-2xl font-bold text-foreground mt-1">{10 + i * 5}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;