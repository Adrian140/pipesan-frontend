import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { apiClient, getProfile } from '../config/api';
const AuthContext = createContext();
export const useAuth=()=>{const value=useContext(AuthContext);if(!value)throw new Error('AuthProvider is required');return value;};
export function AuthProvider({children}) {
  const [user,setUser]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const [session,setSession]=useState(undefined);
  useEffect(()=>{
    if(!supabase){setLoading(false);return;}
    // Keep the auth callback synchronous; profile requests run in a separate effect.
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next));
    return ()=>subscription.unsubscribe();
  },[]);
  // Token refreshes and re-sign-ins of the same user must not unmount the account/admin pages.
  const userId=session===undefined?undefined:(session?.user?.id ?? null);
  useEffect(()=>{
    if(userId===undefined)return;
    let active=true;
    setLoading(true);setError('');setUser(null);
    if(!userId){setLoading(false);return;}
    getProfile(session.user).then(profile=>{if(active)setUser(profile);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[userId]);
  const wrap=fn=>async(...args)=>{try{return {success:true,...await fn(...args)};}catch(e){return {success:false,error:e.message};}};
  const logout=async()=>{if(!supabase)return;const {error}=await supabase.auth.signOut();if(error)return;setUser(null);};
  const refreshProfile=async()=>{if(session?.user)setUser(await getProfile(session.user));};
  const resendEmailVerification=async()=>{
    const email=session?.user?.email;if(!email)return {success:false,error:'Please sign in again.'};
    const {error:e}=await supabase.auth.resend({type:'signup',email,options:{emailRedirectTo:window.location.origin+'/dashboard'}});
    return e?{success:false,error:e.message}:{success:true};
  };
  return <AuthContext.Provider value={{user:user&&session?.user?{...user,emailVerified:!!session.user.email_confirmed_at}:user,loading,sessionChecked:!loading,error,logout,refreshProfile,refreshUser:refreshProfile,resendEmailVerification,login:wrap(apiClient.auth.login),register:wrap(apiClient.auth.register),forgotPassword:wrap(apiClient.auth.forgotPassword),enable2FA:wrap(apiClient.auth.enable2FA),verify2FA:wrap(apiClient.auth.verify2FA),disable2FA:wrap(apiClient.auth.disable2FA)}}>{children}</AuthContext.Provider>;
}
