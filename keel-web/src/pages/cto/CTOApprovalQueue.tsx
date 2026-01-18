import React, { useState, useMemo } from 'react';
import { CheckCircle, XCircle, Eye, User, FileText, Calendar, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

/**
 * CTOApprovalQueue Component
 * Allows technical experts (CTO) and the Vessel Master to review and sign off tasks.
 * Verification Chain: Master can only sign if a CTO signature exists.
 */
const CTOApprovalQueue: React.FC = () => {
  // --- AUTH & ROLE LOGIC ---
  const user = useMemo(() => {
    try {
      const userJson = localStorage.getItem('keel_user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const isMaster = user?.role === 'MASTER';
  const ctoDepartment = user?.department || 'Deck'; 

  // Placeholder data with added signature tracking for the verification chain
  const [pendingTasks, setPendingTasks] = useState([
    { 
      id: 1, 
      trainee: 'Anuj Mengaji', 
      task: 'Rule 24: Lights and Shapes', 
      submitted: '2026-01-15', 
      evidence: true,
      department: 'Deck',
      cto_signed: false // Verification Chain status
    },
    { 
      id: 2, 
      trainee: 'Anuj Mengaji', 
      task: 'Rule 25: Sailing Vessels Underway', 
      submitted: '2026-01-16', 
      evidence: false,
      department: 'Deck',
      cto_signed: true // Already signed by CTO, ready for Master
    }
  ]);

  // --- ACTIONS ---
  const handleApprove = (id: number, taskName: string, currentlySigned: boolean) => {
    if (isMaster) {
      if (!currentlySigned) {
        toast.error("Chain of Command Error", {
          description: "Technical Expert (CTO) must sign this task before the Master."
        });
        return;
      }
      // Final sign-off
      setPendingTasks(prev => prev.filter(t => t.id !== id));
      toast.success(`Master's Final Endorsement: "${taskName}"`);
    } else {
      // CTO Sign-off: Updates status instead of removing (to let Master see it)
      setPendingTasks(prev => prev.map(t => t.id === id ? { ...t, cto_signed: true } : t));
      toast.success(`CTO Technical Sign-off: "${taskName}"`);
    }
  };

  const handleReject = (id: number) => {
    setPendingTasks(prev => prev.filter(t => t.id !== id));
    toast.error("Sign-off rejected. Trainee notified.");
  };

  // --- STEP 4: DEPARTMENT FILTERING ---
  const displayTasks = useMemo(() => {
    if (isMaster) return pendingTasks; // Master sees everything onboard
    return pendingTasks.filter(t => t.department === ctoDepartment); // CTO filtered by dept
  }, [pendingTasks, isMaster, ctoDepartment]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sign-off Approval Queue</h1>
        <p className="text-muted-foreground text-sm">Review competency submissions from trainees onboard your vessel.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-muted/50 text-muted-foreground font-bold uppercase text-[10px] tracking-widest border-b border-border">
            <tr>
              <th className="p-4">Trainee</th>
              <th className="p-4">Task Detail</th>
              <th className="p-4">Date Submitted</th>
              <th className="p-4 text-center">Evidence</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayTasks.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-muted-foreground italic font-medium">
                  All sign-off requests have been processed.
                </td>
              </tr>
            ) : displayTasks.map((item) => (
              <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-primary" />
                    <span className="font-bold text-foreground">{item.trainee}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-muted-foreground" />
                    <span className="text-foreground/80">{item.task}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar size={14} />
                    <span>{item.submitted}</span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  {item.evidence ? (
                    <span className="bg-teal-500/10 text-teal-600 text-[10px] px-2 py-0.5 rounded font-bold border border-teal-500/20 cursor-pointer hover:bg-teal-500/20">VIEW PDF</span>
                  ) : (
                    <span className="text-muted-foreground/40 text-[10px] italic">None</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleReject(item.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-all"
                    >
                      <XCircle size={18} />
                    </button>
                    <button 
                      onClick={() => handleApprove(item.id, item.task, item.cto_signed)}
                      style={{
                        // Visual cue for Master: disabled if CTO hasn't signed
                        opacity: isMaster && !item.cto_signed ? 0.3 : 1,
                        cursor: isMaster && !item.cto_signed ? 'not-allowed' : 'pointer'
                      }}
                      className={`p-2 transition-all rounded-lg ${
                        item.cto_signed && isMaster ? 'text-teal-600 bg-teal-500/10' : 'text-primary hover:bg-primary/10'
                      }`}
                    >
                      <CheckCircle size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CTOApprovalQueue;