// keel-web/src/pages/master/MasterDashboard.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Users, ClipboardCheck, ShieldCheck, FileText, Award, AlertCircle, 
  CheckCircle2, Anchor, ChevronRight
} from 'lucide-react';
import { cadetService } from '../../services/cadetService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Trainee {
  id: number;
  first_name: string;
  last_name: string;
  rank: string;
  department: string;
  status: string;
  progress: number;
  vessel?: string;
}

const MasterDashboard: React.FC = () => {
  const [vesselCrew, setVesselCrew] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const BRAND_COLOR = '#3194A0';

  // Get User from Storage to display vessel name in header
  const userJson = localStorage.getItem('keel_user');
  const user = userJson ? JSON.parse(userJson) : null;

  useEffect(() => {
    loadVesselData();
  }, []);

  const loadVesselData = async () => {
    try {
      setLoading(true);
      // ✅ This service call hits the backend getCadets() which 
      // now filters by the logged-in Master's vessel_id
      const data = await cadetService.getAll();
      
      // Filter for Onboard status (matching your SQL output "Onboard")
      const onboard = data.filter((t: any) => 
        t.status === 'Onboard' || t.status === 'ONBOARD'
      );
      
      setVesselCrew(onboard);
    } catch (err) {
      console.error("Failed to load roster:", err);
      toast.error("Connection Error", { description: "Could not sync vessel roster." });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    return {
      totalOnboard: vesselCrew.length,
      readyForCert: vesselCrew.filter(t => (t.progress || 0) >= 90).length,
      lowPerformance: vesselCrew.filter(t => (t.progress || 0) < 20).length
    };
  }, [vesselCrew]);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-muted-foreground animate-pulse">
        <Anchor className="animate-bounce mb-4" size={32} />
        <p>Syncing Vessel Command...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 1. MASTER COMMAND HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-primary/10 border border-primary/20 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Commanding Officer's Portal</h1>
            <p className="text-muted-foreground text-sm font-medium italic">
               {user?.vesselName || "Final Review Authority"} • Certification Center
            </p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/master-approvals')}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg active:scale-95 mt-4 md:mt-0"
        >
          <ClipboardCheck size={20} /> Open Approval Center
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Users size={20} style={{ color: BRAND_COLOR }} /> Onboard Crew Training
            </h2>
            <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted px-2 py-1 rounded">Total: {stats.totalOnboard}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vesselCrew.length === 0 ? (
               <div className="col-span-2 py-12 bg-muted/20 border-2 border-dashed border-border rounded-2xl text-center">
                  <p className="text-muted-foreground font-medium">No trainees currently listed as 'Onboard'.</p>
                  <button onClick={() => navigate('/trainees')} className="mt-2 text-primary text-xs font-bold hover:underline">Manage Crew List</button>
               </div>
            ) : (
              vesselCrew.map((trainee) => (
                <div key={trainee.id} className="bg-card border border-border p-5 rounded-2xl hover:border-primary transition-all group shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-primary border border-border uppercase">
                        {trainee.first_name?.[0]}{trainee.last_name?.[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{trainee.first_name} {trainee.last_name}</h3>
                        <div className="flex gap-1.5 mt-0.5">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase border border-border px-1.5 rounded">{trainee.rank || 'Cadet'}</span>
                          <span className="text-[9px] font-bold text-primary uppercase bg-primary/10 px-1.5 rounded">{trainee.department || 'Deck'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold mb-1">
                        <span className="text-muted-foreground uppercase">TRB Progress</span>
                        <span className="text-primary">{trainee.progress || 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${trainee.progress || 0}%` }} />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigate(`/trainee-trb/${trainee.id}`)}
                        className="flex-1 py-2 bg-muted text-foreground text-[10px] font-bold rounded-lg hover:bg-primary hover:text-white transition-all"
                      >
                        REVIEW SYLLABUS
                      </button>
                      <button 
                        onClick={() => navigate(`/master-reviews/${trainee.id}`)}
                        className="px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all border border-primary/20"
                        title="Perform Monthly Review"
                      >
                         <ClipboardCheck size={16} />
                      </button>
                      {(trainee.progress || 0) >= 90 && (
                        <button 
                          onClick={() => navigate('/master-certification')}
                          className="px-3 py-2 bg-teal-500/10 text-teal-600 rounded-lg hover:bg-teal-500/20 transition-all border border-teal-500/20"
                          title="Ready for Certification"
                        >
                          <Award size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Award size={20} className="text-amber-500" /> Command Alerts
          </h2>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            {stats.readyForCert > 0 ? (
              <div className="p-4 bg-teal-500/5 border border-teal-500/20 rounded-xl flex gap-3 animate-in slide-in-from-right-2">
                <Award size={18} className="text-teal-600 shrink-0 mt-1" />
                <div>
                  <p className="text-xs font-bold text-foreground">{stats.readyForCert} Ready for Endorsement</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Crew members have crossed 90% completion.</p>
                  <button onClick={() => navigate('/master-certification')} className="mt-2 text-[10px] font-bold text-teal-700 hover:underline flex items-center gap-1">Go to Certification Hub <ChevronRight size={10} /></button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/30 border border-border rounded-xl flex gap-3 opacity-70">
                 <CheckCircle2 size={18} className="text-muted-foreground shrink-0" />
                 <div><p className="text-xs font-bold text-foreground">No Pending Certifications</p></div>
              </div>
            )}
            {stats.lowPerformance > 0 && (
              <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl flex gap-3">
                <AlertCircle size={18} className="text-orange-600 shrink-0 mt-1" />
                <div><p className="text-xs font-bold text-foreground">Attention Required</p><p className="text-[10px] text-muted-foreground mt-1">{stats.lowPerformance} trainees are below 20% progress.</p></div>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-border">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-3">Quick Actions</p>
                <button onClick={() => toast.info("Report generation started...")} className="w-full mb-2 py-2.5 text-xs font-bold border border-border rounded-lg hover:bg-muted transition-all flex items-center justify-center gap-2"><FileText size={14} /> Download Vessel Training Report</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MasterDashboard;