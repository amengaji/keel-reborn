// keel-web/src/components/auth/IdleTimer.tsx

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getSettings } from '../../services/dataService';
import LogoutWarningModal from './LogoutWarningModal';

const IdleTimer = () => {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const WARNING_THRESHOLD = 60 * 1000; // 1 minute warning phase

  const handleLogout = useCallback(() => {
    // 1. Clear sensitive session data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // 2. Reset UI state
    setShowWarning(false);
    if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    
    // 3. Notify and Redirect
    toast.error("Session Expired", { description: "You have been logged out due to inactivity." });
    navigate('/login');
  }, [navigate]);

  const startCountdown = useCallback(() => {
    setShowWarning(true);
    setRemainingSeconds(60);
    
    if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    
    // ACTIVE TERMINATION LOGIC: Executes every second
    warningTimerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          // If the clock hits zero, force logout immediately
          if (warningTimerRef.current) clearInterval(warningTimerRef.current);
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleLogout]);

  const resetTimer = useCallback(() => {
    // Stop all active timers and hide modal when user activity is detected
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    setShowWarning(false);

    // Retrieve timeout from Settings
    const settings = getSettings();
    const totalMinutes = Number(settings?.general?.sessionTimeout) || 30;
    const totalMs = totalMinutes * 60 * 1000;

    // SAFETY CHECK: If the session is too short for a warning phase, set direct logout
    if (totalMs <= WARNING_THRESHOLD) {
      timerRef.current = setTimeout(handleLogout, totalMs);
    } else {
      // Start a timer that will trigger the warning modal 60s before the end
      timerRef.current = setTimeout(startCountdown, totalMs - WARNING_THRESHOLD);
    }
  }, [startCountdown, handleLogout]);

  useEffect(() => {
    // User activity triggers that reset the idle timer
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    resetTimer();

    events.forEach(event => window.addEventListener(event, resetTimer));
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearInterval(warningTimerRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [resetTimer]);

  return (
    <LogoutWarningModal 
      isOpen={showWarning}
      remainingSeconds={remainingSeconds}
      onStayLoggedIn={resetTimer}
      onLogoutNow={handleLogout}
    />
  );
};

export default IdleTimer;