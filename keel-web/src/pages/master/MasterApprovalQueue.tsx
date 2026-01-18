import React, { useState, useMemo } from 'react';
import { CheckCircle, XCircle, User, FileText, Calendar, ShieldAlert, Award } from 'lucide-react';
import { toast } from 'sonner';

const MasterApprovalQueue: React.FC = () => {
  const BRAND_COLOR = '#3194A0';

  // Mock data showing the Verification Chain in action
  const [pendingTasks, setPendingTasks] = useState([
    { 
      id: 1, 
      trainee: 'Anuj Mengaji', 
      task: 'Rule 24: Lights and Shapes', 
      submitted: '2026-01-15', 
      evidence: true,
      department: 'Deck',
      cto_signed: true, // Master can sign this
      isSteering: false
    },
    { 
      id: 2, 
      trainee: 'Anuj Mengaji', 
      task: 'Rule 25: Sailing Vessels Underway', 
      submitted: '2026-01-16', 
      evidence: false,
      department: 'Deck',
      cto_signed: false, // Master BLOCKED - Awaiting CTO
      isSteering: false
    },
    { 
      id: 3, 
      trainee: 'Anuj Mengaji', 
      task: 'Manual Steering Practice (20 Hours)', 
      submitted: '2026-01-17', 
      evidence: true,
      department: 'Deck',
      cto_signed: true,
      isSteering: true // Special task for Steering Cert
    }
  ]);

  const handleFinalSign = (task: any) => {
    if (!task.cto_signed) {
      toast.error("Chain of Command Restricted", {
        description: "The Department CTO must provide technical verification before the Master signs."
      });
      return;
    }

    setPendingTasks(prev => prev.filter(t => t.id !== task.id));
    toast.success(`Task Approved: ${task.task}`, {
        description: task.isSteering ? "Steering milestone reached!" : "Task locked in TRB."
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Master's Approval Queue</h1>
          <p className="text-muted-foreground text-sm">Final endorsement of competency for all onboard personnel.</p>
        </div>
        <div className="flex gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 text-orange-600 rounded-lg text-xs font-bold border border-orange-500/20">
                <ShieldAlert size={14} /> CTO Verification Required
            </span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-muted/50 text-muted-foreground font-bold uppercase text-[10px] tracking-widest border-b border-border">
            <tr>
              <th className="p-4">Personnel</th>
              <th className="p-4">Competency Task</th>
              <th className="p-4 text-center">CTO Status</th>
              <th className="p-4 text-center">Evidence</th>
              <th className="p-4 text-right">Master's Sign-off</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pendingTasks.map((item) => (
              <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <User size={14} style={{ color: BRAND_COLOR }} />
                    <span className="font-bold text-foreground">{item.trainee}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-muted-foreground" />
                    <div>
                        <span className="text-foreground/80 block">{item.task}</span>
                        {item.isSteering && <span className="text-[9px] text-[#3194A0] font-black uppercase tracking-tighter flex items-center gap-1"><Award size={10}/> Steering Milestone</span>}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-center">
                  {item.cto_signed ? (
                    <span className="bg-green-500/10 text-green-600 text-[10px] px-2 py-1 rounded-md font-bold border border-green-500/20">VERIFIED</span>
                  ) : (
                    <span className="bg-orange-500/10 text-orange-600 text-[10px] px-2 py-1 rounded-md font-bold border border-orange-500/20">AWAITING CTO</span>
                  )}
                </td>
                <td className="p-4 text-center">
                    <button className="text-muted-foreground hover:text-[#3194A0] transition-colors">
                        <FileText size={18} />
                    </button>
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleFinalSign(item)}
                      disabled={!item.cto_signed}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                        item.cto_signed 
                        ? 'bg-[#3194A0] text-white hover:brightness-110 active:scale-95' 
                        : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                      }`}
                    >
                      {item.cto_signed ? 'SIGN AS MASTER' : 'LOCKED'}
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

export default MasterApprovalQueue;