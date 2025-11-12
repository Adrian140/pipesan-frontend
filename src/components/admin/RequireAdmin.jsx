import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ADMIN_EMAILS = ['contact@pipesan.eu', 'ioan.adrian.bucur@gmail.com'];

const isAdminUser = (user) => {
  if (!user) return false;
  return (
    user.role === 'admin' ||
    ADMIN_EMAILS.includes(String(user.email || '').toLowerCase())
  );
};

export default function RequireAdmin({ children }) {
  const { user, loading, sessionChecked } = useAuth();
  const location = useLocation();

  if (loading && !sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <div className="text-text-secondary">Verificare sesiune...</div>
        </div>
      </div>
    );
  }

  if (!sessionChecked) {
    return null;
  }

  if (!isAdminUser(user)) {
    if (!user) {
      const redirect = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;
      return <Navigate replace to={redirect} />;
    }
    return <Navigate replace to="/dashboard" />;
  }

  return <>{children}</>;
}
