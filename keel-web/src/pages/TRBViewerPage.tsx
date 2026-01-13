import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, Clock, ChevronRight, FileText, Camera, AlertTriangle } from 'lucide-react';
import { getSyllabus } from '../services/dataService'; // We use the service now

const TRBViewerPage: React.FC = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  // STATE MANAGEMENT
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [activeFunction, setActiveFunction] = useState<string | null>(null);

  // LOAD DATA ON MOUNT
  useEffect(() => {
    const data = getSyllabus();
    setSyllabus(data);
    
    // Auto-select the first function (Chapter) if available
    if (data.length > 0) {
      setActiveFunction(data[0].id);
    }
  }, []);

  // MOCK STATUS GENERATOR (Just for visuals until we have real trainee progress)
  const getTaskStatus = (taskId: string) => {
    // Generate a consistent pseudo-random status based on task ID length
    const hash = taskId.length + Math.floor(Math.random() * 10);
    if (hash % 5 === 0) return 'completed';
    if (hash % 5 === 1) return 'pending';
    return 'locked'; // Most tasks start locked
  };

  // EMPTY STATE HANDLER (If no syllabus imported yet)
  if (syllabus.length === 0) {
     return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] space-y-4 animate-in fade-in">
           <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-600">
             <AlertTriangle size={32} />
           </div>
           <h2 className="text-xl font-bold text-foreground">TRB Syllabus Not Loaded</h2>
           <p className="text-muted-foreground max-w-md text-center">
             The system does not have a Master Task List. Please go to <b>System {'>'} TRB Syllabus</b> to import your Excel file.
           </p>
           <button onClick={() => navigate(-1)} className="text-primary hover:underline font-medium">Go Back</button>
        </div>
     );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col animate-in fade-in duration-500">
      
      {/* PAGE HEADER */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Digital Training Record Book</h1>
          <p className="text-sm text-muted-foreground">Viewing Record for: <span className="font-semibold text-primary">{decodeURIComponent(id || 'Trainee')}</span></p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* SIDEBAR: FUNCTIONS (Chapters) */}
        <div className="w-1/3 max-w-xs bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 bg-muted/30 border-b border-border font-bold text-xs text-muted-foreground uppercase tracking-wider">
            Functions / Chapters
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {syllabus.map((func) => (
              <button
                key={func.id}
                onClick={() => setActiveFunction(func.id)}
                className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                  activeFunction === func.id 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span className="truncate">{func.title}</span>
                {activeFunction === func.id && <ChevronRight size={14} />}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT: TASKS */}
        <div className="flex-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm">
           {syllabus.filter(f => f.id === activeFunction).map(func => (
             <div key={func.id} className="flex flex-col h-full">
               
               {/* CHAPTER HEADER */}
               <div className="p-6 border-b border-border bg-muted/10">
                 <h2 className="text-2xl font-bold text-foreground">{func.title}</h2>
                 <p className="text-muted-foreground text-sm mt-1">
                    {func.topics.reduce((acc: number, t: any) => acc + t.tasks.length, 0)} Tasks in this section
                 </p>
               </div>

               {/* TOPICS & TASKS LIST */}
               <div className="overflow-y-auto flex-1 p-6 space-y-8">
                 {func.topics.map((topic: any) => (
                   <div key={topic.id}>
                     <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                       <span className="w-1 h-6 bg-primary rounded-full"></span>
                       {topic.title}
                     </h3>
                     
                     <div className="space-y-3">
                       {topic.tasks.map((task: any) => {
                         const status = getTaskStatus(task.id);
                         
                         return (
                           <div 
                             key={task.id} 
                             className="group flex items-start gap-4 p-4 rounded-xl border border-border bg-background hover:border-primary/50 hover:shadow-md transition-all duration-200"
                           >
                             {/* STATUS ICON */}
                             <div className="mt-1 shrink-0">
                               {status === 'completed' && <CheckCircle2 className="text-green-500" size={20} />}
                               {status === 'pending' && <Clock className="text-amber-500" size={20} />}
                               {status === 'locked' && <Circle className="text-muted-foreground/30" size={20} />}
                             </div>

                             <div className="flex-1 min-w-0">
                               <div className="flex justify-between items-start gap-4">
                                 <div>
                                   <h4 className={`font-medium text-sm ${status === 'locked' ? 'text-muted-foreground' : 'text-foreground'}`}>
                                     {task.title}
                                   </h4>
                                   <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                                 </div>
                                 <span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground shrink-0 whitespace-nowrap border border-border">
                                   {task.stcw || 'NO REF'}
                                 </span>
                               </div>

                               {/* METADATA TAGS (Safety, Frequency, etc.) */}
                               <div className="flex flex-wrap gap-2 mt-3">
                                  {task.frequency && (
                                    <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                                      {task.frequency}
                                    </span>
                                  )}
                                  {task.safety && task.safety !== 'NONE' && (
                                     <span className="text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded border border-red-500/20 flex items-center gap-1">
                                        <AlertTriangle size={10} /> {task.safety}
                                     </span>
                                  )}
                                  {task.dept && (
                                     <span className="text-[10px] border border-border px-2 py-0.5 rounded text-muted-foreground">
                                       {task.dept}
                                     </span>
                                  )}
                               </div>

                               {/* HOVER ACTIONS */}
                               <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {status !== 'locked' && (
                                    <>
                                      <button className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary hover:text-primary-foreground transition-colors">
                                        <Camera size={12} /> Add Evidence
                                      </button>
                                      <button className="flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-1 rounded hover:bg-muted/80 hover:text-foreground">
                                        <FileText size={12} /> Notes
                                      </button>
                                    </>
                                  )}
                               </div>
                             </div>

                             {/* STATUS BADGE */}
                             <div className="mt-1 shrink-0">
                               {status === 'completed' && (
                                 <span className="text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                                   VERIFIED
                                 </span>
                               )}
                               {status === 'pending' && (
                                 <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
                                   IN PROGRESS
                                 </span>
                               )}
                             </div>

                           </div>
                         );
                       })}
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           ))}
        </div>

      </div>
    </div>
  );
};

export default TRBViewerPage;