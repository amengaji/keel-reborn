// keel-reborn/keel-web/src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { loginOfficer } from '../services/authService';

/**
 * UI/UX EXPERT NOTE:
 * This page now features active communication with the backend.
 * The primary colour #3194A0 is used for the "Sign In" action.
 * Feedback is provided via high-visibility Toast notifications.
 */

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // CONTACTING THE ENGINE ROOM (Backend)
      const response = await loginOfficer(email, password);
      
      // UI/UX Note: Success feedback using company primary color
      toast.success(`Welcome aboard, ${response.user.firstName}!`, {
        description: 'Identity verified. Accessing Digital TRB.',
      });

      // Redirect to the Dashboard (We will create this page next)
      navigate('/dashboard');
      
    } catch (error: any) {
      // MARITIME EXPERT NOTE: Clear failure feedback for security events
      toast.error('Authentication Failed', {
        description: error.message || 'The Shore Server could not be reached.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Day/Night Mode Toggle */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="absolute top-4 right-4 p-2 rounded-full border border-gray-400 text-xs hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
      >
        {isDarkMode ? '☀️ Day Mode' : '🌙 Night Mode'}
      </button>

      <div className={`w-full max-w-md p-8 rounded-2xl shadow-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-primary">KEEL</h1>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Digital Training Record Book
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Officer Email</label>
            <input
              type="email"
              required
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary outline-none transition-all ${
                isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-300'
              }`}
              placeholder="admin@keel.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary outline-none transition-all ${
                isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-300'
              }`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all shadow-md ${
              isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark active:scale-95'
            }`}
          >
            {isLoading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400 italic">
            Developed for Maritime Excellence
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;