import React, { useState, useEffect } from 'react';
import { BookOpen, Upload, ChevronRight, AlertTriangle, Trash2, Plus, Edit, Copy, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import ImportTaskModal from '../components/trb/ImportTaskModal';
import TaskFormModal from '../components/trb/TaskFormModal';
import { taskService } from '../services/taskService'; // <--- CONNECTED TO DB

const STCW_MAP: Record<string, string> = {
  '1': 'Navigation',
  '2': 'Cargo Handling & Stowage',
  '3': 'Ship Operations & Care',
  '4': 'Marine Engineering',
  '5': 'Electrical & Control',
  '6': 'Maintenance & Repair',
  '7': 'Radio Communications'
};

const TasksPage: React.FC = () => {
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [activeFunction, setActiveFunction] = useState<string | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  // SEARCH & FILTER STATES
  const [taskSearch, setTaskSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  // MODAL STATES
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  // --- 1. LOAD DATA (FROM DATABASE) ---
  const loadData = async () => {
    try {
      const data = await taskService.getAll(); // Fetch Tree from Backend
      setSyllabus(data);

      if (data.length > 0 && !activeFunction) {
        setActiveFunction(data[0].id);
        // Auto-expand first function's topics
        if (data[0].topics) {
          const initialTopics = new Set(data[0].topics.map((t: any) => t.id));
          setExpandedTopics(initialTopics as Set<string>);
        }
      }
    } catch (error) {
      console.error("Failed to load syllabus", error);
      toast.error("Could not load Master Task List.");
    }
  };

  const toggleTopic = (topicId: string) => {
    const newSet = new Set(expandedTopics);
    newSet.has(topicId) ? newSet.delete(topicId) : newSet.add(topicId);
    setExpandedTopics(newSet);
  };

  // --- 2. IMPORT (TO DATABASE) ---
  const handleImport = async (flatData: any[]) => {
    try {
      let count = 0;
      for (const item of flatData) {
        // Map CSV fields to DB fields
        await taskService.create({
          code: item.code || item.stcw,
          title: item.title,
          department: item.dept || 'Deck',
          section: item.section || 'General',
          partNum: item.function || '1',
          safety_level: item.safety || 'Green'
        });
        count++;
      }
      toast.success(`Imported ${count} tasks successfully.`);
      loadData(); // Refresh Tree
      setIsImportOpen(false);
    } catch (error) {
      toast.error("Import failed.");
    }
  };

  // --- 3. DELETE (FROM DATABASE) ---
  const handleDeleteAll = async () => {
    // Note: This API endpoint might need to be created if you want "Delete All"
    // For now, we can warn that it's disabled or implement bulk delete later.
    toast.error("Bulk delete is disabled for safety in Database mode.");
  };

  const deleteTask = async (funcId: string, topicId: string, taskId: number) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await taskService.delete(taskId);
      toast.info("Task removed.");
      loadData(); // Refresh Tree
    } catch (error) {
      toast.error("Failed to delete task.");
    }
  };

  // --- 4. CLONE (IN DATABASE) ---
  const cloneTask = async (funcId: string, topicId: string, task: any) => {
    try {
      await taskService.create({
        code: `${task.code}-COPY-${Math.floor(Math.random() * 1000)}`,
        title: `${task.title} (Copy)`,
        department: task.dept,
        safety_level: task.safety,
        partNum: funcId.replace('FUNC-', ''),
        section: task.section // You might need to pass section name here
      });
      toast.success("Task duplicated.");
      loadData(); // Refresh Tree
    } catch (error) {
      toast.error("Failed to duplicate task.");
    }
  };

  // --- 5. SAVE/UPDATE (TO DATABASE) ---
  const handleSaveTask = async (formData: any) => {
    try {
      if (formData.code && editingTask) {
         // Update Existing
         // Note: We use editingTask.id because formData might not have the DB ID if form logic differs
         await taskService.update(editingTask.id, formData);
         toast.success("Task updated.");
      } else {
         // Create New
         await taskService.create(formData);
         toast.success("New task created.");
      }
      
      setIsTaskFormOpen(false);
      setEditingTask(null);
      loadData(); // Refresh Tree
      
      // Auto-focus logic (Optional, based on your original UX desires)
      const funcId = `FUNC-${formData.partNum}`;
      setActiveFunction(funcId);
      
    } catch (error: any) {
      toast.error(error.message || "Operation failed.");
    }
  };

  const openEdit = (task: any, funcId: string, sectionTitle: string) => {
    setEditingTask({
      id: task.id, // Ensure ID is passed
      code: task.code || task.stcw,
      title: task.title,
      department: task.dept,
      safety_level: task.safety,
      partNum: funcId.replace('FUNC-', ''),
      section: sectionTitle
    });
    setIsTaskFormOpen(true);
  };

  const getFunctionLabel = (funcId: string) => {
    // If Backend sends full title, use it. If not, map it.
    // The backend we built sends titles like "Function 1: Navigation", 
    // but strict STCW mapping handles fallback.
    const func = syllabus.find(f => f.id === funcId);
    if (func && func.title) return func.title;

    const num = funcId.replace('FUNC-', '');
    const name = STCW_MAP[num] || 'General';
    return `Function ${num}: ${name}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-foreground">TRB Syllabus</h1>
          <p className="text-muted-foreground text-sm">Manage Master Task List (STCW Compliant).</p>
        </div>
        <div className="flex gap-2">
           {syllabus.length > 0 && (
             <button onClick={handleDeleteAll} className="bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 px-3 py-2 rounded-lg transition-all" title="Clear All">
               <Trash2 size={18} />
             </button>
           )}
           <button onClick={() => setIsImportOpen(true)} className="bg-card hover:bg-muted text-foreground border border-input px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm active:scale-95">
             <Upload size={18} /><span>Import</span>
           </button>
           <button onClick={() => { setEditingTask(null); setIsTaskFormOpen(true); }} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm active:scale-95">
             <Plus size={18} /><span>Add Task</span>
           </button>
        </div>
      </div>

      {syllabus.length === 0 ? (
        <div className="flex-1 bg-card border border-border rounded-xl flex flex-col items-center justify-center text-center p-8 border-dashed">
           <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
             <BookOpen className="h-8 w-8 text-muted-foreground" />
           </div>
           <h3 className="text-lg font-medium text-foreground">Syllabus Not Defined</h3>
           <p className="mt-1 text-sm text-muted-foreground max-w-sm">
             Import from Excel or create your first task to begin.
           </p>
        </div>
      ) : (
        <div className="flex-1 flex gap-6 overflow-hidden">
          
          {/* LEFT: SIDEBAR (STCW FUNCTIONS) */}
          <div className="w-1/3 max-w-xs bg-card border border-border rounded-xl flex flex-col overflow-hidden">
             <div className="p-4 bg-muted/30 border-b border-border font-bold text-xs text-muted-foreground uppercase flex items-center gap-2">
                <BookOpen size={14} /> STCW Functions
             </div>
             <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {syllabus.map(func => (
                  <button
                    key={func.id}
                    onClick={() => setActiveFunction(func.id)}
                    className={`w-full text-left p-3 rounded-lg text-sm font-medium flex justify-between items-center transition-all ${
                      activeFunction === func.id ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span className="truncate">{getFunctionLabel(func.id)}</span>
                    {activeFunction === func.id && <ChevronRight size={14}/>}
                  </button>
                ))}
             </div>
          </div>

          {/* RIGHT: CONTENT (COMPETENCIES & TASKS) */}
          <div className="flex-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm">
             
             {/* RIGHT COLUMN HEADER WITH SEARCH & FILTER */}
             <div className="p-3 border-b border-border bg-muted/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="font-bold text-xs text-muted-foreground uppercase flex items-center gap-2">
                   <Filter size={14} /> Competencies & Tasks
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                   {/* SECTION FILTER */}
                   <div className="relative w-full sm:w-48">
                      <input 
                        type="text" 
                        placeholder="Filter Sections..." 
                        value={sectionFilter}
                        onChange={(e) => setSectionFilter(e.target.value)}
                        className="w-full bg-background pl-3 pr-3 py-1.5 rounded-md border border-input text-xs focus:ring-1 focus:ring-primary outline-none transition-all"
                      />
                   </div>

                   {/* TASK SEARCH */}
                   <div className="relative w-full sm:w-64">
                      <Search className="absolute left-2.5 top-1.5 text-muted-foreground" size={14} />
                      <input 
                        type="text" 
                        placeholder="Search Tasks..." 
                        value={taskSearch}
                        onChange={(e) => setTaskSearch(e.target.value)}
                        className="w-full bg-background pl-8 pr-3 py-1.5 rounded-md border border-input text-xs focus:ring-1 focus:ring-primary outline-none transition-all"
                      />
                   </div>
                </div>
             </div>

             <div className="overflow-y-auto flex-1 p-6 space-y-4">
               {syllabus
                 .filter(f => f.id === activeFunction)
                 .map(func => (
                 <div key={func.id}>
                    {func.topics
                      // 1. FILTER SECTIONS
                      .filter((topic: any) => topic.title.toLowerCase().includes(sectionFilter.toLowerCase()))
                      .map((topic: any) => {
                        // 2. FILTER TASKS
                        const filteredTasks = topic.tasks.filter((t: any) => 
                          t.title.toLowerCase().includes(taskSearch.toLowerCase()) || 
                          (t.description || '').toLowerCase().includes(taskSearch.toLowerCase())
                        );

                        // If searching tasks, only show topics containing matches
                        if (taskSearch && filteredTasks.length === 0) return null;

                        const isExpanded = expandedTopics.has(topic.id) || taskSearch.length > 0; // Auto-expand on search

                        return (
                          <div key={topic.id} className="border border-border rounded-lg overflow-hidden bg-background mb-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                             
                             {/* ACCORDION HEADER */}
                             <button 
                               onClick={() => toggleTopic(topic.id)}
                               className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                             >
                               <div className="flex items-center gap-3">
                                 <div className={`p-1 rounded-full transition-transform duration-200 ${isExpanded ? 'rotate-90 bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
                                    <ChevronRight size={16} />
                                 </div>
                                 <h3 className="font-bold text-foreground text-sm">{topic.title}</h3>
                                 <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
                                   {filteredTasks.length} Tasks
                                 </span>
                               </div>
                             </button>

                             {/* ACCORDION CONTENT */}
                             {isExpanded && (
                               <div className="p-4 space-y-3">
                                  {filteredTasks.length === 0 ? (
                                     <p className="text-xs text-muted-foreground italic text-center py-2">No matching tasks found.</p>
                                  ) : (
                                     filteredTasks.map((task: any) => (
                                      <div key={task.id} className="group bg-background border border-border p-4 rounded-lg hover:border-primary/40 transition-all relative">
                                         
                                         <div className="flex justify-between items-start pr-20">
                                            <h4 className="font-medium text-sm text-foreground">{task.title}</h4>
                                         </div>
                                         <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                                         
                                         <div className="flex flex-wrap gap-2 mt-3 items-center">
                                            <span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground border border-border">
                                               {task.stcw || task.code || 'NO REF'}
                                            </span>
                                            {task.dept && <span className="text-[10px] border border-border px-2 py-0.5 rounded text-muted-foreground">{task.dept}</span>}
                                            {task.safety && task.safety !== 'Green' && (
                                               <span className={`text-[10px] bg-red-500/10 text-red-600 px-2 py-0.5 rounded border border-red-500/20 flex items-center gap-1`}>
                                                  <AlertTriangle size={10} /> {task.safety}
                                               </span>
                                            )}
                                         </div>

                                         {/* ACTION BUTTONS */}
                                         <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded-md shadow-sm p-1">
                                            <button 
                                              onClick={() => cloneTask(func.id, topic.id, task)}
                                              className="p-1.5 text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                              title="Duplicate"
                                            >
                                              <Copy size={14} />
                                            </button>
                                            <div className="w-px h-3 bg-border mx-0.5"></div>
                                            <button 
                                              onClick={() => openEdit(task, func.id, topic.title)}
                                              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded"
                                              title="Edit"
                                            >
                                              <Edit size={14} />
                                            </button>
                                            <div className="w-px h-3 bg-border mx-0.5"></div>
                                            <button 
                                              onClick={() => deleteTask(func.id, topic.id, task.id)}
                                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                                              title="Delete"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                         </div>
                                      </div>
                                    ))
                                  )}
                               </div>
                             )}
                          </div>
                        );
                      })}
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}
      <ImportTaskModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImport={handleImport} />
      <TaskFormModal 
        isOpen={isTaskFormOpen} 
        onClose={() => setIsTaskFormOpen(false)} 
        onSave={handleSaveTask} 
        initialData={editingTask} // Changed to match TaskFormModal definition
      />
    </div>
  );
};

export default TasksPage;