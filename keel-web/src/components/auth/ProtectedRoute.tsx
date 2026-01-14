import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  allowedRoles?: string[]; // Array of roles allowed to access this route
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const location = useLocation();
  
  // 1. Check Authentication
  const token = localStorage.getItem('keel_token');
  const userStr = localStorage.getItem('keel_user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!token || !user) {
    // Not logged in -> Redirect to Login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check Authorization (Role)
  if (allowedRoles && allowedRoles.length > 0) {
    // Normalize roles for comparison (backend might send 'Admin', 'admin', 'SHORE_ADMIN')
    const userRole = (user.role || '').toUpperCase();
    const hasPermission = allowedRoles.some(role => userRole.includes(role.toUpperCase()));

    if (!hasPermission) {
      toast.error("Unauthorized access.");
      // Logged in but not allowed -> Redirect to Dashboard or Unauthorized page
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 3. Render the Route
  return <Outlet />;
};

export default ProtectedRoute;