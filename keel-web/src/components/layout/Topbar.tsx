import React, { useEffect, useState } from 'react';
import { User as UserIcon, Bell, Moon, Sun, Search, Menu } from 'lucide-react';

const Topbar: React.FC = () => {
  // FIX: Initialize state lazily from localStorage to prevent flash of light mode
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const userStr = localStorage.getItem('keel_user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Sync state with DOM and LocalStorage
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <header className="h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 transition-colors duration-300 w-full">
      
      {/* LEFT: Search / Mobile Menu */}
      <div className="flex items-center gap-4 flex-1">
        <button className="md:hidden p-2 hover:bg-muted rounded-lg text-muted-foreground">
          <Menu size={20} />
        </button>
        
        {/* Search Bar - Optional but improves spacing */}
        <div className="relative hidden md:block max-w-md w-full">
          <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
          <input 
            type="text"
            placeholder="Search vessels, crew, or tasks..." 
            className="w-full bg-muted/50 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center space-x-4">
        
        {/* THEME TOGGLE */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all"
          title="Toggle Night Mode"
        >
          {isDark ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notifications */}
        <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all relative">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-card"></span>
        </button>
        
        {/* User Profile */}
        <div className="flex items-center space-x-3 border-l border-border pl-4 h-8">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-foreground leading-none">{user?.firstName || 'Admin'} {user?.lastName}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{user?.role || 'Officer'}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-primary-foreground font-bold shadow-md">
            {user?.firstName?.[0] || 'A'}
          </div>
        </div>

      </div>
    </header>
  );
};

export default Topbar;