import React, { useEffect, useState } from 'react';
import { 
  Users, User, Ship, Anchor, CheckCircle2, AlertCircle, 
  Clock, ArrowRight, TrendingUp, Activity, Bell,
  FileText, Calendar, Plus, Search, MoreHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  getCadets, getVessels, getApprovalQueue, 
  getAllProgress, calculateProgressStats, getSyllabus 
} from '../services/dataService';

// --- COMPONENTS: MINI CHARTS (Pure CSS/SVG) ---

const SimplePieChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
  const total = data.reduce((acc, cur) => acc + cur.value, 0);
  let cumulativePercent = 0;

  if (total === 0) return <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">No Data</div>;

  return (
    <div className="relative w-32 h-32 rounded-full overflow-hidden transform -rotate-90">
      {data.map((slice, i) => {
        const percent = (slice.value / total) * 100;
        const dashArray = `${percent} 100`;
        const dashOffset = -cumulativePercent;
        cumulativePercent += percent;
        
        return (
          <svg key={i} viewBox="0 0 32 32" className="absolute inset-0 w-full h-full">
            <circle
              cx="16" cy="16" r="16"
              fill="transparent"
              stroke={slice.color}
              strokeWidth="32"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
            />
          </svg>
        );
      })}
      <div className="absolute inset-4 bg-card rounded-full z-10" />
    </div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    totalCadets: 0,
    activeOnboard: 0,
    readyPool: 0,
    totalVessels: 0,
    pendingApprovals: 0,
    avgProgress: 0,
    alerts: 2
  });

  const [approvalQueue, setApprovalQueue] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [crewStats, setCrewStats] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    const cadets = getCadets();
    const vessels = getVessels();
    const queue = getApprovalQueue();
    const syllabus = getSyllabus();

    // 1. METRICS
    const activeOnboard = cadets.filter((c: any) => c.status === 'Onboard').length;
    const readyPool = cadets.filter((c: any) => c.status === 'Ready').length;
    const totalVessels = vessels.length;

    // Calculate Fleet Average Progress
    let totalProgress = 0;
    let count = 0;
    cadets.forEach((c: any) => {
       const stats = calculateProgressStats(String(c.id), syllabus);
       if (stats.globalPercent > 0) {
         totalProgress += stats.globalPercent;
         count++;
       }
    });
    const avgProgress = count > 0 ? Math.round(totalProgress / count) : 0;

    setMetrics({
      totalCadets: cadets.length,
      activeOnboard,
      readyPool,
      totalVessels,
      pendingApprovals: queue.length,
      avgProgress,
      alerts: 2
    });

    setApprovalQueue(queue.slice(0, 5));

    // 2. CREW CHART DATA
    setCrewStats([
      { label: 'Onboard', value: activeOnboard, color: '#10b981' }, 
      { label: 'Ready', value: readyPool, color: '#3b82f6' }, 
      { label: 'Leave', value: cadets.filter((c: any) => c.status === 'Leave').length, color: '#f97316' }, 
      { label: 'Training', value: cadets.filter((c: any) => c.status === 'Training').length, color: '#8b5cf6' }, 
    ]);

    // 3. MOCK RECENT ACTIVITY
    setRecentActivity([
      { id: 1, user: 'Capt. R. Kumar', action: 'signed off', target: 'John Doe (Deck Cadet)', time: '2 hours ago', icon: <User size={14}/> },
      { id: 2, user: 'System', action: 'generated', target: 'Monthly Training Report', time: '5 hours ago', icon: <FileText size={14}/> },
      { id: 3, user: 'Training Mgr', action: 'approved', target: 'Navigation Task A1.2', time: 'Yesterday', icon: <CheckCircle2 size={14}/> },
      { id: 4, user: 'Admin', action: 'added', target: 'New Vessel: MV Starlight', time: '2 days ago', icon: <Plus size={14}/> },
    ]);
  };

  const QuickActionBtn = ({ icon, label, onClick, colorClass }: any) => (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all shadow-sm active:scale-95 group`}
    >
      <div className={`p-3 rounded-full ${colorClass} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* --- SECTION 1: WELCOME & HIGH LEVEL KPI --- */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <Calendar size={14} /> {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3">
           <button className="bg-background border border-border hover:bg-muted text-foreground px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm font-medium">
             <Bell size={16} /> Alerts <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{metrics.alerts}</span>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: CREW */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm relative overflow-hidden">
           <div className="absolute right-0 top-0 p-4 opacity-10"><Users size={64} /></div>
           <p className="text-xs font-bold text-muted-foreground uppercase">Total Crew</p>
           <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-foreground">{metrics.totalCadets}</h3>
              <span className="text-xs text-green-600 font-bold flex items-center"><TrendingUp size={12}/> +2 this week</span>
           </div>
           <div className="mt-4 flex gap-2">
              <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded font-medium">{metrics.activeOnboard} Onboard</span>
              <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded font-medium">{metrics.readyPool} Ready</span>
           </div>
        </div>

        {/* KPI 2: FLEET */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm relative overflow-hidden">
           <div className="absolute right-0 top-0 p-4 opacity-10"><Ship size={64} /></div>
           <p className="text-xs font-bold text-muted-foreground uppercase">Active Fleet</p>
           <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-foreground">{metrics.totalVessels}</h3>
              <span className="text-xs text-muted-foreground">Vessels</span>
           </div>
           <div className="w-full bg-muted rounded-full h-1.5 mt-4 overflow-hidden">
              <div className="bg-teal-500 h-full rounded-full" style={{ width: '85%' }}></div>
           </div>
           <p className="text-[10px] text-muted-foreground mt-1 text-right">85% Utilization</p>
        </div>

        {/* KPI 3: TRAINING */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm relative overflow-hidden">
           <div className="absolute right-0 top-0 p-4 opacity-10"><Activity size={64} /></div>
           <p className="text-xs font-bold text-muted-foreground uppercase">Fleet Progress</p>
           <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-foreground">{metrics.avgProgress}%</h3>
              <span className="text-xs text-muted-foreground">Avg. Completion</span>
           </div>
           <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock size={14} /> 
              <span>Next Audit: <span className="font-bold text-foreground">15 Days</span></span>
           </div>
        </div>

        {/* KPI 4: ACTION ITEMS */}
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm relative overflow-hidden ring-1 ring-orange-500/20">
           <div className="absolute right-0 top-0 p-4 opacity-10 text-orange-500"><AlertCircle size={64} /></div>
           <p className="text-xs font-bold text-orange-600 uppercase">Action Required</p>
           <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-foreground">{metrics.pendingApprovals}</h3>
              <span className="text-xs text-muted-foreground">Pending Tasks</span>
           </div>
           <button 
             onClick={() => navigate('/approvals')}
             className="mt-3 w-full bg-orange-500 text-white text-xs font-bold py-1.5 rounded hover:bg-orange-600 transition-colors"
           >
             Review Now
           </button>
        </div>
      </div>

      {/* --- SECTION 2: MAIN GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: OPERATIONAL OVERVIEW (2/3) */}
        <div className="lg:col-span-2 space-y-6">
           
           {/* CHART CARD */}
           <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col sm:flex-row gap-8 items-center">
              <div className="relative">
                 {/* PIE CHART */}
                 <SimplePieChart data={crewStats} />
                 
                 {/* CENTER TEXT OVERLAY - REMOVED ROTATION */}
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-foreground">{metrics.totalCadets}</span>
                    <span className="text-[10px] uppercase text-muted-foreground font-bold">Total</span>
                 </div>
              </div>
              <div className="flex-1 w-full">
                 <h3 className="font-bold text-lg text-foreground mb-4">Workforce Distribution</h3>
                 <div className="grid grid-cols-2 gap-4">
                    {crewStats.map((stat, i) => (
                       <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                          <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                             <span className="text-sm font-medium text-foreground">{stat.label}</span>
                          </div>
                          <span className="text-sm font-bold text-muted-foreground">{stat.value}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* APPROVAL QUEUE LIST */}
           <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex-1">
              <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                 <h3 className="font-bold text-foreground flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-orange-500" />
                    Pending Verification
                 </h3>
                 <button onClick={() => navigate('/approvals')} className="text-xs text-primary font-bold hover:underline">View All</button>
              </div>
              <div className="divide-y divide-border">
                 {approvalQueue.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">No pending approvals. All caught up!</div>
                 ) : (
                    approvalQueue.map((item) => (
                       <div key={item.uniqueId} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                {item.cadetName.charAt(0)}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-foreground">{item.taskTitle}</p>
                                <p className="text-xs text-muted-foreground">{item.cadetName} • {item.vessel}</p>
                             </div>
                          </div>
                          <button 
                            onClick={() => navigate('/approvals')} 
                            className="bg-background border border-border text-foreground px-3 py-1.5 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-white hover:border-primary"
                          >
                             Review
                          </button>
                       </div>
                    ))
                 )}
              </div>
           </div>

        </div>

        {/* RIGHT: QUICK ACTIONS & ACTIVITY (1/3) */}
        <div className="space-y-6">
           
           {/* QUICK ACTIONS */}
           <div className="bg-card border border-border rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-foreground mb-4 text-sm uppercase">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                 <QuickActionBtn 
                    icon={<Users size={20}/>} 
                    label="Add Trainee" 
                    onClick={() => navigate('/trainees')} 
                    colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300" 
                 />
                 <QuickActionBtn 
                    icon={<Anchor size={20}/>} 
                    label="Assign Vessel" 
                    onClick={() => navigate('/assignments')} 
                    colorClass="bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300" 
                 />
                 <QuickActionBtn 
                    icon={<FileText size={20}/>} 
                    label="Verify TRB" 
                    onClick={() => navigate('/approvals')} 
                    colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300" 
                 />
                 <QuickActionBtn 
                    icon={<Ship size={20}/>} 
                    label="Fleet Status" 
                    onClick={() => navigate('/vessels')} 
                    colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300" 
                 />
              </div>
           </div>

           {/* RECENT ACTIVITY */}
           <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-75">
              <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                 <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Activity size={16} className="text-blue-500" />
                    Live Activity
                 </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {recentActivity.map((log) => (
                    <div key={log.id} className="flex gap-3 relative pb-4 last:pb-0 border-l border-border pl-4 last:border-0">
                       <div className="absolute -left-1.25 top-0 w-2.5 h-2.5 rounded-full bg-muted border-2 border-background ring-1 ring-border" />
                       <div>
                          <p className="text-xs text-foreground">
                             <span className="font-bold">{log.user}</span> {log.action} <span className="font-medium text-primary">{log.target}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{log.time}</p>
                       </div>
                    </div>
                 ))}
              </div>
              <button 
                onClick={() => navigate('/audit/main')} 
                className="p-3 text-xs text-center border-t border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                 View Full Audit Log
              </button>
           </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;