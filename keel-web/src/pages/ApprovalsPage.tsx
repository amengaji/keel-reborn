import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, FileText, Calendar, User, 
  Anchor, ChevronRight, Search, Filter, Eye, MessageSquare,
  CheckSquare, Square, Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { getApprovalQueue, processBatchApproval } from '../services/dataService';

// Types
interface ApprovalTask {
  uniqueId: string;
  cadetId: string;
  cadetName: string;
  vessel: string;
  taskId: string;
  taskRef: string;
  taskTitle: string;
  function: string;
  submittedDate: string;
  evidence: boolean | string;
  description: string;
  status: string;
}

interface CadetGroup {
  cadetId: string;
  cadetName: string;
  vessel: string;
  tasks: ApprovalTask[];
}

const ApprovalsPage: React.FC = () => {
  const [groups, setGroups] = useState<CadetGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [selectedGroup, setSelectedGroup] = useState<CadetGroup | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [previewTask, setPreviewTask] = useState<ApprovalTask | null>(null);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    refreshQueue();
  }, []);

  const refreshQueue = () => {
    const rawQueue = getApprovalQueue();
    
    // Group by Cadet
    const grouped = rawQueue.reduce((acc: Record<string, CadetGroup>, item: ApprovalTask) => {
      if (!acc[item.cadetId]) {
        acc[item.cadetId] = {
          cadetId: item.cadetId,
          cadetName: item.cadetName,
          vessel: item.vessel,
          tasks: []
        };
      }
      acc[item.cadetId].tasks.push(item);
      return acc;
    }, {});

    setGroups(Object.values(grouped));
  };

  const openReviewModal = (group: CadetGroup) => {
    setSelectedGroup(group);
    setSelectedTaskIds(new Set()); // Reset selection
    setPreviewTask(group.tasks[0] || null); // Preview first task
    setReviewComment('');
  };

  // --- BULK SELECTION LOGIC ---
  const toggleTaskSelection = (taskId: string) => {
    const newSet = new Set(selectedTaskIds);
    if (newSet.has(taskId)) {
      newSet.delete(taskId);
    } else {
      newSet.add(taskId);
    }
    setSelectedTaskIds(newSet);
  };

  const toggleSelectAll = () => {
    if (!selectedGroup) return;
    if (selectedTaskIds.size === selectedGroup.tasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      const allIds = new Set(selectedGroup.tasks.map(t => t.taskId));
      setSelectedTaskIds(allIds);
    }
  };

  // --- APPROVAL LOGIC ---
  const handleBatchDecision = (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedGroup) return;
    
    // Use selected IDs, or if none selected, use the currently previewed task
    const idsToProcess = selectedTaskIds.size > 0 
      ? Array.from(selectedTaskIds) 
      : (previewTask ? [previewTask.taskId] : []);

    if (idsToProcess.length === 0) {
      toast.error("Please select at least one task.");
      return;
    }

    if (decision === 'REJECTED' && !reviewComment.trim()) {
      toast.error("Please provide a comment for rejection.");
      return;
    }

    // Call API/Service
    processBatchApproval(selectedGroup.cadetId, idsToProcess, decision, reviewComment);
    
    toast.success(`${idsToProcess.length} tasks ${decision.toLowerCase()}.`);
    
    // Close Modal & Refresh
    setSelectedGroup(null);
    setPreviewTask(null);
    refreshQueue();
  };

  // Filter Groups
  const filteredGroups = groups.filter(g => 
    g.cadetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.vessel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Verification Queue</h1>
          <p className="text-muted-foreground text-sm">Review pending tasks grouped by trainee.</p>
        </div>
        
        {/* GLOBAL STATS */}
        <div className="flex gap-3">
           <div className="bg-orange-500/10 border border-orange-500/20 text-orange-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
              <Layers size={14} />
              {groups.length} Trainees Pending
           </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-card border border-border p-4 rounded-xl shadow-sm shrink-0">
         <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search Cadet or Vessel..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 h-9 w-full"
            />
         </div>
      </div>

      {/* MAIN LIST (GROUPS) */}
      <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
         {filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
               <CheckCircle size={48} className="mb-4 opacity-20" />
               <p>No pending approvals found.</p>
            </div>
         ) : (
            <div className="overflow-auto flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {filteredGroups.map(group => (
                  <div key={group.cadetId} className="border border-border rounded-xl p-5 hover:shadow-md transition-shadow bg-background flex flex-col">
                     <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {group.cadetName.charAt(0)}
                           </div>
                           <div>
                              <div className="font-bold text-foreground">{group.cadetName}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                 <Anchor size={10} /> {group.vessel}
                              </div>
                           </div>
                        </div>
                        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full border border-orange-200">
                           {group.tasks.length} Pending
                        </span>
                     </div>

                     <div className="flex-1 space-y-2 mb-4">
                        {group.tasks.slice(0, 3).map(t => (
                           <div key={t.taskId} className="text-xs text-muted-foreground flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              <span className="truncate">{t.taskTitle}</span>
                           </div>
                        ))}
                        {group.tasks.length > 3 && (
                           <div className="text-xs text-muted-foreground pl-3.5">
                              + {group.tasks.length - 3} more tasks...
                           </div>
                        )}
                     </div>

                     <button 
                       onClick={() => openReviewModal(group)}
                       className="w-full mt-auto bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                     >
                        Review Batch
                     </button>
                  </div>
               ))}
            </div>
         )}
      </div>

      {/* BULK REVIEW MODAL */}
      {selectedGroup && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-card w-full max-w-6xl max-h-[90vh] rounded-xl border border-border shadow-2xl flex flex-col overflow-hidden">
               
               {/* Modal Header */}
               <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30 shrink-0">
                  <div>
                     <h2 className="font-bold text-lg flex items-center gap-2">
                        {selectedGroup.cadetName}
                        <span className="text-sm font-normal text-muted-foreground">({selectedGroup.vessel})</span>
                     </h2>
                     <p className="text-xs text-muted-foreground">
                        Select tasks to approve in bulk or review individually.
                     </p>
                  </div>
                  <button onClick={() => setSelectedGroup(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                     <XCircle size={20} className="text-muted-foreground" />
                  </button>
               </div>

               {/* Modal Body */}
               <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                  
                  {/* LEFT: Task List (Bulk Selection) */}
                  <div className="w-full md:w-1/3 border-r border-border flex flex-col bg-muted/5">
                     <div className="p-3 border-b border-border flex items-center justify-between bg-white dark:bg-card">
                        <div className="flex items-center gap-2">
                           <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-primary">
                              {selectedTaskIds.size === selectedGroup.tasks.length && selectedGroup.tasks.length > 0
                                ? <CheckSquare size={18} className="text-primary" /> 
                                : <Square size={18} />
                              }
                           </button>
                           <span className="text-xs font-bold uppercase text-muted-foreground">Select All</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{selectedTaskIds.size} Selected</span>
                     </div>
                     
                     <div className="flex-1 overflow-y-auto">
                        {selectedGroup.tasks.map(task => (
                           <div 
                              key={task.taskId} 
                              onClick={() => setPreviewTask(task)}
                              className={`p-3 border-b border-border cursor-pointer transition-colors flex gap-3 hover:bg-muted/50 ${
                                 previewTask?.taskId === task.taskId ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'
                              }`}
                           >
                              <div onClick={(e) => { e.stopPropagation(); toggleTaskSelection(task.taskId); }}>
                                 {selectedTaskIds.has(task.taskId) 
                                   ? <CheckSquare size={18} className="text-primary mt-1" /> 
                                   : <Square size={18} className="text-muted-foreground mt-1" />
                                 }
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className={`text-sm font-medium truncate ${previewTask?.taskId === task.taskId ? 'text-primary' : 'text-foreground'}`}>
                                    {task.taskTitle}
                                 </p>
                                 <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] bg-muted px-1.5 rounded text-muted-foreground font-mono">{task.taskRef}</span>
                                    {task.evidence && <FileText size={10} className="text-blue-500" />}
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* RIGHT: Detail Preview */}
                  <div className="flex-1 flex flex-col bg-card h-full overflow-hidden">
                     {previewTask ? (
                        <>
                           <div className="flex-1 overflow-y-auto p-6">
                              <div className="mb-6">
                                 <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">{previewTask.taskRef}</span>
                                    <span className="text-xs text-muted-foreground">{previewTask.function}</span>
                                 </div>
                                 <h3 className="text-xl font-bold text-foreground">{previewTask.taskTitle}</h3>
                                 <p className="text-sm text-muted-foreground mt-2">{previewTask.description}</p>
                              </div>

                              <div className="border-t border-border pt-6">
                                 <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">Evidence Attached</h4>
                                 {previewTask.evidence ? (
                                    <div className="bg-muted/30 border border-border rounded-lg p-2 max-w-sm">
                                       <img 
                                          src="https://images.unsplash.com/photo-1628133287823-34e819b13c32?q=80&w=800&auto=format&fit=crop" 
                                          className="w-full h-48 object-cover rounded-md" 
                                          alt="Evidence"
                                       />
                                       <div className="mt-2 flex justify-between items-center px-1">
                                          <span className="text-xs text-muted-foreground">evidence_photo.jpg</span>
                                          <button className="text-xs text-primary font-bold hover:underline">View Full</button>
                                       </div>
                                    </div>
                                 ) : (
                                    <div className="p-4 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-200">
                                       No evidence attached. Verification based on log entry only.
                                    </div>
                                 )}
                              </div>
                           </div>

                           {/* ACTION FOOTER */}
                           <div className="p-4 border-t border-border bg-muted/10 shrink-0 flex flex-col gap-3">
                              <div className="relative">
                                 <MessageSquare size={14} className="absolute left-3 top-3 text-muted-foreground" />
                                 <input 
                                    className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:ring-1 focus:ring-primary"
                                    placeholder="Add comment (Optional for approval, Required for rejection)..."
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                 />
                              </div>
                              <div className="flex gap-3">
                                 <button 
                                    onClick={() => handleBatchDecision('REJECTED')}
                                    className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm"
                                 >
                                    {selectedTaskIds.size > 0 ? `Reject Selected (${selectedTaskIds.size})` : 'Reject Current'}
                                 </button>
                                 <button 
                                    onClick={() => handleBatchDecision('APPROVED')}
                                    className="flex-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                                 >
                                    <CheckCircle size={16} />
                                    {selectedTaskIds.size > 0 ? `Approve Selected (${selectedTaskIds.size})` : 'Approve Current'}
                                 </button>
                              </div>
                           </div>
                        </>
                     ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                           <p>Select a task to preview details.</p>
                        </div>
                     )}
                  </div>

               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default ApprovalsPage;