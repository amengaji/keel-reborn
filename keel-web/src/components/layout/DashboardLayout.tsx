import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const DashboardLayout: React.FC = () => {
  return (
    // MASTER CONTAINER: Full viewport height, no scroll on body
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      
      {/* 1. SIDEBAR: Fixed width, static */}
      <div className="w-64 flex-none hidden md:block border-r border-border bg-card z-20">
        <Sidebar />
      </div>

      {/* 2. RIGHT SIDE WRAPPER: Flex column that takes remaining space */}
      <div className="flex flex-col flex-1 min-w-0 bg-background/50">
        
        {/* TOPBAR: Stays static at the top (No Sticky needed, it's just in the flex flow) */}
        <div className="flex-none z-10 w-full">
          <Topbar />
        </div>

        {/* MAIN SCROLL AREA: Only this part scrolls. */}
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="p-4 md:p-8 max-w-400 mx-auto animate-in fade-in duration-300">
            {/* Outlet renders the current page (Dashboard, Vessels, etc.) */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;