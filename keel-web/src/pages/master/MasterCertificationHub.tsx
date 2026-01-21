//keel-web/src/pages/master/MasterCertificationHub.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  ShieldCheck, 
  Search,
  Filter,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cadetService } from '../../services/cadetService';
import { toast } from 'sonner';

interface Trainee {
  id: number;
  first_name: string;
  last_name: string;
  rank: string;
  department: string;
  status: string;
  progress: number;
  indos_number?: string;
}

/**
 * MasterCertificationHub Component
 * Real-time view of crew technical readiness.
 */
const MasterCertificationHub: React.FC = () => {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const BRAND_COLOR = '#3194A0';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await cadetService.getAll();
      // Filter: Only show active onboard crew for certification
      const onboardCrew = data.filter((t: any) => t.status === 'Onboard');
      setTrainees(onboardCrew);
    } catch (err) {
      toast.error("Sync Failed", { description: "Could not load vessel personnel." });
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC: SEPARATE READY VS IN-PROGRESS ---
  const { readyForCert, inProgress } = useMemo(() => {
    return {
      // Threshold: 90% progress triggers "Ready for Certification"
      readyForCert: trainees.filter(t => (t.progress || 0) >= 90), 
      inProgress: trainees.filter(t => (t.progress || 0) < 90)
    };
  }, [trainees]);

  const filteredReady = readyForCert.filter(t => 
    `${t.first_name} ${t.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.indos_number || '').includes(searchTerm)
  );

  if (loading) {
     return (
        <div className="h-96 flex items-center justify-center">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
     );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* 1. HERO HEADER: TOTAL READINESS */}
      <div className="relative overflow-hidden bg-card border border-border rounded-3xl p-8 shadow-sm transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
              Certification Command <Award size={32} style={{ color: BRAND_COLOR }} />
            </h1>
            <p className="text-muted-foreground max-w-md">
              Review and issue official Steering and Competency Certificates for personnel who have completed technical verification.
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-muted/50 p-4 rounded-2xl border border-border text-center min-w-30">
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Awaiting Sign</p>
              <p className="text-2xl font-black text-foreground">{readyForCert.length}</p>
            </div>
            <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 text-center min-w-30">
              <p className="text-[10px] font-bold text-primary uppercase mb-1">Total Onboard</p>
              <p className="text-2xl font-black text-primary">{trainees.length}</p>
            </div>
          </div>
        </div>
        <ShieldCheck className="absolute -bottom-10 -right-10 text-muted/10 w-64 h-64 -rotate-12" />
      </div>

      {/* 2. SEARCH & FILTER BAR */}
      <div className="flex items-center gap-4 bg-card p-2 rounded-2xl border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 text-muted-foreground" size={18} />
          <input 
            type="text"
            placeholder="Search personnel by name or INDOS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent pl-12 pr-4 py-2.5 outline-none text-foreground"
          />
        </div>
        <button className="p-2.5 hover:bg-muted rounded-xl transition-colors text-muted-foreground border border-transparent hover:border-border">
          <Filter size={20} />
        </button>
      </div>

      {/* 3. PRIMARY SECTION: READY FOR CERTIFICATION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 size={20} className="text-green-500" /> Ready for Endorsement
          </h2>
          <span className="text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-1 rounded-md uppercase">Action Required</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReady.length === 0 ? (
            <div className="col-span-full py-12 bg-muted/20 border-2 border-dashed border-border rounded-3xl text-center">
              <p className="text-muted-foreground italic">No personnel have reached the 90% technical threshold for final sign-off yet.</p>
            </div>
          ) : filteredReady.map((trainee) => (
            <div key={trainee.id} className="group bg-card border-2 border-primary/20 rounded-3xl p-6 hover:shadow-xl hover:shadow-primary/5 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-lg">
                  {trainee.first_name?.[0]}{trainee.last_name?.[0]}
                </div>
                <div className="text-right">
                  <div className="bg-green-500/10 text-green-600 text-[10px] font-black px-2 py-1 rounded uppercase mb-1">
                    VERIFIED
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{trainee.indos_number || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {trainee.first_name} {trainee.last_name}
                </h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{trainee.rank} • {trainee.department || 'Deck'}</p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => navigate('/master-approvals')}
                  className="w-full py-3 bg-foreground text-background text-xs font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={14} /> REVIEW FINAL TASKS
                </button>
                <button 
                  className="w-full py-3 bg-primary text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <Award size={14} /> GENERATE STEERING CERT
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. SECONDARY SECTION: TRAINING IN PROGRESS */}
      <section className="space-y-4 pt-4 border-t border-border">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 px-2">
          <Clock size={20} className="text-muted-foreground" /> In-Progress Training
        </h2>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Personnel</th>
                <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Department</th>
                <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Progress</th>
                <th className="p-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inProgress.length === 0 ? (
                 <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">All onboard crew are fully certified!</td>
                 </tr>
              ) : inProgress.map((item) => (
                <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-bold text-[10px] text-muted-foreground border border-border">
                        {item.first_name?.[0]}{item.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-foreground leading-none">{item.first_name} {item.last_name}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{item.rank}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                      {item.department || 'Deck'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3 w-32">
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-muted-foreground" style={{ width: `${item.progress || 0}%` }} />
                      </div>
                      <span className="text-[10px] font-black text-muted-foreground">{item.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => navigate(`/trainee-trb/${item.id}`)}
                      className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default MasterCertificationHub;