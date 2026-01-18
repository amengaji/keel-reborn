// keel-web/src/pages/TrainingProgressPage.tsx

import React, { useEffect, useState } from 'react';
import { BarChart2, Search, Filter, Ship, Clock, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { cadetService } from '../services/cadetService'; 
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

/**
 * TrainingProgressPage Component
 * Monitors fleet-wide TRB completion.
 * FIXED: Mapping vessel assignment from SQL nested data to resolve "Ashore" display error.
 */
const TrainingProgressPage: React.FC = () => {
  const [trainees, setTrainees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fleetAverage, setFleetAverage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const data = await cadetService.getAll();
      const loadedCadets = Array.isArray(data) ? data : [];

      const processedData = loadedCadets.map((t: any) => {
        // Handle vessel name from the flattened 'vessel' property or nested assignment
        // This ensures if the trainee is assigned in SQL, it shows here instead of 'Ashore'
        const assignedVessel = t.vessel?.name || t.vessel || null;

        return {
          ...t,
          // UI Mapping: Matches the existing table logic
          name: `${t.first_name || ''} ${t.last_name || ''}`.trim(),
          vessel: assignedVessel || 'Ashore', 
          progress: t.progress || 0,
          tasksCompleted: Number(t.completed_tasks_count || 0),
          totalTasks: Number(t.total_tasks_count || 0),
          lastActive: t.status === 'Onboard' ? 'Recently' : 'N/A', 
          signOnDate: t.sign_on_date || null
        };
      });

      setTrainees(processedData);

      if (processedData.length > 0) {
        const totalProgress = processedData.reduce((acc: number, curr: any) => acc + (curr.progress || 0), 0);
        setFleetAverage(Math.round(totalProgress / processedData.length));
      }
    } catch (error) {
      console.error("DATA FETCH ERROR:", error);
      toast.error("Could not sync training records from database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const getDaysOnboard = (dateString: string | null) => {
    if (!dateString) return 0;
    const start = new Date(dateString);
    if (isNaN(start.getTime())) return 0;
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const days = Math.floor(diff / (1000 * 3600 * 24));
    return days < 0 ? 0 : days;
  };

  const filteredTrainees = trainees.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.vessel && t.vessel.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleViewTRB = (trainee: any) => {
    navigate(`/trainee-trb/${trainee.id}`);
    toast.info(`Opening Digital TRB for ${trainee.name}...`);
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-green-500';
    if (percent >= 75) return 'bg-teal-500';
    if (percent >= 50) return 'bg-blue-500';
    if (percent >= 25) return 'bg-yellow-500';
    return 'bg-primary';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 bg-background transition-colors">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Training Progress Matrix</h1>
          <p className="text-muted-foreground text-sm">Real-time monitoring of fleet-wide TRB completion.</p>
        </div>
        
        <div className="flex gap-4">
           <div className="bg-card border border-border px-4 py-2 rounded-lg shadow-sm">
              <p className="text-xs text-muted-foreground uppercase font-bold">Avg. Completion</p>
              <p className="text-xl font-bold text-primary">{fleetAverage}%</p>
           </div>
           <div className="bg-card border border-border px-4 py-2 rounded-lg shadow-sm">
              <p className="text-xs text-muted-foreground uppercase font-bold">Active Users</p>
              <p className="text-xl font-bold text-green-600">
                {trainees.filter(t => t.status === 'Onboard').length}
              </p>
           </div>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden min-h-100">
        
        <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search Trainee or Vessel..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <button className="flex items-center space-x-2 px-3 py-2 text-muted-foreground hover:bg-muted rounded-md transition-colors text-sm border border-transparent hover:border-border font-bold">
            <Filter size={16} /><span>Filter Status</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold border-b border-border">
                <th className="px-6 py-4">Trainee</th>
                <th className="px-6 py-4">Vessel / Location</th>
                <th className="px-6 py-4">Sea Time</th>
                <th className="px-6 py-4 w-1/4">TRB Completion</th>
                <th className="px-6 py-4">Last Activity</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-muted-foreground font-medium animate-pulse">
                    Loading records from database...
                  </td>
                </tr>
              ) : filteredTrainees.map((trainee) => (
                <tr key={trainee.id} className="hover:bg-muted/30 transition-colors group">
                  
                  <td className="px-6 py-4 font-medium text-foreground">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            {trainee.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <p>{trainee.name}</p>
                            <p className="text-[10px] text-muted-foreground">{trainee.rank}</p>
                        </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-muted-foreground">
                    {trainee.vessel !== 'Ashore' ? (
                        <div className="flex items-center gap-2 text-foreground">
                            <Ship size={14} className="text-teal-500" />
                            <span>{trainee.vessel}</span>
                        </div>
                    ) : (
                        <span className="opacity-50 italic">Ashore</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-muted-foreground font-mono">
                    {trainee.status === 'Onboard' ? (
                        <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span>{getDaysOnboard(trainee.signOnDate)} Days</span>
                        </div>
                    ) : '-'}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-1000 ease-out ${getProgressColor(trainee.progress)}`} 
                                style={{ width: `${trainee.progress}%` }}
                            />
                        </div>
                        <span className="text-xs font-bold w-8">{trainee.progress}%</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        {trainee.tasksCompleted} / {trainee.totalTasks} Tasks
                    </p>
                  </td>

                  <td className="px-6 py-4 text-muted-foreground">
                    {trainee.lastActive}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button 
                        onClick={() => handleViewTRB(trainee)}
                        className="text-primary hover:text-primary/80 font-medium text-xs flex items-center justify-end gap-1 transition-colors"
                    >
                        View TRB <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}

              {!isLoading && filteredTrainees.length === 0 && (
                 <tr>
                    <td colSpan={6} className="text-center py-20 text-muted-foreground">
                       No trainees found.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrainingProgressPage;