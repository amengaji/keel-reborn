import React, { useEffect, useState } from 'react';
import { BarChart2, Search, Filter, Ship, Clock, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { getCadets } from '../services/dataService'; // We read the Trainees from here
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const TrainingProgressPage: React.FC = () => {
  const [trainees, setTrainees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Load Trainees and inject MOCK Progress data for visualization
    const data = getCadets().map((t: any) => ({
      ...t,
      // MOCK: If onboard, give random progress between 10-90%. If ready, 0%.
      progress: t.status === 'Onboard' ? Math.floor(Math.random() * 80) + 10 : 0,
      lastActive: t.status === 'Onboard' ? '2 days ago' : 'N/A',
      tasksCompleted: t.status === 'Onboard' ? Math.floor(Math.random() * 50) : 0,
      totalTasks: 120
    }));
    setTrainees(data);
  }, []);

  // HELPER: Calculate Days Sea Time
  const getDaysOnboard = (dateString: string) => {
    if (!dateString) return 0;
    const start = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 3600 * 24));
  };

  // FILTER LOGIC
  const filteredTrainees = trainees.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.vessel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewTRB = (name: string) => {
    navigate(`/trb/${encodeURIComponent(name)}`);
    toast.info(`Opening Digital TRB for ${name}...`);
    // Future: Navigate to /trb/:id
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Training Progress Matrix</h1>
          <p className="text-muted-foreground text-sm">Real-time monitoring of fleet-wide TRB completion.</p>
        </div>
        
        {/* STATS CARDS (Mini Dashboard) */}
        <div className="flex gap-4">
           <div className="bg-card border border-border px-4 py-2 rounded-lg shadow-sm">
              <p className="text-xs text-muted-foreground uppercase font-bold">Avg. Completion</p>
              <p className="text-xl font-bold text-primary">32%</p>
           </div>
           <div className="bg-card border border-border px-4 py-2 rounded-lg shadow-sm">
              <p className="text-xs text-muted-foreground uppercase font-bold">Active Users</p>
              <p className="text-xl font-bold text-green-600">{trainees.filter(t => t.status === 'Onboard').length}</p>
           </div>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden min-h-100">
        {/* TOOLBAR */}
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
          <button className="flex items-center space-x-2 px-3 py-2 text-muted-foreground hover:bg-muted rounded-md transition-colors text-sm border border-transparent hover:border-border">
            <Filter size={16} /><span>Filter Status</span>
          </button>
        </div>

        {/* TABLE */}
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
              {filteredTrainees.map((trainee) => (
                <tr key={trainee.id} className="hover:bg-muted/30 transition-colors group">
                  
                  {/* TRAINEE INFO */}
                  <td className="px-6 py-4 font-medium text-foreground">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            {trainee.name.charAt(0)}
                        </div>
                        <div>
                            <p>{trainee.name}</p>
                            <p className="text-[10px] text-muted-foreground">{trainee.rank}</p>
                        </div>
                    </div>
                  </td>

                  {/* VESSEL INFO */}
                  <td className="px-6 py-4 text-muted-foreground">
                    {trainee.status === 'Onboard' ? (
                        <div className="flex items-center gap-2 text-foreground">
                            <Ship size={14} className="text-teal-500" />
                            <span>{trainee.vessel}</span>
                        </div>
                    ) : (
                        <span className="opacity-50 italic">Ashore</span>
                    )}
                  </td>

                  {/* SEA TIME CALCULATION */}
                  <td className="px-6 py-4 text-muted-foreground font-mono">
                    {trainee.status === 'Onboard' ? (
                        <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span>{getDaysOnboard(trainee.signOnDate)} Days</span>
                        </div>
                    ) : '-'}
                  </td>

                  {/* PROGRESS BAR */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary transition-all duration-1000 ease-out" 
                                style={{ width: `${trainee.progress}%` }}
                            />
                        </div>
                        <span className="text-xs font-bold w-8">{trainee.progress}%</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        {trainee.tasksCompleted} / {trainee.totalTasks} Tasks
                    </p>
                  </td>

                  {/* LAST ACTIVE */}
                  <td className="px-6 py-4 text-muted-foreground">
                    {trainee.lastActive}
                  </td>

                  {/* ACTION BUTTON */}
                  <td className="px-6 py-4 text-right">
                    <button 
                        onClick={() => handleViewTRB(trainee.name)}
                        className="text-primary hover:text-primary/80 font-medium text-xs flex items-center justify-end gap-1 transition-colors"
                    >
                        View TRB <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredTrainees.length === 0 && (
                 <tr>
                    <td colSpan={6} className="text-center py-10 text-muted-foreground">
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