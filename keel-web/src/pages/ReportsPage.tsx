import React, { useEffect, useState } from 'react';
import { 
  BarChart3, PieChart, FileText, Download, 
  Users, Ship, TrendingUp, AlertCircle, Calendar 
} from 'lucide-react';
import { 
  getCadets, getVessels, getAllProgress, getSyllabus, 
  calculateProgressStats, getApprovalQueue 
} from '../services/dataService';
import { toast } from 'sonner';

const ReportsPage: React.FC = () => {
  const [metrics, setMetrics] = useState({
    totalCadets: 0,
    activeOnboard: 0,
    totalVessels: 0,
    vesselsWithCadets: 0,
    globalProgress: 0,
    pendingApprovals: 0
  });

  const [vesselStats, setVesselStats] = useState<any[]>([]);
  const [statusDist, setStatusDist] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = () => {
    setIsLoading(true);
    const cadets = getCadets();
    const vessels = getVessels();
    const syllabus = getSyllabus();
    const approvalQueue = getApprovalQueue(); // Reuse existing logic for backlog count

    // 1. BASIC COUNTS
    const totalCadets = cadets.length;
    const activeOnboard = cadets.filter((c: any) => c.status === 'Onboard').length;
    const totalVessels = vessels.length;

    // 2. STATUS DISTRIBUTION
    const dist: Record<string, number> = {};
    cadets.forEach((c: any) => {
      dist[c.status] = (dist[c.status] || 0) + 1;
    });

    // 3. PERFORMANCE & VESSEL STATS
    const vesselMap: Record<string, { count: number; totalProgress: number }> = {};
    let totalSystemProgress = 0;
    let cadetsWithProgress = 0;

    cadets.forEach((cadet: any) => {
      // Calculate individual progress
      const stats = calculateProgressStats(String(cadet.id), syllabus);
      const progress = stats.globalPercent || 0;

      // Global Accumulator
      if (progress > 0) {
        totalSystemProgress += progress;
        cadetsWithProgress++;
      }

      // Vessel Accumulator (Only if onboard)
      if (cadet.status === 'Onboard' && cadet.vessel) {
        if (!vesselMap[cadet.vessel]) {
          vesselMap[cadet.vessel] = { count: 0, totalProgress: 0 };
        }
        vesselMap[cadet.vessel].count++;
        vesselMap[cadet.vessel].totalProgress += progress;
      }
    });

    const calculatedGlobal = cadetsWithProgress > 0 
      ? Math.round(totalSystemProgress / cadetsWithProgress) 
      : 0;

    // Format Vessel Data for Table
    const formattedVesselStats = Object.keys(vesselMap).map(vName => ({
      name: vName,
      cadets: vesselMap[vName].count,
      avgProgress: Math.round(vesselMap[vName].totalProgress / vesselMap[vName].count)
    })).sort((a, b) => b.avgProgress - a.avgProgress); // Top performers first

    setMetrics({
      totalCadets,
      activeOnboard,
      totalVessels,
      vesselsWithCadets: Object.keys(vesselMap).length,
      globalProgress: calculatedGlobal,
      pendingApprovals: approvalQueue.length
    });

    setVesselStats(formattedVesselStats);
    setStatusDist(dist);
    setIsLoading(false);
  };

  const handleExport = (type: 'csv' | 'pdf') => {
    toast.success(`Generating ${type.toUpperCase()} report... Download will start shortly.`);
  };

  if (isLoading) return <div className="p-10 text-center text-muted-foreground">Loading analytics...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-muted-foreground text-sm">Performance metrics and fleet-wide training insights.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => handleExport('pdf')} className="bg-card hover:bg-muted text-foreground border border-input px-4 py-2 rounded-lg flex items-center space-x-2 shadow-sm text-sm font-medium">
             <FileText size={16} /><span>Export PDF</span>
           </button>
           <button onClick={() => handleExport('csv')} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center space-x-2 shadow-sm text-sm font-medium">
             <Download size={16} /><span>Download CSV</span>
           </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex items-start justify-between">
           <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Active Crew</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{metrics.activeOnboard} <span className="text-sm font-normal text-muted-foreground">/ {metrics.totalCadets}</span></h3>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-2 font-medium">
                 <TrendingUp size={12} /> {Math.round((metrics.activeOnboard / (metrics.totalCadets || 1)) * 100)}% Deployment
              </p>
           </div>
           <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg"><Users size={20} /></div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex items-start justify-between">
           <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Fleet Coverage</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{metrics.vesselsWithCadets} <span className="text-sm font-normal text-muted-foreground">/ {metrics.totalVessels}</span></h3>
              <p className="text-xs text-muted-foreground mt-2">Active Training Vessels</p>
           </div>
           <div className="p-2 bg-teal-500/10 text-teal-600 rounded-lg"><Ship size={20} /></div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex items-start justify-between">
           <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Avg Completion</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{metrics.globalProgress}%</h3>
              <p className="text-xs text-muted-foreground mt-2">Across all active TRBs</p>
           </div>
           <div className="p-2 bg-purple-500/10 text-purple-600 rounded-lg"><BarChart3 size={20} /></div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex items-start justify-between">
           <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Verification Queue</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{metrics.pendingApprovals}</h3>
              <p className="text-xs text-orange-600 mt-2 font-medium">Tasks awaiting approval</p>
           </div>
           <div className="p-2 bg-orange-500/10 text-orange-600 rounded-lg"><AlertCircle size={20} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        
        {/* LEFT COL: VESSEL PERFORMANCE */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden">
           <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                 <Ship size={16} className="text-muted-foreground" /> Vessel Training Performance
              </h3>
              <button className="text-xs text-primary font-bold hover:underline">View Full Report</button>
           </div>
           <div className="overflow-auto max-h-100">
              <table className="w-full text-left text-sm">
                 <thead className="bg-muted/10 text-muted-foreground sticky top-0 backdrop-blur-sm">
                    <tr>
                       <th className="p-4 font-medium">Vessel Name</th>
                       <th className="p-4 font-medium text-center">Trainees Onboard</th>
                       <th className="p-4 font-medium">Avg. Progress</th>
                       <th className="p-4 font-medium text-right">Performance</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border">
                    {vesselStats.length === 0 ? (
                       <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No active training data available.</td></tr>
                    ) : (
                       vesselStats.map((v, idx) => (
                          <tr key={v.name} className="hover:bg-muted/30">
                             <td className="p-4 font-medium">{v.name}</td>
                             <td className="p-4 text-center">
                                <span className="bg-muted px-2 py-1 rounded text-xs font-bold">{v.cadets}</span>
                             </td>
                             <td className="p-4">
                                <div className="flex items-center gap-2">
                                   <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${v.avgProgress}%` }} />
                                   </div>
                                   <span className="text-xs font-bold">{v.avgProgress}%</span>
                                </div>
                             </td>
                             <td className="p-4 text-right">
                                {v.avgProgress >= 80 ? (
                                   <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded">Excellent</span>
                                ) : v.avgProgress >= 50 ? (
                                   <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">On Track</span>
                                ) : (
                                   <span className="text-xs text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded">Needs Focus</span>
                                )}
                             </td>
                          </tr>
                       ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        {/* RIGHT COL: STATUS DISTRIBUTION */}
        <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col">
           <div className="p-4 border-b border-border bg-muted/20">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                 <PieChart size={16} className="text-muted-foreground" /> Workforce Distribution
              </h3>
           </div>
           <div className="p-6 flex-1 flex flex-col justify-center space-y-6">
              {['Onboard', 'Ready', 'Leave', 'Training'].map(status => {
                 const count = statusDist[status] || 0;
                 const percent = metrics.totalCadets > 0 ? Math.round((count / metrics.totalCadets) * 100) : 0;
                 
                 let colorClass = 'bg-gray-500';
                 if (status === 'Onboard') colorClass = 'bg-teal-500';
                 if (status === 'Ready') colorClass = 'bg-blue-500';
                 if (status === 'Leave') colorClass = 'bg-orange-400';

                 return (
                    <div key={status}>
                       <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium text-foreground">{status}</span>
                          <span className="text-muted-foreground">{count} ({percent}%)</span>
                       </div>
                       <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${percent}%` }} />
                       </div>
                    </div>
                 );
              })}
              
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
                 <Calendar size={14} /> Data updated just now
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ReportsPage;