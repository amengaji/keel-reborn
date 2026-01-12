import React, { useEffect, useState } from 'react';
import { logoutOfficer } from '../../services/authService';
import { LogOut, User as UserIcon, Bell, Moon, Sun, Menu } from 'lucide-react';

const Topbar: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const userStr = localStorage.getItem('keel_user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Initialize Theme Logic
  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    // ALIGNMENT FIX: h-14 to match Sidebar Header exactly
    <header className="h-14 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 sticky top-0 z-10 transition-colors duration-300">
      
      {/* Left: Breadcrumb or Page Title Placeholder */}
      <div className="flex items-center space-x-3">
         <span className="text-sm font-medium text-muted-foreground hidden md:block">
           Overview
         </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-4">
        
        {/* THEME TOGGLE */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all"
          title="Toggle Night Mode"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all relative">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border border-card"></span>
        </button>
        
        {/* User Profile */}
        <div className="flex items-center space-x-3 border-l border-border pl-4 h-8">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-foreground leading-none">{user?.firstName || 'Admin'} {user?.lastName}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{user?.role || 'Officer'}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border">
            <UserIcon size={16} />
          </div>
        </div>

      </div>
    </header>
  );
};

export default Topbar;