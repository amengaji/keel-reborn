// keel-reborn/keel-web/src/App.tsx

import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import LoginPage from "./pages/LoginPage";

/**
 * MARITIME EXPERT NOTE:
 * The App shell manages the global environment of the Digital TRB.
 * It handles theme persistence (Day/Night Mode) which is critical 
 * for officer vision health during bridge watches.
 */

function applyThemeFromStorage() {
  const saved = localStorage.getItem("keel_theme");
  const root = document.documentElement;
  // If no setting exists, we default to Light mode for standard office use
  if (saved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export default function App() {
  useEffect(() => {
    applyThemeFromStorage();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
      
      {/* UI/UX Note: Toaster is configured for high-visibility success/error messages */}
      <Toaster 
        richColors 
        position="top-right" 
        toastOptions={{
          style: { border: '1px solid #3194A0' }, // Branded border for alerts
        }}
      />

      <Routes>
        {/* Landing on the site automatically takes the Officer to the Login screen */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<LoginPage />} />

        {/* MARITIME TRAINING NOTE:
            As we build the "Clean Slate", we will add the Dashboard and 
            Vessel management routes here once their controllers are ready.
        */}
        
        {/* Redirect any unknown paths back to login for security */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}