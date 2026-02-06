// keel-web/src/pages/TRBViewerPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, ChevronRight, CheckCircle2, Circle, Clock, 
  AlertTriangle, ArrowLeft, Search, Ship, User, Check,
  AlertCircle, Download, ShieldCheck, Anchor,
  Activity, Layers, Info, ExternalLink, Calendar,
  TrendingUp, Award, LifeBuoy, MapPin, Gauge, ShieldAlert
} from 'lucide-react';
import { cadetService } from '../services/cadetService';
import { getTasks } from '../services/taskService';
import { toast } from 'sonner';

// --- MARITIME STCW FUNCTION MAPPING (Global Standards) ---
const STCW_MAP: Record<string, string> = {
  '1': 'Navigation & Watchkeeping',
  '2': 'Cargo Handling & Stowage',
  '3': 'Controlling Ship Ops & Safety',
  '4': 'Marine Engineering',
  '5': 'Electrical & Control',
  '6': 'Maintenance & Repair',
  '7': 'Radio Communications'
};

interface STCWSection {
  id: string;
  label: string;
  tasks: any[];
  progress: number;
}

/**
 * TRBViewerPage Component
 * A functional Command Center for Digital Training Record Books.
 * FIXED: Light/Dark theme sync using semantic background classes.
 * FIXED: Trainee Intelligence Dashboard with relevant KPI cards.
 */
const TRBViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // --- DATA STATE ---
  const [cadet, setCadet] = useState<any>(null);
  const [sections, setSections] = useState<STCWSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<STCWSection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // --- UI STATE ---
  const [searchTask, setSearchTask] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // --- DATA FETCHING & PROCESSING ---
  const loadTRBData = async () => {
    if (!id) {
        setError("Missing Trainee identifier.");
        return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // Sync Trainee Profile and Syllabus Tasks in parallel
      const [cadetData, allTasks] = await Promise.all([
        cadetService.getById(Number(id)),
        getTasks()
      ]);

      if (!cadetData) {
        setError("Trainee record not found in database.");
        return;
      }

      setCadet(cadetData);

      // Organize tasks into their respective STCW Functions
      const taskArray = Array.isArray(allTasks) ? allTasks : [];
      const grouped = taskArray.reduce((acc: STCWSection[], task: any) => {
        const funcId = String(task.function_id || '1');
        let section = acc.find(s => s.id === funcId);
        
        if (!section) {
          section = { 
            id: funcId, 
            label: STCW_MAP[funcId] || 'Shipboard Operations', 
            tasks: [],
            progress: 0
          };
          acc.push(section);
        }
        section.tasks.push(task);
        return acc;
      }, []);

      // Calculate the progress percentage for each individual section
      const processedSections = grouped.map(s => {
        const completed = s.tasks.filter((t: any) => t.status === 'COMPLETED').length;
        return {
          ...s,
          progress: Math.round((completed / s.tasks.length) * 100) || 0
        };
      }).sort((a, b) => Number(a.id) - Number(b.id));

      setSections(processedSections);
      
      // Default selection to the first available STCW Function
      if (processedSections.length > 0 && !selectedSection) {
        setSelectedSection(processedSections[0]);
      }

    } catch (err: any) {
      console.error("MARITIME DATA ERROR:", err);
      setError("Failed to synchronize with the vessel server.");
      toast.error("Database Connection Lost.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTRBData();
  }, [id]);

  // --- FILTERING ENGINE ---
  const visibleTasks = selectedSection?.tasks.filter((task: any) => {
    const matchesSearch = (task.title || '').toLowerCase().includes(searchTask.toLowerCase()) ||
                          (task.stcw_code || '').toLowerCase().includes(searchTask.toLowerCase());
    const status = task.status || 'OPEN';
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // --- RENDER: LOADING ---
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-140px)] flex-col items-center justify-center bg-background text-primary">
        <div className="w-14 h-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="font-black text-muted-foreground uppercase tracking-[0.2em] text-[10px] animate-pulse">Syncing Maritime Records</p>
      </div>
    );
  }

  // --- RENDER: ERROR ---
  if (error) {
    return (
      <div className="flex h-[calc(100vh-140px)] flex-col items-center justify-center bg-background p-10 text-center animate-in fade-in">
        <AlertCircle size={50} className="text-destructive mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Audit Synchronization Failed</h2>
        <p className="text-muted-foreground max-w-sm mb-6 text-sm font-medium">{error}</p>
        <button 
          onClick={() => navigate('/training-progress')} 
          className="bg-primary text-primary-foreground px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20"
        >
          Return to Matrix
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-background p-4 space-y-4 overflow-hidden transition-colors duration-300">
      
      {/* --- COMMAND HEADER --- */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/training-progress')} 
            className="p-3 bg-card border border-border rounded-2xl hover:text-primary transition-all shadow-sm group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-3 tracking-tight">
              <BookOpen size={24} className="text-primary" /> Digital TRB Viewer
            </h1>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Standards of Training, Certification and Watchkeeping (STCW)</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all shadow-sm">
            <Download size={14} /> Export Log
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-105 active:scale-95 transition-all">
            <ShieldCheck size={14} /> Endorse Section
          </button>
        </div>
      </div>

      {/* --- TRAINEE INTELLIGENCE DASHBOARD --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        {/* IDENTITY CARD */}
        <div className="bg-card border border-border rounded-3xl p-5 flex items-center gap-5 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black border border-primary/20 shrink-0 text-xl">
            {cadet?.first_name?.charAt(0)}{cadet?.last_name?.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-black text-foreground truncate uppercase tracking-tight leading-tight">{cadet?.first_name} {cadet?.last_name}</h3>
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center gap-2">
                <Ship size={12} className="text-primary" />
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{cadet?.vessel?.name || 'Ashore'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Anchor size={12} className="text-primary" />
                <span className="text-[10px] text-primary font-black uppercase tracking-widest">{cadet?.rank}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SEA TIME MANDATE CARD */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 text-primary opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={48} />
          </div>
          <div className="flex items-center gap-2 mb-3">
             <Calendar size={14} className="text-primary" />
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Sea Time Requirement</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-foreground tracking-tighter">245</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">/ 365 Days</p>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full mt-4 overflow-hidden border border-border/50">
            <div className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.3)]" style={{ width: '67%' }} />
          </div>
        </div>

        {/* TASK VELOCITY CARD */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 text-primary opacity-5 group-hover:opacity-10 transition-opacity">
            <Gauge size={48} />
          </div>
          <div className="flex items-center gap-2 mb-3">
             <Activity size={14} className="text-primary" />
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">TRB Completion</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-primary tracking-tighter">{cadet?.progress || 0}%</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Master Verified</p>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full mt-4 overflow-hidden border border-border/50">
            <div className="h-full bg-primary transition-all duration-1000 shadow-[0_0_8px_rgba(49,148,160,0.3)]" style={{ width: `${cadet?.progress || 0}%` }} />
          </div>
        </div>

        {/* SAFETY ALERT CARD */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 text-orange-500 opacity-5 group-hover:opacity-10 transition-opacity">
            <LifeBuoy size={48} />
          </div>
          <div className="flex items-center gap-2 mb-3">
             <ShieldAlert size={14} className="text-orange-500" />
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Safety Critical</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-orange-500 tracking-tighter">12 <span className="text-xs text-muted-foreground">/ 18</span></p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic ml-2">Validated</p>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full mt-4 overflow-hidden border border-border/50">
            <div className="h-full bg-orange-500 transition-all duration-1000 shadow-[0_0_8px_rgba(249,115,22,0.3)]" style={{ width: '66%' }} />
          </div>
        </div>
      </div>

      {/* --- MAIN AUDIT INTERFACE --- */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* SIDEBAR NAVIGATION: STCW FUNCTIONS */}
        <div className="w-96 flex flex-col gap-2.5 overflow-y-auto custom-scrollbar shrink-0 pb-4 pr-1">
          <div className="px-3 py-1.5 flex items-center justify-between">
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 opacity-60">
              <Layers size={14} /> Training Functions
            </p>
          </div>
          
          {sections.map((section) => {
            const isSelected = selectedSection?.id === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setSelectedSection(section)}
                className={`flex flex-col p-5 rounded-[1.75rem] border transition-all text-left group relative ${
                  isSelected 
                    ? 'bg-primary/5 border-primary shadow-lg ring-1 ring-primary/20' 
                    : 'bg-card border-border hover:border-primary/40'
                }`}
              >
                <div className="flex justify-between items-start mb-2.5">
                  <span className={`text-[10px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    FUNC-0{section.id}
                  </span>
                  <div className={`flex items-center gap-1.5 text-[11px] font-black ${section.progress === 100 ? 'text-green-500' : 'text-muted-foreground opacity-60'}`}>
                    {section.progress === 100 && <CheckCircle2 size={14} />} {section.progress}%
                  </div>
                </div>
                
                <span className={`text-sm font-bold leading-tight pr-6 transition-colors ${isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                  {section.label}
                </span>
                
                <div className="mt-4 w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${section.progress === 100 ? 'bg-green-500' : 'bg-primary/50'}`} 
                    style={{ width: `${section.progress}%` }} 
                  />
                </div>
                <div className="absolute right-4 bottom-5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={16} className="text-primary" />
                </div>
              </button>
            );
          })}
        </div>

        {/* TASK MATRIX PANEL */}
        <div className="flex-1 bg-card border border-border rounded-[2.5rem] flex flex-col overflow-hidden shadow-sm">
          
          {/* MATRIX SEARCH & FILTER */}
          <div className="p-6 border-b border-border flex flex-col md:flex-row justify-between items-center gap-6 shrink-0 bg-muted/20">
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search specific task or STCW code..." 
                value={searchTask}
                onChange={(e) => setSearchTask(e.target.value)}
                className="w-full bg-card border-border border-2 h-12 pl-12 pr-4 rounded-2xl text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
              />
            </div>
            
            <div className="flex items-center gap-1.5 bg-muted/40 p-1.5 rounded-2xl border border-border">
              {['ALL', 'COMPLETED', 'OPEN'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                    statusFilter === s 
                      ? 'bg-card text-primary shadow-md border border-border' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* AUDITABLE TASK LIST */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
            {visibleTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 italic gap-4">
                <Search size={80} strokeWidth={1} />
                <p className="text-lg font-black uppercase tracking-widest">No matching tasks found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
                {visibleTasks.map((task: any) => (
                  <div 
                    key={task.id}
                    className="flex flex-col p-5 bg-card border border-border rounded-[1.75rem] hover:border-primary/50 transition-all group cursor-pointer shadow-sm active:scale-[0.98] relative overflow-hidden"
                    onClick={() => toast.info(`Viewing Evidence for ${task.stcw_code || 'Task'}`)}
                  >
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all ${
                        task.status === 'COMPLETED' 
                          ? 'bg-green-500/10 border-green-500/20 text-green-600' 
                          : 'bg-muted border-border text-muted-foreground group-hover:border-primary/30'
                      }`}>
                        {task.status === 'COMPLETED' ? <ShieldCheck size={28} strokeWidth={2.2} /> : <Circle size={24} strokeWidth={1.5} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-black text-primary uppercase tracking-[0.15em]">{task.stcw_code || 'STCW-CODE'}</span>
                          {task.safety_critical && (
                            <div className="flex items-center gap-1 text-[8px] font-black bg-orange-500/10 text-orange-600 px-1.5 py-0.5 rounded-md uppercase border border-orange-500/20">
                              <AlertTriangle size={8} /> High Risk
                            </div>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                          {task.title}
                        </h4>
                      </div>
                      <ChevronRight size={20} className="text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-auto border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1.5">
                          <div className="w-5 h-5 rounded-full bg-muted border border-card flex items-center justify-center text-[7px] font-black text-muted-foreground">M</div>
                          <div className="w-5 h-5 rounded-full bg-primary/20 border border-card flex items-center justify-center text-[7px] font-black text-primary">C</div>
                        </div>
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic opacity-60">Verification Path</span>
                      </div>
                      <span className="text-[10px] font-black text-primary group-hover:underline uppercase tracking-widest flex items-center gap-1.5">
                        Audit Evidence <ExternalLink size={11} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* STATUS FOOTER */}
          <div className="p-6 border-t border-border flex justify-between items-center shrink-0 bg-muted/10">
             <div className="flex items-center gap-8">
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                   <Info size={14} className="text-primary" /> Matrix Summary: {visibleTasks.length} Visible
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-md" /> Done
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-md" /> Open
                  </div>
                </div>
             </div>
             
             <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">
                <Clock size={12} /> Live Sync: {new Date().toLocaleTimeString()}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TRBViewerPage;