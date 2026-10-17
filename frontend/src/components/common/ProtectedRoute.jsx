import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute component ensuring only authenticated users can access child routes
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center p-6 text-aubergine">
        <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-aubergine/70">Verifying FinLearn security session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}

/**
 * AdminRoute component ensuring only authenticated admin users can access child routes
 */
export function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center p-6 text-aubergine">
        <div className="w-10 h-10 border-4 border-terracotta border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-aubergine/70">Verifying administrative privileges...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/app" replace />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
