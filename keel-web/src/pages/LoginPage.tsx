// keel-reborn/keel-web/src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { loginOfficer } from '../services/authService';
import { Anchor, ShieldCheck } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [loginId, setLoginId] = useState(''); 
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Attempt login
      const response = await loginOfficer(loginId, password);
      
      // Personalized Greeting based on Role
      const role = response.user.role;
      const title = role === 'MASTER' ? 'Captain' : role === 'CTO' ? 'Chief' : response.user.firstName;
      
      toast.success(`Welcome back, ${title}`, {
        description: `Logged in as ${response.user.rank || 'Officer'}`,
      });

      // Role-Based Redirects
      if (role === 'MASTER') navigate('/master-dashboard');
      else if (role === 'CTO') navigate('/cto-dashboard'); 
      else if (role === 'SUPER_ADMIN') navigate('/companies');
      else navigate('/dashboard');
      
    } catch (error: any) {
      console.error("Login Failure:", error);

      // --- LOGIC CHANGE ONLY: Detect the TYPE of error ---
      let errorTitle = 'Access Denied';
      let errorDesc = 'Please check your Vessel ID/Email and Password.';

      // Case 1: Server is down or not reachable (Network Error)
      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        errorTitle = 'Connection Failed';
        errorDesc = 'Cannot reach Backend (localhost:5000). Is the server running?';
      } 
      // Case 2: Backend rejected the password/email specifically
      else if (error.message && error.message !== 'Failed to fetch') {
        errorDesc = error.message;
      }

      toast.error(errorTitle, {
        description: errorDesc,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-64 bg-primary skew-y-3 origin-top-left -translate-y-20 z-0"></div>
      
      <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-white border border-slate-200 relative z-10">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
            <Anchor size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">KEEL<span className="text-primary">.</span></h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Digital Training Record Book
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 ml-1">Vessel ID or Email</label>
            <div className="relative">
                <input
                type="text"
                required
                className="w-full pl-4 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-slate-700 bg-slate-50 focus:bg-white"
                placeholder="e.g. ctodeck.9876543 or captain@ship.com"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 ml-1">
                Masters use Email. CTOs use ID (ctodeck.IMO)
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 ml-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-slate-700 bg-slate-50 focus:bg-white"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
              isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:brightness-110 active:scale-95 shadow-primary/30'
            }`}
          >
            {isLoading ? (
                <>Verifying Credentials...</>
            ) : (
                <>Sign In <ShieldCheck size={18}/></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-400">
            Authorized Personnel Only • Element Tree
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;