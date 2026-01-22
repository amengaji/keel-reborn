//keel-web/src/pages/master/MasterApprovalQueue.tsx

import React, { useState, useEffect } from 'react';
import { 
  User, FileText, ShieldAlert, Award, CheckCircle2, 
  XCircle, Clock, Anchor
} from 'lucide-react';
import { toast } from 'sonner';
import { assignmentService } from '../../services/assignmentService';

interface PendingAssignment {
  id: number;
  status: string;
  progress: number;
  cadet: {
    first_name: string;
    last_name: string;
    rank: string;
    department: string;
  };
  template: {
    title: string;
    code: string;
    category: string;
  };
}

const MasterApprovalQueue: React.FC = () => {
  const [tasks, setTasks] = useState<PendingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  const BRAND_COLOR = '#3194A0';

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
      toast.error("Sync Error", { description: "Failed to load approval queue." });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSign = async (assignmentId: number, taskTitle: string) => {
    try {
      setProcessingId(assignmentId);
      
      // Call the API
      await assignmentService.signOffTask(assignmentId);
      
      // Success UX
      toast.success("Task Approved", {
        description: `You have successfully signed off on "${taskTitle}"`
      });

      // Optimistic UI Update (remove from list immediately)
      setTasks(prev => prev.filter(t => t.id !== assignmentId));

    } catch (err: any) {
      toast.error("Approval Failed", { description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="animate-pulse text-sm font-medium">Syncing Command Queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Master's Approval Queue</h1>
          <p className="text-muted-foreground text-sm">Final endorsement of competency for all onboard personnel.</p>
        </div>
        
        {tasks.length > 0 && (
           <div className="flex gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 text-orange-600 rounded-lg text-xs font-bold border border-orange-500/20">
                  <ShieldAlert size={14} /> {tasks.length} Pending Signatures
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
             <h3 className="text-lg font-bold text-foreground">All Clear, Captain!</h3>
             <p className="text-muted-foreground max-w-xs mx-auto mt-2">
               There are no pending tasks requiring your verification at this time.
             </p>
             <button 
                onClick={loadQueue}
                className="mt-6 text-xs font-bold text-primary hover:underline"
             >
                Refresh Queue
             </button>
          </div>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-muted/50 text-muted-foreground font-bold uppercase text-[10px] tracking-widest border-b border-border">
              <tr>
                <th className="p-4">Personnel</th>
                <th className="p-4">Competency Task</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Evidence</th>
                <th className="p-4 text-right">Master's Sign-off</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.map((item) => (
                <tr key={item.id} className="hover:bg-muted/5 transition-colors group">
                  
                  {/* PERSONNEL */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs border border-primary/20">
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

                  {/* TASK */}
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
                    <span className="bg-green-500/10 text-green-600 text-[10px] px-2 py-1 rounded-md font-bold border border-green-500/20 flex items-center justify-center gap-1 w-fit mx-auto">
                       <CheckCircle2 size={10} /> READY
                    </span>
                  </td>

                  {/* EVIDENCE (Placeholder) */}
                  <td className="p-4 text-center">
                      <button className="text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-muted rounded-lg" title="View Evidence">
                          <FileText size={18} />
                      </button>
                  </td>

                  {/* ACTION BUTTON */}
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleFinalSign(item.id, item.template?.title)}
                        disabled={processingId === item.id}
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm
                          ${processingId === item.id 
                            ? 'bg-muted text-muted-foreground cursor-wait' 
                            : 'bg-primary text-white hover:brightness-110 active:scale-95 shadow-primary/20'
                          }
                        `}
                      >
                        {processingId === item.id ? (
                          <>Signing...</>
                        ) : (
                          <><Award size={14} /> SIGN AS MASTER</>
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