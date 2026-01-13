import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import VesselsPage from "./pages/VesselsPage";
import SettingsPage from "./pages/SettingsPage";
import DashboardLayout from "./components/layout/DashboardLayout";

// NEW IMPORTS
import CadetsPage from "./pages/CadetsPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import TrainingProgressPage from "./pages/TrainingProgressPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import ReportsPage from "./pages/ReportsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import LockedTRBPage from "./pages/LockedTRBPage";
import EvidencePage from "./pages/EvidencePage";
import UsersPage from "./pages/UsersPage";
import TasksPage from "./pages/TasksPage";
import TRBViewerPage from './pages/TRBViewerPage';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Toaster 
        richColors 
        position="bottom-right"
        // Removed forced 'theme="light"' so it matches the app's dark mode if active
        toastOptions={{
          unstyled: true,
          className: "p-4 rounded-lg shadow-xl flex items-center gap-3 w-full min-w-[320px] mb-2 font-medium border-2 backdrop-blur-none",
          classNames: {
            // ERROR: Red Glass (85% Opacity), Red Border, WHITE Text
            error: "!bg-[rgba(220,38,38,0.5)] !border-[rgba(220,38,38,0.5)] !text-white",
            
            // SUCCESS: Light Green Glass (25% Opacity), Green Border, BLACK Text
            success: "!bg-[rgba(74,222,128,0.25)] !border-[rgba(22,163,74,0.15)] !text-green-800 dark:!text-green-200",
            
            // WARNING: Light Orange Glass (25% Opacity), Orange Border, BLACK Text
            warning: "!bg-[rgba(251,146,60,0.25)] !border-[rgba(234,88,12,0.15)] !text-orange-800 dark:!text-orange-200",
            
            // INFO: Light Blue Glass (25% Opacity), Blue Border, BLACK Text
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
        <Route path="/login" element={<LoginPage />} />
        
        {/* FIX: Use "Layout Route" pattern. 
            DashboardLayout renders once, and <Outlet /> inside it renders the child route.
        */}
        <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vessels" element={<VesselsPage />} />
            <Route path="/trainees" element={<CadetsPage />} />
            
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/training-progress" element={<TrainingProgressPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/evidence" element={<EvidencePage />} />

            <Route path="/reports" element={<ReportsPage />} />
            
            <Route path="/audit/main" element={<AuditLogsPage />} />
            <Route path="/audit/locked" element={<LockedTRBPage />} />
            
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/trb/:cadetName" element={<TRBViewerPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}