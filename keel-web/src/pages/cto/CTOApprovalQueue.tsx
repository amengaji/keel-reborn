//keel-web/src/pages/cto/CTOApprovalQueue.tsx

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  User, 
  FileText, 
  ShieldCheck, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { assignmentService } from '../../services/assignmentService';

/**
 * CTOApprovalQueue Component
 * * STEP 1 of Verification Chain:
 * This view shows tasks where the Cadet has marked progress as 100%,
 * but they have NOT yet been verified by a Technical Officer (CTO).
 * * Once the CTO signs here, the task moves to the Master's Queue.
 */
const CTOApprovalQueue: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const data = await assignmentService.getPendingCTOApprovals();
      setTasks(data);
    } catch (err) {
      console.error(err);
      toast.error("Sync Error", { description: "Failed to load verification queue." });
    } finally {
      setLoading(false);
    }
  };

  const handleCTOSign = async (assignmentId: number, taskTitle: string) => {
    try {
      setProcessingId(assignmentId);
      
      // 1. Call API to sign off
      await assignmentService.ctoSignOff(assignmentId);
      
      // 2. Success Feedback
      toast.success("Verified Successfully", { 
        description: `"${taskTitle}" has been forwarded to the Master for final approval.` 
      });

      // 3. Remove from local list immediately (Optimistic UI)
      setTasks(prev => prev.filter(t => t.id !== assignmentId));

    } catch (err: any) {
      toast.error("Verification Failed", { description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="animate-pulse text-sm font-medium">Syncing Technical Queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/10 text-blue-600 rounded-xl shadow-sm border border-blue-600/20">
             <ShieldCheck size={24} />
          </div>
          <div>
             <h1 className="text-2xl font-bold text-foreground">Technical Verification</h1>
             <p className="text-muted-foreground text-sm">Review cadet submissions before they reach the Master.</p>
          </div>
        </div>

        {tasks.length > 0 && (
           <div className="flex gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-600 rounded-lg text-xs font-bold border border-blue-500/20">
                  <Clock size={14} /> {tasks.length} Pending Reviews
              </span>
          </div>
        )}
      </div>

      {/* QUEUE LIST */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
             <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-green-500" />
             </div>
             <h3 className="text-lg font-bold text-foreground">All Tasks Verified</h3>
             <p className="text-muted-foreground max-w-xs mx-auto mt-2">
               You have cleared the technical verification queue. The Master handles it from here.
             </p>
             <button 
                onClick={loadQueue}
                className="mt-6 text-xs font-bold text-blue-600 hover:underline"
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
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Evidence</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.map((item) => (
                <tr key={item.id} className="hover:bg-muted/5 transition-colors group">
                  
                  {/* TRAINEE INFO */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center font-bold text-blue-600 text-xs border border-blue-600/20">
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
                      <FileText size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                          <span className="text-foreground font-medium block">{item.template?.title}</span>
                          <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                            {item.template?.code}
                          </span>
                      </div>
                    </div>
                  </td>

                  {/* STATUS */}
                  <td className="p-4 text-center">
                    <span className="bg-orange-500/10 text-orange-600 text-[10px] px-2 py-1 rounded-md font-bold border border-orange-500/20 flex items-center justify-center gap-1 w-fit mx-auto">
                       <AlertCircle size={10} /> NEEDS VERIFICATION
                    </span>
                  </td>

                  {/* EVIDENCE */}
                  <td className="p-4 text-center">
                    {item.evidence_url ? (
                       <button className="text-blue-600 hover:underline text-xs font-bold">View File</button>
                    ) : (
                       <span className="text-muted-foreground text-xs italic">No Attachment</span>
                    )}
                  </td>

                  {/* ACTIONS */}
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleCTOSign(item.id, item.template?.title)}
                        disabled={processingId === item.id}
                        className={`
                          flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm
                          ${processingId === item.id 
                            ? 'bg-muted text-muted-foreground cursor-wait' 
                            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-blue-600/20'
                          }
                        `}
                      >
                        {processingId === item.id ? (
                          'Verifying...'
                        ) : (
                          <>Verify Technical <CheckCircle2 size={14} /></>
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

export default CTOApprovalQueue;