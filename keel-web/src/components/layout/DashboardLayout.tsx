import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface LayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden transition-colors duration-300">
        {/* 1. Static Sidebar */}
      <Sidebar />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        <Topbar />
        <main className="p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;