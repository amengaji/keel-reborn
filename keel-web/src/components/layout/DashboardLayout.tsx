// keel-web/src/components/layout/DashboardLayout.tsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import IdleTimer from '../auth/IdleTimer'; // FIXED: Added global idle observer

/**
 * DashboardLayout Component
 * Serves as the master wrapper for the internal application.
 * FIXED: Included <IdleTimer /> to monitor session expiration based on Settings.
 */
const DashboardLayout: React.FC = () => {
  return (
    // MASTER CONTAINER: Responsive to theme variables for Light/Dark mode
    <div className="flex h-screen bg-background text-foreground overflow-hidden transition-colors duration-300">
      
      {/* 1. GLOBAL SESSION MANAGER: Logic only component that handles auto-logout */}
      <IdleTimer />
      
      {/* 2. SIDEBAR: Fixed width navigation, responds to theme variables */}
      <div className="w-64 flex-none hidden md:block border-r border-border bg-card z-20 transition-colors duration-300">
        <Sidebar />
      </div>

      {/* 3. MAIN WORK AREA: Flex column that fills remaining horizontal space */}
      <div className="flex flex-col flex-1 min-w-0 bg-background">
        
        {/* TOPBAR: Static header component */}
        <div className="flex-none z-10 w-full border-b border-border bg-card transition-colors duration-300">
          <Topbar />
        </div>

        {/* SCROLLABLE CONTENT: Outlet renders specific page components */}
        <main className="flex-1 overflow-y-auto scroll-smooth bg-background/50">
          <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;