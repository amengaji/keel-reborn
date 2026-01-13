import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Ship, Users, ClipboardList, 
  ShieldCheck, ChevronDown, ChevronRight, FileCheck, Lock,
  Settings, LogOut, Search, PieChart, FileText, 
  UserCheck, Archive, Anchor, BookOpen
} from 'lucide-react';
import { logoutOfficer } from '../../services/authService';

const Sidebar: React.FC = () => {
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // SECT 1: COMMAND
  const commandItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Fleet', path: '/vessels', icon: <Ship size={18} /> },
    { name: 'Trainees', path: '/trainees', icon: <Users size={18} /> },
  ];

  // SECT 2: OPERATIONS
  const operationItems = [
    { name: 'Assignments', path: '/assignments', icon: <Anchor size={18} /> },
    { name: 'Progress Matrix', path: '/training-progress', icon: <PieChart size={18} /> },
    { name: 'Approvals', path: '/approvals', icon: <UserCheck size={18} />, badge: 3 },
  ];

  return (
    <aside className="w-64 bg-card text-card-foreground h-screen flex flex-col border-r border-border shrink-0 font-sans transition-all duration-300">
      
      {/* ALIGNMENT FIX: Explicit h-14 (56px) to match Topbar */}
      <div className="h-14 flex items-center px-4 border-b border-border bg-card shrink-0">
        <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">
          K
        </div>
        <div className="ml-3 flex flex-col justify-center">
          <div className="font-bold text-sm leading-none tracking-tight text-foreground">Keel</div>
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Shore Admin</div>
        </div>
      </div>

      {/* QUICK SEARCH */}
      <div className="px-3 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 text-muted-foreground" size={14} />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/50 text-foreground text-xs pl-8 pr-3 py-2 rounded-md focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground"
          />
        </div>
      </div>
      
      {/* NAVIGATION */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto custom-scrollbar">
        
        {/* GROUP 1: COMMAND */}
        <div className="space-y-1">
          <p className="px-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Command</p>
          {commandItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-all ${
                  isActive 
                  ? 'bg-primary text-primary-foreground font-medium shadow-sm' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>

        {/* GROUP 2: OPERATIONS */}
        <div className="space-y-1">
          <p className="px-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Operations</p>
          {operationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all ${
                  isActive 
                  ? 'bg-primary text-primary-foreground font-medium shadow-sm' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                {item.icon}
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="bg-yellow-500/20 text-yellow-600 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* GROUP 3: AUDIT & INSIGHTS */}
        <div className="space-y-1">
          <p className="px-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Audit & Insights</p>
          
          <NavLink to="/reports" className={({ isActive }) => `flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-all ${isActive ? 'bg-primary text-primary-foreground font-medium shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
            <FileText size={18} />
            <span>Reports</span>
          </NavLink>

          <div className="pt-1">
            <button 
              onClick={() => setIsAuditOpen(!isAuditOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all text-sm text-muted-foreground hover:bg-muted hover:text-foreground ${isAuditOpen ? 'text-foreground' : ''}`}
            >
              <div className="flex items-center space-x-3">
                <ShieldCheck size={18} />
                <span>Audit Center</span>
              </div>
              {isAuditOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {isAuditOpen && (
              <div className="ml-4 mt-1 pl-3 border-l border-border space-y-1">
                <NavLink to="/audit/main" className={({ isActive }) => `flex items-center space-x-2 px-3 py-2 rounded-md text-xs transition-colors ${isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
                  <FileCheck size={14} />
                  <span>Audit Logs</span>
                </NavLink>
                <NavLink to="/audit/locked" className={({ isActive }) => `flex items-center space-x-2 px-3 py-2 rounded-md text-xs transition-colors ${isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
                  <Lock size={14} />
                  <span>Locked TRBs</span>
                </NavLink>
                <NavLink to="/evidence" className={({ isActive }) => `flex items-center space-x-2 px-3 py-2 rounded-md text-xs transition-colors ${isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
                  <Archive size={14} />
                  <span>Evidence Repo</span>
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* BOTTOM CONFIGURATION (Sticky) */}
      <div className="px-3 py-4 space-y-1 border-t border-border bg-card">
        
        <button 
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all text-sm text-muted-foreground hover:bg-muted hover:text-foreground ${isConfigOpen ? 'text-foreground' : ''}`}
        >
          <div className="flex items-center space-x-3">
            <Settings size={18} />
            <span>Settings</span>
          </div>
          {isConfigOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {isConfigOpen && (
          <div className="ml-4 mt-1 pl-3 border-l border-border space-y-1 mb-2">
            <NavLink to="/settings" className={({ isActive }) => `flex items-center space-x-2 px-3 py-2 rounded-md text-xs transition-colors ${isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
              <span>General Settings</span>
            </NavLink>
             <NavLink to="/users" className={({ isActive }) => `flex items-center space-x-2 px-3 py-2 rounded-md text-xs transition-colors ${isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
              <span>User Roles</span>
            </NavLink>
            <NavLink to="/tasks" className={({ isActive }) => `flex items-center space-x-2 px-3 py-2 rounded-md text-xs transition-colors ${isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
              <BookOpen size={14} />
              <span>TRB Syllabus</span>
            </NavLink>
          </div>
        )}
        
        <button
          onClick={logoutOfficer}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-all text-destructive hover:bg-destructive/10 mt-2"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;