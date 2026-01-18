// keel-web/src/components/layout/DashboardLayout.tsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

/**
 * DashboardLayout Component
 * FIXED: Removed hardcoded slate-950/slate-50 classes.
 * Now uses semantic CSS variables (--background, --border, --card) 
 * so it responds instantly to the .dark class toggle.
 */
const DashboardLayout: React.FC = () => {
  return (
    // MASTER CONTAINER: Uses dynamic background variable from index.css
    <div className="flex h-screen bg-background text-foreground overflow-hidden transition-colors duration-300">
      
      {/* 1. SIDEBAR: Fixed width, static. Uses --card and --border variables. */}
      <div className="w-64 flex-none hidden md:block border-r border-border bg-card z-20 transition-colors duration-300">
        <Sidebar />
      </div>

      {/* 2. RIGHT SIDE WRAPPER: Flex column that takes remaining space */}
      <div className="flex flex-col flex-1 min-w-0 bg-background">
        
        {/* TOPBAR: Stays static at the top. Variables ensure it toggles correctly. */}
        <div className="flex-none z-10 w-full border-b border-border bg-card transition-colors duration-300">
          <Topbar />
        </div>

        {/* MAIN SCROLL AREA: Only this part scrolls. */}
        <main className="flex-1 overflow-y-auto scroll-smooth bg-background/50">
          <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Outlet renders the current page (Dashboard, Vessels, etc.) */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;