import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, ChevronRight, CheckCircle2, Circle, Clock, 
  AlertTriangle, ArrowLeft, Filter, Search, Ship 
} from 'lucide-react';
import { getSyllabus, getCadets, getCadetProgress } from '../services/dataService';
import { toast } from 'sonner';

// STANDARD STCW MAPPING (Matches TasksPage)
const STCW_MAP: Record<string, string> = {
  '1': 'Navigation',
  '2': 'Cargo Handling & Stowage',
  '3': 'Ship Operations & Care',
  '4': 'Marine Engineering',
  '5': 'Electrical & Control',
  '6': 'Maintenance & Repair',
  '7': 'Radio Communications'
};

const TRBViewerPage: React.FC = () => {
  const { cadetName } = useParams();
  const navigate = useNavigate();

  // DATA STATE
  const [cadet, setCadet] = useState<any>(null);
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>({});
  
  // UI STATE
  const [activeFunction, setActiveFunction] = useState<string | null>(null);
  const [searchTask, setSearchTask] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, COMPLETED, PENDING, OPEN

  useEffect(() => {
    // 1. Find the Cadet
    const allCadets = getCadets();
    const foundCadet = allCadets.find((c: any) => c.name === decodeURIComponent(cadetName || ''));
    
    if (!foundCadet) {
      toast.error("Cadet not found.");
      navigate('/progress'); // Fallback
      return;
    }
    setCadet(foundCadet);

    // 2. Load Syllabus & Progress
    const loadedSyllabus = getSyllabus();
    setSyllabus(loadedSyllabus);
    setProgress(getCadetProgress(foundCadet.id));

    // 3. Set Default Function
    if (loadedSyllabus.length > 0) setActiveFunction(loadedSyllabus[0].id);

  }, [cadetName, navigate]);

  if (!cadet) return null;

  // --- HELPER: GET FULL FUNCTION NAME ---
  const getFunctionLabel = (funcId: string) => {
    const num = funcId.replace('FUNC-', '');
    const name = STCW_MAP[num] || 'General';
    return `Function ${num}: ${name}`;
  };

  // --- STATS CALCULATION ---
  const getFunctionStats = (funcId: string) => {
    const func = syllabus.find(f => f.id === funcId);
    if (!func) return { total: 0, done: 0 };
    
    let total = 0;
    let done = 0;
    
    func.topics.forEach((t: any) => {
       total += t.tasks.length;
       t.tasks.forEach((task: any) => {
         if (progress[task.id]?.status === 'COMPLETED') done++;
       });
    });
    return { total, done };
  };

  // --- FILTERING LOGIC ---
  const activeFuncData = syllabus.find(f => f.id === activeFunction);
  
  const getFilteredTasks = () => {
     if (!activeFuncData) return [];
     
     const tasks: any[] = [];
     activeFuncData.topics.forEach((topic: any) => {
        topic.tasks.forEach((task: any) => {
           // SEARCH FILTER
           if (searchTask && !task.title.toLowerCase().includes(searchTask.toLowerCase())) return;

           // STATUS FILTER
           const taskStatus = progress[task.id]?.status || 'OPEN';
           if (statusFilter !== 'ALL' && taskStatus !== statusFilter) return;

           tasks.push({ ...task, topicTitle: topic.title, status: taskStatus });
        });
     });
     return tasks;
  };

  const visibleTasks = getFilteredTasks();

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col animate-in fade-in duration-500">
       
       {/* TOP BAR: CADET PROFILE */}
       <div className="bg-card border-b border-border p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             {/* BACK BUTTON: Explicitly goes to /progress */}
             <button 
                onClick={() => navigate('/progress')} 
                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
                title="Back to Fleet Progress"
             >
                <ArrowLeft size={20} />
             </button>
             
             <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20">
                {cadet.name.charAt(0)}
             </div>
             <div>
                <h1 className="font-bold text-foreground text-lg">{cadet.name}</h1>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                   <span className="flex items-center gap-1"><Ship size={12}/> {cadet.vessel || 'Ashore'}</span>
                   <span className="opacity-50">|</span>
                   <span className="font-mono">{cadet.rank}</span>
                </div>
             </div>
          </div>
          
          <div className="flex gap-2">
             <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-foreground uppercase">Global Progress</p>
                <p className="text-sm text-primary font-mono">{cadet.progress || 0}% Completed</p>
             </div>
          </div>
       </div>

       {/* MAIN CONTENT AREA */}
       <div className="flex flex-1 overflow-hidden">
          
          {/* SIDEBAR: FUNCTIONS */}
          <div className="w-72 bg-card border-r border-border flex flex-col overflow-y-auto shrink-0">
             <div className="p-4 font-bold text-xs text-muted-foreground uppercase tracking-wider bg-muted/30 border-b border-border">
                STCW Functions
             </div>
             <div className="flex-1 space-y-1 p-2">
                {syllabus.map(func => {
                  const stats = getFunctionStats(func.id);
                  const isComplete = stats.total > 0 && stats.done === stats.total;
                  
                  return (
                    <button
                      key={func.id}
                      onClick={() => setActiveFunction(func.id)}
                      className={`w-full text-left p-3 rounded-lg text-sm font-medium flex justify-between items-start transition-all group ${
                        activeFunction === func.id 
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                        : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <div className="flex flex-col truncate pr-2">
                         {/* UPDATED: Uses the Mapping Function */}
                         <span className="truncate font-semibold">{getFunctionLabel(func.id)}</span>
                         <span className="text-[10px] opacity-70 font-normal mt-0.5">{stats.done}/{stats.total} Tasks</span>
                      </div>
                      {isComplete && <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
             </div>
          </div>

          {/* TASK LIST AREA */}
          <div className="flex-1 bg-muted/10 flex flex-col overflow-hidden">
             
             {/* FILTERS */}
             <div className="p-4 border-b border-border bg-card flex justify-between items-center gap-4 shadow-sm">
                <div className="relative flex-1 max-w-md">
                   <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
                   <input 
                     type="text" 
                     placeholder="Search tasks..." 
                     value={searchTask}
                     onChange={(e) => setSearchTask(e.target.value)}
                     className="input-field pl-9"
                   />
                </div>
                <div className="flex bg-muted p-1 rounded-lg">
                   {['ALL', 'OPEN', 'COMPLETED'].map(status => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                           statusFilter === status 
                           ? 'bg-background text-foreground shadow-sm' 
                           : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                         {status.charAt(0) + status.slice(1).toLowerCase()}
                      </button>
                   ))}
                </div>
             </div>

             {/* SCROLLABLE TASKS */}
             <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {activeFuncData && (
                   <h2 className="font-bold text-xl text-foreground mb-4 flex items-center gap-2">
                      <BookOpen size={20} className="text-primary"/> 
                      {getFunctionLabel(activeFuncData.id)}
                   </h2>
                )}

                {visibleTasks.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-64 opacity-50 border-2 border-dashed border-border rounded-xl">
                      <BookOpen className="h-12 w-12 mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">No tasks found matching your filters.</p>
                   </div>
                ) : (
                   visibleTasks.map((task: any) => (
                      <div 
                        key={task.id}
                        className={`bg-card border p-4 rounded-xl shadow-sm transition-all hover:shadow-md cursor-pointer group relative overflow-hidden ${
                           task.status === 'COMPLETED' ? 'border-green-500/30 bg-green-500/5' : 'border-border'
                        }`}
                        onClick={() => toast.info("Opening Evidence Modal... (Next Step)")}
                      >
                         {/* LEFT STRIP INDICATOR */}
                         <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                            task.status === 'COMPLETED' ? 'bg-green-500' : 
                            task.status === 'PENDING' ? 'bg-yellow-500' : 'bg-muted-foreground/20'
                         }`} />

                         <div className="flex justify-between items-start pl-3">
                            <div className="flex-1">
                               <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground border border-border">
                                     {task.stcw || 'NO REF'}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
                                     <ChevronRight size={10}/> {task.topicTitle}
                                  </span>
                               </div>
                               <h3 className={`font-bold text-base ${task.status === 'COMPLETED' ? 'text-green-700 dark:text-green-400' : 'text-foreground'}`}>
                                  {task.title}
                               </h3>
                               
                               {/* METADATA TAGS */}
                               <div className="flex flex-wrap gap-2 mt-3">
                                  {task.safety && task.safety !== 'NONE' && (
                                     <span className="flex items-center gap-1 text-[10px] text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded font-medium border border-red-200 dark:border-red-900">
                                        <AlertTriangle size={10} /> {task.safety}
                                     </span>
                                  )}
                                  {task.frequency && (
                                     <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded font-medium border border-border">
                                        <Clock size={10} /> {task.frequency}
                                     </span>
                                  )}
                                  {task.mandatory && (
                                     <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded font-medium border border-blue-200 dark:border-blue-900">
                                        Mandatory
                                     </span>
                                  )}
                               </div>
                            </div>

                            {/* STATUS ICON */}
                            <div className="pl-6 pt-1">
                               {task.status === 'COMPLETED' ? (
                                  <div className="flex flex-col items-center text-green-600">
                                     <CheckCircle2 size={26} />
                                     <span className="text-[10px] font-bold mt-1">DONE</span>
                                  </div>
                               ) : task.status === 'PENDING' ? (
                                  <div className="flex flex-col items-center text-yellow-600">
                                     <Clock size={26} />
                                     <span className="text-[10px] font-bold mt-1">REVIEW</span>
                                  </div>
                               ) : (
                                  <div className="flex flex-col items-center text-muted-foreground/20 group-hover:text-primary/40 transition-colors">
                                     <Circle size={26} />
                                     <span className="text-[10px] font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">DO</span>
                                  </div>
                               )}
                            </div>
                         </div>
                      </div>
                   ))
                )}
             </div>
          </div>
       </div>
    </div>
  );
};

export default TRBViewerPage;