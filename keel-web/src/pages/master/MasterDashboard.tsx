import React, { useEffect, useState } from 'react';
import { 
  Users, ClipboardCheck, Anchor, ChevronRight, 
  ShieldCheck, FileText, Award, AlertCircle
} from 'lucide-react';
import { cadetService } from '../../services/cadetService';
import { useNavigate } from 'react-router-dom';

const MasterDashboard: React.FC = () => {
  const [vesselCrew, setVesselCrew] = useState<any[]>([]);
  const navigate = useNavigate();
  const BRAND_COLOR = '#3194A0';

  useEffect(() => {
    const fetchVesselData = async () => {
      try {
        const data = await cadetService.getAll();
        // Master sees all departments on their vessel
        const onboard = data.filter((t: any) => t.status === 'Onboard');
        setVesselCrew(onboard);
      } catch (err) {
        console.error("Failed to load vessel roster:", err);
      }
    };
    fetchVesselData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. MASTER COMMAND HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-[#3194A0]/10 border border-[#3194A0]/20 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#3194A0] text-white flex items-center justify-center shadow-lg">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Commanding Officer's Portal</h1>
            <p className="text-muted-foreground text-sm font-medium italic">Final Review Authority & Certification Center</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/master-approvals')}
          className="flex items-center gap-2 bg-[#3194A0] text-white px-6 py-3 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg active:scale-95 mt-4 md:mt-0"
        >
          <ClipboardCheck size={20} /> Open Approval Center
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. ONBOARD PERSONNEL ROSTER (Cross-Departmental) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Users size={20} style={{ color: BRAND_COLOR }} /> Onboard Crew Training
            </h2>
            <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted px-2 py-1 rounded">Total: {vesselCrew.length}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vesselCrew.map((trainee) => (
              <div key={trainee.id} className="bg-card border border-border p-5 rounded-2xl hover:border-[#3194A0] transition-all group shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-[#3194A0] border border-border">
                      {trainee.first_name[0]}{trainee.last_name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{trainee.first_name} {trainee.last_name}</h3>
                      <div className="flex gap-1.5 mt-0.5">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase border border-border px-1.5 rounded">{trainee.rank}</span>
                        <span className="text-[9px] font-bold text-[#3194A0] uppercase bg-[#3194A0]/10 px-1.5 rounded">{trainee.department || 'Deck'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className="text-muted-foreground uppercase">TRB Progress</span>
                      <span className="text-[#3194A0]">{trainee.progress || 0}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-[#3194A0] transition-all duration-1000" style={{ width: `${trainee.progress || 0}%` }} />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigate(`/trainee-trb/${trainee.id}`)}
                      className="flex-1 py-2 bg-muted text-foreground text-[10px] font-bold rounded-lg hover:bg-[#3194A0] hover:text-white transition-all"
                    >
                      REVIEW SYLLABUS
                    </button>
                    {trainee.progress >= 20 && (
                      <button className="px-3 py-2 bg-teal-500/10 text-teal-600 rounded-lg hover:bg-teal-500/20 transition-all border border-teal-500/20">
                        <Award size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. MASTER'S NOTIFICATIONS & CERTIFICATION ALERTS */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Award size={20} className="text-amber-500" /> Certification Tasks
          </h2>
          
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <div className="p-4 bg-teal-500/5 border border-teal-500/20 rounded-xl flex gap-3">
              <Award size={18} className="text-teal-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">Steering Certificate Ready</p>
                <p className="text-[10px] text-muted-foreground mt-1">Anuj Mengaji has completed Steering Task requirements. Endorsement required.</p>
              </div>
            </div>
            
            <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl flex gap-3">
              <AlertCircle size={18} className="text-orange-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">Pending CTO Sign-offs</p>
                <p className="text-[10px] text-muted-foreground mt-1">8 tasks are awaiting technical review before Master's final sign.</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-3">Quick Actions</p>
                <button className="w-full mb-2 py-2.5 text-xs font-bold border border-border rounded-lg hover:bg-muted transition-all flex items-center justify-center gap-2">
                    <FileText size={14} /> Download Vessel Training Report
                </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MasterDashboard;