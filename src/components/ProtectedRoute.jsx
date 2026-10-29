import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
export default function ProtectedRoute({children,admin=false}) {
  const {user,loading,error}=useAuth();
  const location=useLocation();
  if(loading)return <p role="status" className="p-12">Loading account…</p>;
  if(error)return <p role="alert" className="p-12 text-red-700">Unable to load account: {error}</p>;
  if(!user)return <Navigate to="/login" state={{from:location.pathname+location.search}} replace/>;
  if(admin && user.role!=='admin')return <p role="alert" className="p-12">Administrator access required.</p>;
  return children;
}
