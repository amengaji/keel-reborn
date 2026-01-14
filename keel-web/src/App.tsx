import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Pages
import Dashboard from "./pages/Dashboard";
import VesselsPage from "./pages/VesselsPage";
import CadetsPage from "./pages/CadetsPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import TrainingProgressPage from "./pages/TrainingProgressPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import EvidencePage from "./pages/EvidencePage";
import ReportsPage from "./pages/ReportsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import LockedTRBPage from "./pages/LockedTRBPage";
import SettingsPage from "./pages/SettingsPage";
import UsersPage from "./pages/UsersPage";
import TasksPage from "./pages/TasksPage";
import TRBViewerPage from './pages/TRBViewerPage';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Toaster 
        richColors 
        position="bottom-right"
        toastOptions={{
          unstyled: true,
          className: "p-4 rounded-lg shadow-xl flex items-center gap-3 w-full min-w-[320px] mb-2 font-medium border-2 backdrop-blur-none",
          classNames: {
            error: "!bg-[rgba(220,38,38,0.5)] !border-[rgba(220,38,38,0.5)] !text-white",
            success: "!bg-[rgba(74,222,128,0.25)] !border-[rgba(22,163,74,0.15)] !text-green-800 dark:!text-green-200",
            warning: "!bg-[rgba(251,146,60,0.25)] !border-[rgba(234,88,12,0.15)] !text-orange-800 dark:!text-orange-200",
            info: "!bg-[rgba(96,165,250,0.25)] !border-[rgba(37,99,235,0.15)] !text-blue-800 dark:!text-blue-200",
            title: "font-bold text-sm",
            description: "text-xs opacity-90 font-medium"
          }
        }}
        icons={{
           success: <div className="w-2 h-2 rounded-full bg-green-600"></div>,
           error: <div className="w-2 h-2 rounded-full bg-white"></div>,
           warning: <div className="w-2 h-2 rounded-full bg-orange-600"></div>,
           info: <div className="w-2 h-2 rounded-full bg-blue-600"></div>,
        }}
      />
      
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<LoginPage />} />

        {/* AUTHENTICATED ROUTES (Must be logged in) */}
        <Route element={<ProtectedRoute />}>
          
          {/* LAYOUT WRAPPER */}
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* GENERAL ACCESS (All Staff) */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vessels" element={<VesselsPage />} />
            <Route path="/trainees" element={<CadetsPage />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/training-progress" element={<TrainingProgressPage />} />
            <Route path="/trb/:cadetName" element={<TRBViewerPage />} />
            <Route path="/evidence" element={<EvidencePage />} />
            <Route path="/tasks" element={<TasksPage />} />

            {/* RESTRICTED ACCESS (Admin / Managers Only) */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'SUPERINTENDENT']} />}>
               <Route path="/approvals" element={<ApprovalsPage />} />
               <Route path="/reports" element={<ReportsPage />} />
               <Route path="/audit/locked" element={<LockedTRBPage />} />
            </Route>

            {/* SUPER ADMIN ONLY */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} />}>
               <Route path="/audit/main" element={<AuditLogsPage />} />
               <Route path="/settings" element={<SettingsPage />} />
               <Route path="/users" element={<UsersPage />} />
            </Route>

          </Route>
        </Route>

        {/* CATCH ALL */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}