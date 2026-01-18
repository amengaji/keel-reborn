import React from 'react';
import { AlertCircle, Clock, LogOut } from 'lucide-react';

interface LogoutWarningModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
}

const LogoutWarningModal: React.FC<LogoutWarningModalProps> = ({ 
  isOpen, 
  remainingSeconds, 
  onStayLoggedIn, 
  onLogoutNow 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-card w-full max-w-md rounded-2xl p-6 shadow-2xl border border-border space-y-6 animate-in zoom-in-95 duration-200">
        
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600">
            <Clock size={32} className="animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Session Expiring</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            You have been idle for a while. For your security, you will be logged out automatically in:
          </p>
          <div className="text-3xl font-black text-primary tabular-nums">
            {remainingSeconds}s
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={onStayLoggedIn}
            className="w-full bg-primary hover:brightness-110 text-primary-foreground py-3 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
          >
            Stay Logged In
          </button>
          <button 
            onClick={onLogoutNow}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut size={16} /> Log Out Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutWarningModal;