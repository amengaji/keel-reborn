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
        theme="light" 
        toastOptions={{
          unstyled: true,
          className: "p-4 rounded-lg shadow-xl flex items-center gap-3 w-full min-w-[320px] mb-2 font-medium border-2 backdrop-blur-none",
          classNames: {
            // ERROR: Red Glass (85% Opacity), Red Border, WHITE Text
            error: "!bg-[rgba(220,38,38,0.5)] !border-[rgba(220,38,38,0.5)] !text-white",
            
            // SUCCESS: Light Green Glass (25% Opacity), Green Border, BLACK Text
            success: "!bg-[rgba(74,222,128,0.25)] !border-[rgba(22,163,74,0.15)] !text-green",
            
            // WARNING: Light Orange Glass (25% Opacity), Orange Border, BLACK Text
            warning: "!bg-[rgba(251,146,60,0.25)] !border-[rgba(234,88,12,0.15)] !text-orange",
            
            // INFO: Light Blue Glass (25% Opacity), Blue Border, BLACK Text
            info: "!bg-[rgba(96,165,250,0.25)] !border-[rgba(37,99,235,0.15)] !text-black",
            
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
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* PROTECTED ROUTES */}
        <Route path="/" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
        
        <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
        <Route path="/vessels" element={<DashboardLayout><VesselsPage /></DashboardLayout>} />
        <Route path="/trainees" element={<DashboardLayout><CadetsPage /></DashboardLayout>} />
        
        <Route path="/assignments" element={<DashboardLayout><AssignmentsPage /></DashboardLayout>} />
        <Route path="/training-progress" element={<DashboardLayout><TrainingProgressPage /></DashboardLayout>} />
        <Route path="/approvals" element={<DashboardLayout><ApprovalsPage /></DashboardLayout>} />
        <Route path="/evidence" element={<DashboardLayout><EvidencePage /></DashboardLayout>} />

        <Route path="/reports" element={<DashboardLayout><ReportsPage /></DashboardLayout>} />
        
        <Route path="/audit/main" element={<DashboardLayout><AuditLogsPage /></DashboardLayout>} />
        <Route path="/audit/locked" element={<DashboardLayout><LockedTRBPage /></DashboardLayout>} />
        
        <Route path="/settings" element={<DashboardLayout><SettingsPage /></DashboardLayout>} />
        <Route path="/users" element={<DashboardLayout><UsersPage /></DashboardLayout>} />
        <Route path="/tasks" element={<DashboardLayout><TasksPage /></DashboardLayout>} />
        <Route path="/trb/:cadetName" element={<TRBViewerPage />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}