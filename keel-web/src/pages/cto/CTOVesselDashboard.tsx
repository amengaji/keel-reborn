//keel-web/src/pages/cto/CTOVesselDashboard.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Users, ClipboardCheck, Clock, Anchor, ChevronRight,
  AlertCircle, CheckCircle2, Ship
} from 'lucide-react';
import { cadetService } from '../../services/cadetService';
import { assignmentService } from '../../services/assignmentService';
import { getCurrentUser } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * CTOVesselDashboard Component
 * UPDATED: Broader filtering to catch "Deck Cadet (DNS)", "Trainee OS", etc.
 */
const CTOVesselDashboard: React.FC = () => {
  const [assignedTrainees, setAssignedTrainees] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [vesselName, setVesselName] = useState('');
  
  const navigate = useNavigate();
  const currentUser = getCurrentUser(); 

  useEffect(() => {
    if (!currentUser) {
        navigate('/login');
        return;
    }
    loadDashboardData();
  }, []);

  /**
   * Helper: Determines if a trainee belongs to the CTO's department
   * Handles variations like "Deck Cadet (BSc)" or "Trainee OS"
   */
  const isRelevantRank = (trainee: any, ctoDept: string) => {
    const dept = ctoDept.toLowerCase();
    const tDept = (trainee.department || '').toLowerCase();
    const tRank = (trainee.rank || '').toLowerCase();

    // 1. Direct Department Match
    if (tDept === dept) return true;

    // 2. Rank Keyword Match (e.g. "Deck" in "Deck Cadet")
    if (tRank.includes(dept)) return true;

    // 3. Special Cases (Add more as needed)
    if (dept === 'deck') {
        return tRank.includes('trainee os') || tRank.includes('dns') || tRank.includes('bsc');
    }
    if (dept === 'engine') {
        return tRank.includes('wiper') || tRank.includes('gme') || tRank.includes('btech');
    }
    if (dept === 'electrical') {
        return tRank.includes('eto') || tRank.includes('electrical');
    }
    if (dept === 'catering') {
        return tRank.includes('cook') || tRank.includes('steward') || tRank.includes('messman');
    }

    return false;
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const myVesselId = currentUser?.vesselId;
      const myDept = currentUser?.department; 

      if (!myVesselId) {
          toast.error("Configuration Error", { description: "Your account is not linked to a valid ship ID." });
          setVesselName("Unknown Vessel");
          return;
      }
      
      setVesselName(currentUser.vesselName || `Vessel #${myVesselId}`);

      // 1. Fetch ALL Trainees
      const allTrainees = await cadetService.getAll();
      
      // 2. STRICT FILTERING
      const myCrew = allTrainees.filter((t: any) => {
        // A. Must be Onboard
        const isOnboard = t.status === 'Onboard';
        
        // B. Must be on MY Vessel (Safe Comparison)
        const isMyShip = String(t.vessel_id) === String(myVesselId);
        
        // C. Must be in MY Department (using helper)
        const isMyDept = myDept ? isRelevantRank(t, myDept) : true;

        return isOnboard && isMyShip && isMyDept;
      });

      setAssignedTrainees(myCrew);

      // 3. Fetch Pending Tasks (Filtered)
      const allPendingTasks = await assignmentService.getPendingCTOApprovals();
      const myPendingTasks = allPendingTasks.filter((task: any) => {
          return String(task.cadet?.vessel_id) === String(myVesselId);
      });

      setPendingCount(myPendingTasks.length);

    } catch (err) {
      console.error("Dashboard Load Error:", err);
      toast.error("Sync Failed", { description: "Could not load vessel statistics." });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    return {
      total: assignedTrainees.length,
      avgProgress: assignedTrainees.length > 0 
        ? Math.round(assignedTrainees.reduce((acc, t) => acc + (t.progress || 0), 0) / assignedTrainees.length) 
        : 0
    };
  }, [assignedTrainees]);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
        <Anchor className="animate-bounce mb-4 text-primary" size={32} />
        <p>Syncing Command Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 1. VESSEL HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-primary/10 border border-primary/20 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
            <Ship size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">{vesselName}</h1>
            <p className="text-muted-foreground text-sm font-medium">
                {currentUser?.rank || 'Chief Training Officer'} • {currentUser?.department} Department
            </p>
          </div>
        </div>
        
        <div className="flex gap-4 mt-4 md:mt-0">
          <div className="bg-background/80 backdrop-blur px-5 py-3 rounded-xl border border-border text-center shadow-sm">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">{currentUser?.department} Trainees</p>
            <p className="text-2xl font-black text-foreground">{stats.total}</p>
          </div>
          <div className="bg-background/80 backdrop-blur px-5 py-3 rounded-xl border border-border text-center shadow-sm">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Dept Avg</p>
            <p className="text-2xl font-black text-primary">{stats.avgProgress}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. ONBOARD TRAINEE ROSTER */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Users size={20} className="text-primary" /> Onboard {currentUser?.department} Team
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedTrainees.length === 0 ? (
                <div className="col-span-2 py-12 text-center border-2 border-dashed border-border rounded-2xl bg-muted/20">
                   <p className="text-muted-foreground">No {currentUser?.department} trainees currently onboard {vesselName}.</p>
                </div>
            ) : (
                assignedTrainees.map((trainee) => (
                <div key={trainee.id} className="bg-card border border-border p-5 rounded-2xl hover:border-primary transition-all group shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-primary border border-border">
                        {trainee.first_name?.[0]}{trainee.last_name?.[0]}
                        </div>
                        <div>
                        <h3 className="font-bold text-foreground">{trainee.first_name} {trainee.last_name}</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{trainee.rank || 'Trainee'}</p>
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
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-muted/50 hover:bg-primary hover:text-primary-foreground text-foreground text-xs font-bold rounded-xl transition-all"
                    >
                        Open TRB for Review <ChevronRight size={14} />
                    </button>
                    </div>
                </div>
                ))
            )}
          </div>
        </div>

        {/* 3. PENDING ACTIONS */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ClipboardCheck size={20} className="text-orange-500" /> Pending Actions
          </h2>
          
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            
            {pendingCount > 0 ? (
                <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl flex gap-3 animate-pulse">
                <Clock size={18} className="text-orange-600 shrink-0 mt-0.5" />
                <div>
                    <p className="text-xs font-bold text-foreground">{pendingCount} Task Verification(s)</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        Trainees have submitted tasks requiring your verification.
                    </p>
                </div>
                </div>
            ) : (
                <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl flex gap-3">
                <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
                <div>
                    <p className="text-xs font-bold text-foreground">All Caught Up</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        No pending verifications for {currentUser?.department}.
                    </p>
                </div>
                </div>
            )}
            
            <button 
                onClick={() => navigate('/cto-approvals')}
                className="w-full mt-2 py-3 bg-foreground text-background text-xs font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              GO TO APPROVAL CENTER <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CTOVesselDashboard;