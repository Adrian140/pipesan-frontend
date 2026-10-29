import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '../config/api';
const AdminAuthContext = createContext();
export const useAdminAuth = () => {
  const value = useContext(AdminAuthContext);
  if (!value) throw new Error('AdminAuthProvider is required');
  return value;
};
export function AdminAuthProvider({children}) {
  const {user, loading, logout} = useAuth();
  const adminLogin = async (email,password) => {
    try {
      const response = await apiClient.auth.login(email,password);
      if (response.user?.role !== 'admin') return {success:false,error:'Administrator access required.'};
      return {success:true};
    } catch (error) { return {success:false,error:error.message}; }
  };
  return <AdminAuthContext.Provider value={{isAdminAuthenticated:user?.role==='admin',loading,adminLogin,adminLogout:logout}}>{children}</AdminAuthContext.Provider>;
}
