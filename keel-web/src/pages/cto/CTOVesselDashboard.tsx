import React, { useEffect, useState } from 'react';
import { 
  Users, 
  ClipboardCheck, 
  Clock, 
  Anchor, 
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cadetService } from '../../services/cadetService';
import { useNavigate } from 'react-router-dom';

/**
 * CTOVesselDashboard Component
 * High-level oversight for a specific vessel's training progress.
 * Focuses on trainees assigned to this specific ship.
 */
const CTOVesselDashboard: React.FC = () => {
  const [assignedTrainees, setAssignedTrainees] = useState<any[]>([]);
  const [vesselName, setVesselName] = useState('Loading Vessel...');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVesselData = async () => {
      try {
        const data = await cadetService.getAll();
        // Filter: Only show trainees assigned to the CTO's current vessel (e.g., 'Ocean Pioneer')
        // In a real scenario, the CTO's vessel ID would come from the AuthContext/Token
        const onboard = data.filter((t: any) => t.status === 'Onboard');
        
        if (onboard.length > 0) {
          setVesselName(onboard[0].vessel?.name || 'Assigned Vessel');
        }
        
        setAssignedTrainees(onboard);
      } catch (err) {
        console.error("Failed to load vessel crew:", err);
      }
    };
    fetchVesselData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. VESSEL HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-primary/10 border border-primary/20 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
            <Anchor size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">{vesselName}</h1>
            <p className="text-muted-foreground text-sm font-medium">Official Executive Review & Sign-off Portal</p>
          </div>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <div className="bg-card px-4 py-2 rounded-lg border border-border text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Trainees Onboard</p>
            <p className="text-lg font-bold text-foreground">{assignedTrainees.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. ONBOARD TRAINEE ROSTER */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Users size={20} className="text-primary" /> Onboard Personnel
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedTrainees.map((trainee) => (
              <div key={trainee.id} className="bg-card border border-border p-5 rounded-2xl hover:border-primary transition-all group shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-primary">
                      {trainee.first_name[0]}{trainee.last_name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{trainee.first_name} {trainee.last_name}</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{trainee.rank}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-primary">{trainee.progress || 0}%</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">TRB Progress</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000" 
                      style={{ width: `${trainee.progress || 0}%` }}
                    />
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/trainee-trb/${trainee.id}`)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-muted group-hover:bg-primary group-hover:text-primary-foreground text-foreground text-xs font-bold rounded-xl transition-all"
                  >
                    Open TRB for Review <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. PENDING ACTIONS (SIGN-OFFS) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ClipboardCheck size={20} className="text-orange-500" /> Pending Approval
          </h2>
          
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl flex gap-3">
              <Clock size={18} className="text-orange-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">Task Sign-off Request</p>
                <p className="text-[10px] text-muted-foreground mt-1">Anuj Mengaji submitted "Rule 24: Lights" for review.</p>
              </div>
            </div>
            
            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex gap-3">
              <AlertCircle size={18} className="text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">Weekly Journal Review</p>
                <p className="text-[10px] text-muted-foreground mt-1">2 Trainees have pending journal entries for Week 3.</p>
              </div>
            </div>

            <button className="w-full mt-2 py-3 bg-foreground text-background text-xs font-bold rounded-xl hover:opacity-90 transition-all">
              GO TO APPROVAL CENTER
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CTOVesselDashboard;