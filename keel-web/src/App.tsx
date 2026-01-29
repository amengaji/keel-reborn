//keel-web/src/App.tsx
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

// Super Admin / Owner Pages
import CompaniesPage from "./pages/CompaniesPage";
import ConstantsPage from "./pages/ConstantsPage";

// CTO Specific Pages
import CTOVesselDashboard from './pages/cto/CTOVesselDashboard';
import CTOApprovalQueue from './pages/cto/CTOApprovalQueue';

// Master Specific Pages (New Imports)
import MasterDashboard from './pages/master/MasterDashboard';
import MasterCertificationHub from './pages/master/MasterCertificationHub';
import MasterApprovalQueue from './pages/master/MasterApprovalQueue';
import CertificatePreviewPage from './pages/master/CertificatePreviewPage';
import MasterReviewPage from './pages/master/MasterReviewPage';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Toaster 
        richColors 
        position="bottom-right"
      />
      
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<LoginPage />} />

        {/* AUTHENTICATED ROUTES */}
        <Route element={<ProtectedRoute />}>
          
          {/* ✅ ALL PAGES INSIDE HERE GET THE SIDEBAR */}
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* COMMON ACCESS (View customized by Role in Component) */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* SUPER ADMIN (OWNER) ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
                <Route path="/companies" element={<CompaniesPage />} />
                <Route path="/constants" element={<ConstantsPage />} />
            </Route>

            {/* CTO ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={['CTO']} />}>
                <Route path="/cto-dashboard" element={<CTOVesselDashboard />} />
                <Route path="/cto-approvals" element={<CTOApprovalQueue />} />
            </Route>

            {/* MASTER ROUTES (FIXED) */}
            <Route element={<ProtectedRoute allowedRoles={['MASTER']} />}>
                <Route path="/master-dashboard" element={<MasterDashboard />} />
                <Route path="/master-certification" element={<MasterCertificationHub />} />
                <Route path="/master-approvals" element={<MasterApprovalQueue />} />
                <Route path="/master-certification/preview/:cadetId" element={<CertificatePreviewPage />} />
                <Route path="/master-reviews/:cadetId" element={<MasterReviewPage />} />
            </Route>

            {/* OPERATIONAL ROUTES (SHORE ADMIN & MANAGERS) */}
            {/* Note: Super Admin excluded from operations to keep view clean as requested */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SHORE_ADMIN', 'MANAGER', 'SUPERINTENDENT', 'SHORE_OFFICER', 'MASTER', 'CTO']} />}>
                {/* Master & CTO also need access to these for drill-down */}
                <Route path="/vessels" element={<VesselsPage />} />
                <Route path="/trainees" element={<CadetsPage />} />
                <Route path="/assignments" element={<AssignmentsPage />} />
                <Route path="/training-progress" element={<TrainingProgressPage />} />
                <Route path="/trb/:cadetName" element={<TRBViewerPage />} />
                <Route path="/trainee-trb/:id" element={<TRBViewerPage />} />
                <Route path="/evidence" element={<EvidencePage />} />
            </Route>
                  
            {/* HIGH-LEVEL ADMIN ROUTES (Approvals, Reports) */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SHORE_ADMIN', 'MANAGER']} />}>
                <Route path="/approvals" element={<ApprovalsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/audit/locked" element={<LockedTRBPage />} />
            </Route>

            {/* SYSTEM ADMIN ONLY (User Management & Audit) */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SHORE_ADMIN', 'SUPER_ADMIN']} />}>
                <Route path="/audit/main" element={<AuditLogsPage />} />
                {/* UsersPage is accessible to Super Admin via URL, but hidden from Sidebar */}
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