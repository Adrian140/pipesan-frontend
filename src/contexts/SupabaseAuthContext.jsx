// Compatibility facade for older screens; all authentication uses the same provider.
import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { apiClient } from '../config/api';
export function SupabaseAuthProvider({children}) { return <AuthProvider>{children}</AuthProvider>; }
export function useSupabaseAuth() {
  const auth = useAuth();
  const profile = auth.user && Object.fromEntries(Object.entries(auth.user).map(([key,value])=>[key.replace(/[A-Z]/g,c=>'_'+c.toLowerCase()),value]));
  return {...auth,user:auth.user && {...auth.user,id:auth.user.authId},profile,
    signIn:auth.login,signOut:auth.logout,resetPassword:auth.forgotPassword,
    signUp:(email,password,data={})=>auth.register({email,password,...data}),
    updateProfile:async updates=>{try {const input=Object.fromEntries(Object.entries(updates).map(([key,value])=>[key.replace(/_([a-z])/g,(_,c)=>c.toUpperCase()),value]));await apiClient.user.updateProfile(input);await auth.refreshProfile();return {success:true};}catch(error){return {success:false,error:error.message};}}
  };
}
