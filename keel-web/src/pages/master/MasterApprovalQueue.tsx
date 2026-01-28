//keel-web/src/pages/master/MasterApprovalQueue.tsx

import React, { useState, useEffect } from 'react';
import { 
  Award, 
  CheckCircle2, 
  Anchor, 
  FileCheck, 
  Clock, 
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { assignmentService } from '../../services/assignmentService';

/**
 * MasterApprovalQueue Component
 * * STEP 2 (FINAL) of Verification Chain:
 * This view shows tasks that have been VERIFIED by the CTO.
 * * The Master gives the final "stamp" here, moving the task to 'Completed'.
 */
const MasterApprovalQueue: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const data = await assignmentService.getPendingMasterApprovals();
      setTasks(data);
    } catch (err) {
      console.error(err);
      toast.error("Sync Error", { description: "Failed to load Master's queue." });
    } finally {
      setLoading(false);
    }
  };

  const handleMasterSign = async (assignmentId: number, taskTitle: string) => {
    try {
      setProcessingId(assignmentId);
      
      // 1. Call API to sign off
      await assignmentService.signOffTask(assignmentId);
      
      // 2. Success Feedback
      toast.success("Training Record Verified", { 
        description: `"${taskTitle}" has been successfully closed.` 
      });

      // 3. Remove from local list immediately (Optimistic UI)
      setTasks(prev => prev.filter(t => t.id !== assignmentId));

    } catch (err: any) {
      toast.error("Verification Failed", { description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  // Helper to open evidence in new tab
  const viewEvidence = (url: string) => {
    if (!url) return;
    // Ensure we have a valid URL structure. 
    // In production, this should use import.meta.env.VITE_API_URL
    const fullUrl = url.startsWith('http') ? url : `http://localhost:5000${url}`;
    window.open(fullUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <p className="animate-pulse text-sm font-medium">Loading Command Queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600/10 text-indigo-600 rounded-xl shadow-sm border border-indigo-600/20">
             <Anchor size={24} />
          </div>
          <div>
             <h1 className="text-2xl font-bold text-foreground">Captain's Verification</h1>
             <p className="text-muted-foreground text-sm">Final approval for CTO-verified tasks.</p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
            <button 
                onClick={loadQueue}
                className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                title="Refresh Queue"
            >
                <RefreshCw size={18} />
            </button>
            {tasks.length > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-500/20">
                  <Clock size={14} /> {tasks.length} Pending
              </span>
            )}
        </div>
      </div>

      {/* QUEUE LIST */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
             <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Award size={32} className="text-indigo-500" />
             </div>
             <h3 className="text-lg font-bold text-foreground">All Tasks Certified</h3>
             <p className="text-muted-foreground max-w-xs mx-auto mt-2">
               You have signed off on all pending training records.
             </p>
             <button 
                onClick={loadQueue}
                className="mt-6 text-xs font-bold text-indigo-600 hover:underline"
             >
                Refresh Queue
             </button>
          </div>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-muted/50 text-muted-foreground font-bold uppercase text-[10px] tracking-widest border-b border-border">
              <tr>
                <th className="p-4">Trainee</th>
                <th className="p-4">Task Detail</th>
                <th className="p-4 text-center">CTO Status</th>
                <th className="p-4 text-center">Evidence</th>
                <th className="p-4 text-right">Command Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.map((item) => (
                <tr key={item.id} className="hover:bg-muted/5 transition-colors group">
                  
                  {/* TRAINEE INFO */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600/10 flex items-center justify-center font-bold text-indigo-600 text-xs border border-indigo-600/20">
                        {item.cadet?.first_name?.[0]}{item.cadet?.last_name?.[0]}
                      </div>
                      <div>
                        <span className="font-bold text-foreground block">
                          {item.cadet?.first_name} {item.cadet?.last_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {item.cadet?.rank} • {item.cadet?.department}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* TASK INFO */}
                  <td className="p-4">
                    <div className="flex items-start gap-2 max-w-md">
                      <FileCheck size={16} className="text-green-600 shrink-0 mt-0.5" />
                      <div>
                          <span className="text-foreground font-medium block">{item.template?.title}</span>
                          <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                            {item.template?.code}
                          </span>
                      </div>
                    </div>
                  </td>

                  {/* CTO STATUS */}
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center">
                        <span className="bg-green-500/10 text-green-700 text-[10px] px-2 py-1 rounded-md font-bold border border-green-500/20 flex items-center gap-1">
                           <UserCheck size={10} /> VERIFIED
                        </span>
                        <span className="text-[9px] text-muted-foreground mt-1">
                            By Technical Officer
                        </span>
                    </div>
                  </td>

                  {/* EVIDENCE */}
                  <td className="p-4 text-center">
                    {item.evidence_url ? (
                       <button 
                         onClick={() => viewEvidence(item.evidence_url)}
                         className="text-indigo-600 hover:underline text-xs font-bold"
                       >
                         Review Evidence
                       </button>
                    ) : (
                       <span className="text-muted-foreground text-xs italic">No Attachment</span>
                    )}
                  </td>

                  {/* ACTIONS */}
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleMasterSign(item.id, item.template?.title)}
                        disabled={processingId === item.id}
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm
                          ${processingId === item.id 
                            ? 'bg-muted text-muted-foreground cursor-wait' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-600/20'
                          }
                        `}
                      >
                        {processingId === item.id ? (
                          'Signing...'
                        ) : (
                          <>Captain's Signature <Award size={14} /></>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MasterApprovalQueue;