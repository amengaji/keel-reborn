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

// CTO Specific Pages
import CTOVesselDashboard from './pages/cto/CTOVesselDashboard';
import CTOApprovalQueue from './pages/cto/CTOApprovalQueue';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Toaster 
        richColors 
        position="bottom-right"
        // ... (existing Toaster styling remains unchanged)
      />
      
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<LoginPage />} />

        {/* AUTHENTICATED ROUTES */}
        <Route element={<ProtectedRoute />}>
          
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* GENERAL ACCESS */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vessels" element={<VesselsPage />} />
            <Route path="/trainees" element={<CadetsPage />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/training-progress" element={<TrainingProgressPage />} />
            <Route path="/trb/:cadetName" element={<TRBViewerPage />} />
            <Route path="/trainee-trb/:id" element={<TRBViewerPage />} />
            <Route path="/evidence" element={<EvidencePage />} />
            <Route path="/tasks" element={<TasksPage />} />

            {/* CTO VESSEL PORTAL ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={['CTO']} />}>
               <Route path="/cto-dashboard" element={<CTOVesselDashboard />} />
               <Route path="/cto-approvals" element={<CTOApprovalQueue />} />
            </Route>

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