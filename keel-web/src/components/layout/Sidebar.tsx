import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Ship, Users, ClipboardList, 
  ShieldCheck, ChevronDown, ChevronRight, FileCheck, Lock,
  Settings, LogOut, Search, PieChart, FileText, 
  UserCheck, Archive, Anchor, BookOpen, ClipboardCheck, Award
} from 'lucide-react';
import { logoutOfficer } from '../../services/authService';

/**
 * Sidebar Component
 * Dynamically renders navigation based on User Role (Master vs CTO vs Shore Admin).
 * BRANDING: Uses #3194A0 for Vessel/Master Portal primary identity.
 * UI/UX: Maintains exact spacing, sizing, and transitions of the existing build.
 */
const Sidebar: React.FC = () => {
  // --- LOCAL STATE ---
  const [isAuditOpen, setIsAuditOpen] = useState<boolean>(false);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // --- AUTHENTICATION & ROLE LOGIC ---
  const user = useMemo(() => {
    try {
      const userJson = localStorage.getItem('keel_user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const isCTO = user?.role === 'CTO';
  const isMaster = user?.role === 'MASTER';
  const PRIMARY_COLOR = '#3194A0'; // Your specific brand color

  // --- MENU ITEM DEFINITIONS ---
  
  // Master Specific Navigation (Vessel Command Authority)
  const masterItems = [
    { name: 'Vessel Overview', path: '/master-dashboard', icon: <Anchor size={18} /> },
    { name: 'Certification Hub', path: '/master-certification', icon: <Award size={18} />, badge: 'READY' },
    { name: 'Approval Queue', path: '/master-approvals', icon: <ClipboardCheck size={18} />, badge: 5 },
    { name: 'Onboard Trainees', path: '/trainees', icon: <Users size={18} /> },
    { name: 'Training Progress', path: '/training-progress', icon: <PieChart size={18} /> },
  ];

  // CTO Specific Navigation (Technical Oversight)
  const ctoItems = [
    { name: 'Vessel Overview', path: '/cto-dashboard', icon: <Anchor size={18} /> },
    { name: 'Onboard Trainees', path: '/trainees', icon: <Users size={18} /> },
    { name: 'Approval Queue', path: '/cto-approvals', icon: <ClipboardCheck size={18} />, badge: 2 },
    { name: 'Training Progress', path: '/training-progress', icon: <PieChart size={18} /> },
  ];

  // Standard Shore Admin: Command Section
  const commandItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Fleet', path: '/vessels', icon: <Ship size={18} /> },
    { name: 'Trainees', path: '/trainees', icon: <Users size={18} /> },
  ];

  // Standard Shore Admin: Operations Section
  const operationItems = [
    { name: 'Assignments', path: '/assignments', icon: <Anchor size={18} /> },
    { name: 'Progress Matrix', path: '/training-progress', icon: <PieChart size={18} /> },
    { name: 'Approvals', path: '/approvals', icon: <UserCheck size={18} />, badge: 3 },
  ];

  // --- DYNAMIC STYLING HELPERS ---
  const getHeaderIconBg = () => (isCTO || isMaster ? PRIMARY_COLOR : 'var(--primary)');
  
  const getActiveStyle = (isActive: boolean) => {
    if (!isActive) return {};
    return {
      backgroundColor: (isCTO || isMaster) ? PRIMARY_COLOR : 'var(--primary)',
      color: (isCTO || isMaster) ? '#FFFFFF' : 'var(--primary-foreground)'
    };
  };

  return (
    <aside className="w-64 bg-card text-card-foreground h-screen flex flex-col border-r border-border shrink-0 font-sans transition-all duration-300">
      
      {/* HEADER: Dynamic branding based on Role */}
      <div className="h-14 flex items-center px-4 border-b border-border bg-card shrink-0">
        <div 
          className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-lg shadow-sm text-white transition-colors duration-300"
          style={{ backgroundColor: getHeaderIconBg() }}
        >
          {isMaster ? 'M' : isCTO ? 'V' : 'K'}
        </div>
        <div className="ml-3 flex flex-col justify-center">
          <div className="font-bold text-sm leading-none tracking-tight text-foreground">
            {isMaster ? 'Master Portal' : isCTO ? 'Vessel Portal' : 'Keel'}
          </div>
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
            {isMaster ? 'Commanding Officer' : isCTO ? 'Chief Training Officer' : 'Shore Admin'}
          </div>
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/50 text-foreground text-xs pl-8 pr-3 py-2 rounded-md focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground"
          />
        </div>
      </div>
      
      {/* NAVIGATION ENGINE */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto custom-scrollbar">
        
        {isMaster ? (
          /* --- MASTER EXECUTIVE VIEW --- */
          <div className="space-y-1">
            <p className="px-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Vessel Command</p>
            {masterItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => getActiveStyle(isActive)}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all ${
                    !isActive ? 'text-muted-foreground hover:bg-muted hover:text-foreground' : 'shadow-sm font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-3">
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span 
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                        style={{ 
                          backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(49, 148, 160, 0.15)', 
                          color: isActive ? '#FFFFFF' : PRIMARY_COLOR 
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ) : isCTO ? (
          /* --- CTO EXECUTIVE VIEW --- */
          <div className="space-y-1">
            <p className="px-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Technical Oversight</p>
            {ctoItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => getActiveStyle(isActive)}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all ${
                    !isActive ? 'text-muted-foreground hover:bg-muted hover:text-foreground' : 'shadow-sm font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-3">
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span 
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                        style={{ 
                          backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(49, 148, 160, 0.15)', 
                          color: isActive ? '#FFFFFF' : PRIMARY_COLOR 
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ) : (
          /* --- SHORE ADMIN VIEW --- */
          <>
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
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center space-x-3">
                        {item.icon}
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="bg-yellow-500/20 text-yellow-600 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* GROUP 3: AUDIT & INSIGHTS */}
            <div className="space-y-1">
              <p className="px-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Audit & Insights</p>
              <NavLink 
                to="/reports" 
                className={({ isActive }) => 
                  `flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-all ${
                    isActive ? 'bg-primary text-primary-foreground font-medium shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                <FileText size={18} />
                <span>Reports</span>
              </NavLink>

              <div className="pt-1">
                <button 
                  onClick={() => setIsAuditOpen(!isAuditOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all text-sm text-muted-foreground hover:bg-muted hover:text-foreground ${isAuditOpen ? 'text-foreground bg-muted/30' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <ShieldCheck size={18} />
                    <span>Audit Center</span>
                  </div>
                  {isAuditOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {isAuditOpen && (
                  <div className="ml-4 mt-1 pl-3 border-l border-border space-y-1 animate-in slide-in-from-top-1 duration-200">
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
          </>
        )}
      </nav>

      {/* BOTTOM CONFIGURATION (Sticky Footer Section) */}
      <div className="px-3 py-4 space-y-1 border-t border-border bg-card">
        
        <button 
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all text-sm text-muted-foreground hover:bg-muted hover:text-foreground ${isConfigOpen ? 'text-foreground bg-muted/30' : ''}`}
        >
          <div className="flex items-center space-x-3">
            <Settings size={18} />
            <span>Settings</span>
          </div>
          {isConfigOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {isConfigOpen && (
          <div className="ml-4 mt-1 pl-3 border-l border-border space-y-1 mb-2 animate-in slide-in-from-top-1 duration-200">
            <NavLink to="/settings" className={({ isActive }) => `flex items-center space-x-2 px-3 py-2 rounded-md text-xs transition-colors ${isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
              <span>General Settings</span>
            </NavLink>
            {!isCTO && !isMaster && (
               <NavLink to="/users" className={({ isActive }) => `flex items-center space-x-2 px-3 py-2 rounded-md text-xs transition-colors ${isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
                <span>User Roles</span>
              </NavLink>
            )}
            <NavLink to="/tasks" className={({ isActive }) => `flex items-center space-x-2 px-3 py-2 rounded-md text-xs transition-colors ${isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
              <BookOpen size={14} />
              <span>TRB Syllabus</span>
            </NavLink>
          </div>
        )}
        
        <button
          onClick={logoutOfficer}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-all text-destructive hover:bg-destructive/10 mt-2 font-medium"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;