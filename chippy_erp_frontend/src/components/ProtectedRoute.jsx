import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { ShieldCheck, RefreshCw } from 'lucide-react';

/**
 * <ProtectedRoute moduleKey="bookings">
 *   <SalesBooking />
 * </ProtectedRoute>
 *
 * Shows a spinner while permissions load, then either renders children
 * or redirects to /dashboard with a blocked flag if no can_view access.
 */
export default function ProtectedRoute({ moduleKey, children }) {
  const { can, loading } = usePermissions();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 gap-2">
        <RefreshCw size={18} className="animate-spin" />
        <span className="text-sm font-medium">Checking permissions…</span>
      </div>
    );
  }

  if (!can(moduleKey, 'view')) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
          <ShieldCheck size={26} className="text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-[15px] font-extrabold text-gray-800">Access Denied</p>
          <p className="text-sm text-gray-500 mt-1">
            You don't have permission to view this page.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Contact your administrator to request access.
          </p>
        </div>
        <Navigate to="/dashboard" replace state={{ blocked: location.pathname }} />
      </div>
    );
  }

  return children;
}
