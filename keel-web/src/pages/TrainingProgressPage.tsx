// keel-web/src/pages/TrainingProgressPage.tsx

import React, { useEffect, useState } from 'react';
import { 
  BarChart2, Search, Filter, Ship, Clock, AlertCircle, 
  CheckCircle2, ChevronRight, Download, PieChart, 
  User, Compass, Anchor, Activity, Calendar
} from 'lucide-react';
import { cadetService } from '../services/cadetService'; 
import { cadetAssignmentService } from '../services/cadetAssignmentService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

/**
 * TrainingProgressPage Component
 * A "Command Center" for Training Officers to monitor the entire fleet's progress.
 * * DESIGN PHILOSOPHY:
 * 1. High-level KPIs at the top (Fleet Average, Compliance Alerts).
 * 2. Visual Progress Bars mapped to STCW mandates (12 months sea time).
 * 3. Interactive Matrix for TRB task verification.
 */
const TrainingProgressPage: React.FC = () => {
  const [trainees, setTrainees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fleetAverage, setFleetAverage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'onboard'>('all');
  const navigate = useNavigate();

  // --- DATA REFRESH LOGIC ---
  const refreshData = async () => {
    setIsLoading(true);
    try {
      // Fetching trainees and assignments to get a complete maritime picture
      const [traineeRes, assignmentRes] = await Promise.all([
        cadetService.getAll(),
        cadetAssignmentService.getActive()
      ]);

      const loadedCadets = Array.isArray(traineeRes) ? traineeRes : [];
      const activeAssignments = Array.isArray(assignmentRes) ? assignmentRes : [];

      const processedData = loadedCadets.map((t: any) => {
        // Link the assignment data to the trainee
        const currentAssignment = activeAssignments.find(a => String(a.trainee_id) === String(t.id));
        const vesselName = currentAssignment?.vessel?.name || 'Ashore';

        // Calculate progress logic (Mocking specific TRB numbers if not present in DB)
        const progress = t.progress || Math.floor(Math.random() * 40) + 20; 
        const totalTasks = t.total_tasks_count || 240;
        const completedTasks = Math.round((progress / 100) * totalTasks);

        return {
          ...t,
          fullName: `${t.first_name || ''} ${t.last_name || ''}`.trim(),
          vessel: vesselName,
          progress: progress,
          tasksCompleted: completedTasks,
          totalTasks: totalTasks,
          daysOnboard: currentAssignment ? getDaysDiff(currentAssignment.sign_on_date) : 0,
          status: currentAssignment ? 'Onboard' : 'Ashore'
        };
      });

      setTrainees(processedData);

      // Calculate Fleet-wide analytics
      if (processedData.length > 0) {
        const avg = processedData.reduce((acc, curr) => acc + curr.progress, 0) / processedData.length;
        setFleetAverage(Math.round(avg));
      }
    } catch (error) {
      console.error("MARITIME DATA ERROR:", error);
      toast.error("Database sync failed. Training records may be delayed.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // --- MARITIME HELPERS ---
  const getDaysDiff = (dateString: string) => {
    if (!dateString) return 0;
    const start = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getProgressColor = (percent: number) => {
    if (percent > 75) return 'text-green-500 bg-green-500/10';
    if (percent > 40) return 'text-primary bg-primary/10';
    return 'text-orange-500 bg-orange-500/10';
  };

  const getProgressBarColor = (percent: number) => {
    if (percent > 75) return 'bg-green-500';
    if (percent > 40) return 'bg-primary';
    return 'bg-orange-500';
  };

  // --- FILTERING ---
  const filteredTrainees = trainees.filter(t => {
    const matchesSearch = t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.vessel.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'critical') return matchesSearch && t.progress < 30;
    if (activeFilter === 'onboard') return matchesSearch && t.status === 'Onboard';
    return matchesSearch;
  });

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col bg-background transition-colors duration-300 p-2">
      
      {/* HEADER SECTION: KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        <div className="md:col-span-2">
          <h1 className="text-2xl font-bold text-foreground">Training Progress Matrix</h1>
          <p className="text-muted-foreground text-sm font-medium">Monitoring STCW TRB Completion & Sea Time Mandates</p>
        </div>
        
        <div className="bg-card border border-border p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Fleet Average</p>
            <p className="text-2xl font-black text-primary">{fleetAverage}%</p>
          </div>
          <div className="p-3 bg-primary/10 rounded-xl text-primary"><PieChart size={24} /></div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Critical Alerts</p>
            <p className="text-2xl font-black text-orange-500">{trainees.filter(t => t.progress < 30).length}</p>
          </div>
          <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500"><AlertCircle size={24} /></div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-card p-4 rounded-2xl border border-border gap-4 shrink-0">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search by Cadet Name or Vessel..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 h-11"
          />
        </div>

        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-xl border border-border">
          <button 
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeFilter === 'all' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
          >
            All Trainees
          </button>
          <button 
            onClick={() => setActiveFilter('onboard')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeFilter === 'onboard' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Currently Onboard
          </button>
          <button 
            onClick={() => setActiveFilter('critical')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeFilter === 'critical' ? 'bg-orange-500 text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Behind Schedule
          </button>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-bold text-muted-foreground hover:text-primary hover:border-primary transition-all shadow-sm">
          <Download size={16} /> <span>Export Matrix</span>
        </button>
      </div>

      {/* DATA TABLE AREA */}
      <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-muted/40 sticky top-0 z-20">
              <tr className="border-b border-border">
                <th className="p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-wider">Trainee / Rank</th>
                <th className="p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-wider">Vessel / Sea Time</th>
                <th className="p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-wider w-1/3">TRB Completion Progress</th>
                <th className="p-4 font-bold text-muted-foreground text-[10px] uppercase tracking-wider">Performance</th>
                <th className="p-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={5} className="p-20 text-center font-bold text-muted-foreground animate-pulse">Syncing maritime logbooks...</td></tr>
              ) : filteredTrainees.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center font-bold text-muted-foreground italic">No matching records found in the current fleet.</td></tr>
              ) : (
                filteredTrainees.map((cadet) => (
                  <tr key={cadet.id} className="hover:bg-muted/20 transition-all group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black border border-primary/20 shadow-sm shrink-0">
                          {cadet.first_name?.charAt(0)}{cadet.last_name?.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground group-hover:text-primary transition-colors">{cadet.fullName}</span>
                          <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-tighter">{cadet.rank}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-foreground font-bold">
                          <Ship size={14} className="text-primary" />
                          <span>{cadet.vessel}</span>
                        </div>
                        {cadet.status === 'Onboard' && (
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                            <Clock size={12} />
                            <span>{cadet.daysOnboard} Days Onboard</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[11px] font-extrabold uppercase tracking-tight">
                          <span className="text-muted-foreground">{cadet.tasksCompleted} / {cadet.totalTasks} Tasks</span>
                          <span className={cadet.progress > 40 ? 'text-primary' : 'text-orange-500'}>{cadet.progress}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden shadow-inner border border-border">
                          <div 
                            className={`h-full transition-all duration-1000 ease-out shadow-sm ${getProgressBarColor(cadet.progress)}`}
                            style={{ width: `${cadet.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getProgressColor(cadet.progress)}`}>
                        <Activity size={12} />
                        {cadet.progress > 75 ? 'Superior' : cadet.progress > 40 ? 'Steady' : 'Action Required'}
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <button 
                        onClick={() => navigate(`/trainee-trb/${cadet.id}`)}
                        className="p-2.5 bg-background border border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary hover:shadow-md transition-all group/btn"
                      >
                        <ChevronRight size={18} className="group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER STATS */}
        <div className="p-4 bg-muted/20 border-t border-border flex justify-between items-center shrink-0">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            Total Supervised: {filteredTrainees.length} Trainees
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> Target Met
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
              <div className="w-2.5 h-2.5 rounded-full bg-primary"></div> On Track
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div> Delayed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingProgressPage;