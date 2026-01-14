import React, { useState, useEffect } from 'react';
import { 
  Shield, Search, Filter, Download, Clock, 
  User, Monitor, FileText, ChevronLeft, ChevronRight,
  Activity, AlertTriangle, CheckCircle, Database
} from 'lucide-react';
import { toast } from 'sonner';

// --- TYPES ---
interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  actorEmail: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'APPROVE' | 'REJECT';
  module: 'AUTH' | 'FLEET' | 'CREW' | 'TRB' | 'SETTINGS' | 'ACCESS';
  target: string;
  details: string;
  ipAddress: string;
  status: 'SUCCESS' | 'FAILURE';
}

// --- MOCK DATA GENERATOR ---
const generateMockLogs = (count: number): AuditLog[] => {
  const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'APPROVE', 'REJECT'] as const;
  const modules = ['AUTH', 'FLEET', 'CREW', 'TRB', 'SETTINGS', 'ACCESS'] as const;
  const users = [
    { name: 'Admin User', role: 'Super Admin', email: 'admin@keel.com' },
    { name: 'Training Manager', role: 'Manager', email: 'manager@keel.com' },
    { name: 'Capt. Smith', role: 'Master', email: 'master@vessel.com' },
    { name: 'System Bot', role: 'System', email: 'bot@keel.com' }
  ];

  return Array.from({ length: count }).map((_, i) => {
    const user = users[Math.floor(Math.random() * users.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const module = modules[Math.floor(Math.random() * modules.length)];
    
    // Generate realistic targets based on module
    let target = 'System';
    if (module === 'FLEET') target = `Vessel: MT ${['Ocean', 'Star', 'Blue', 'Red'][Math.floor(Math.random()*4)]} ${['Pride', 'Pearl', 'Horizon'][Math.floor(Math.random()*3)]}`;
    if (module === 'CREW') target = `Cadet: ${['John', 'Sarah', 'Mike', 'Rahul'][Math.floor(Math.random()*4)]} Doe`;
    if (module === 'TRB') target = `Task: ${['Navigation', 'Cargo', 'Engine'][Math.floor(Math.random()*3)]} Ops`;
    if (module === 'AUTH') target = 'Login Session';

    return {
      id: `LOG-${Date.now()}-${i}`,
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
      actorName: user.name,
      actorRole: user.role,
      actorEmail: user.email,
      action: action,
      module: module,
      target: target,
      details: 'Operation completed successfully via web client.',
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      // FIX: Cast status to specific union type
      status: (Math.random() > 0.95 ? 'FAILURE' : 'SUCCESS') as 'SUCCESS' | 'FAILURE'
    };
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    // In a real app, fetch from API. Here we generate mocks.
    setLogs(generateMockLogs(100));
  }, []);

  const handleExport = () => {
    toast.success("Audit logs exported to CSV.");
  };

  // --- FILTERING ---
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesModule = filterModule === 'ALL' || log.module === filterModule;

    return matchesSearch && matchesModule;
  });

  // --- PAGINATION ---
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- HELPER: Action Badge ---
  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      CREATE: 'bg-green-50 text-green-700 border-green-200',
      UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
      DELETE: 'bg-red-50 text-red-700 border-red-200',
      LOGIN: 'bg-gray-50 text-gray-700 border-gray-200',
      APPROVE: 'bg-teal-50 text-teal-700 border-teal-200',
      REJECT: 'bg-orange-50 text-orange-700 border-orange-200',
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${styles[action] || 'bg-gray-100'}`}>
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Audit Logs</h1>
          <p className="text-muted-foreground text-sm">Track security events, user activities, and data changes.</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-card hover:bg-muted text-foreground border border-input px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm text-sm font-medium"
        >
          <Download size={16} /><span>Export Logs</span>
        </button>
      </div>

      {/* FILTERS TOOLBAR */}
      <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center shrink-0">
        <div className="relative flex-1 w-full">
           <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
           <input 
             type="text" 
             placeholder="Search by Actor, Target, or Action..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="input-field pl-9 h-9 w-full"
           />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
           <Filter size={16} className="text-muted-foreground" />
           <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter Module:</span>
           <select 
             value={filterModule}
             onChange={(e) => { setFilterModule(e.target.value); setCurrentPage(1); }}
             className="bg-background border border-border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none"
           >
             <option value="ALL">All Modules</option>
             <option value="AUTH">Authentication</option>
             <option value="FLEET">Fleet Mgmt</option>
             <option value="CREW">Crew Mgmt</option>
             <option value="TRB">TRB / Tasks</option>
             <option value="ACCESS">User Access</option>
           </select>
        </div>
      </div>

      {/* LOGS TABLE */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
           <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10 text-xs uppercase text-muted-foreground">
                 <tr className="border-b border-border">
                    <th className="p-4 w-48">Timestamp</th>
                    <th className="p-4 w-48">Actor</th>
                    <th className="p-4 w-32 text-center">Action</th>
                    <th className="p-4 w-32">Module</th>
                    <th className="p-4 flex-1">Activity Details</th>
                    <th className="p-4 w-32 text-right">IP Address</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-border">
                 {paginatedLogs.length === 0 ? (
                    <tr>
                       <td colSpan={6} className="p-10 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                             <Database size={32} className="opacity-20" />
                             <span>No logs found matching your criteria.</span>
                          </div>
                       </td>
                    </tr>
                 ) : (
                    paginatedLogs.map((log) => (
                       <tr key={log.id} className="hover:bg-muted/30 transition-colors group">
                          
                          {/* TIMESTAMP */}
                          <td className="p-4 text-muted-foreground whitespace-nowrap">
                             <div className="flex items-center gap-2">
                                <Clock size={14} />
                                <div className="flex flex-col">
                                   <span className="font-mono text-xs text-foreground">
                                      {new Date(log.timestamp).toLocaleDateString()}
                                   </span>
                                   <span className="text-[10px]">
                                      {new Date(log.timestamp).toLocaleTimeString()}
                                   </span>
                                </div>
                             </div>
                          </td>

                          {/* ACTOR */}
                          <td className="p-4">
                             <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                   {log.actorName.charAt(0)}
                                </div>
                                <div>
                                   <div className="font-medium text-foreground text-xs">{log.actorName}</div>
                                   <div className="text-[10px] text-muted-foreground">{log.actorRole}</div>
                                </div>
                             </div>
                          </td>

                          {/* ACTION */}
                          <td className="p-4 text-center">
                             {getActionBadge(log.action)}
                          </td>

                          {/* MODULE */}
                          <td className="p-4">
                             <span className="text-xs font-mono text-muted-foreground">{log.module}</span>
                          </td>

                          {/* TARGET / DETAILS */}
                          <td className="p-4">
                             <div className="flex items-start gap-2">
                                {log.status === 'FAILURE' ? (
                                   <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                                ) : (
                                   <Activity size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                                )}
                                <div>
                                   <div className="font-medium text-foreground text-sm">{log.target}</div>
                                   <div className="text-xs text-muted-foreground truncate max-w-md">{log.details}</div>
                                </div>
                             </div>
                          </td>

                          {/* IP ADDRESS */}
                          <td className="p-4 text-right text-xs font-mono text-muted-foreground">
                             <div className="flex items-center justify-end gap-1">
                                <Monitor size={12} /> {log.ipAddress}
                             </div>
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        </div>

        {/* PAGINATION */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
           <div className="text-xs text-muted-foreground">
              Page <span className="font-medium">{currentPage}</span> of {totalPages} ({filteredLogs.length} total events)
           </div>
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded hover:bg-muted disabled:opacity-50 transition-colors border border-transparent hover:border-border"
              >
                 <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded hover:bg-muted disabled:opacity-50 transition-colors border border-transparent hover:border-border"
              >
                 <ChevronRight size={16} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;