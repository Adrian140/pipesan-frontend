// FILE: src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import { apiClient } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ---- Tunables (kept conservative) ----
const ADMIN_EMAILS = ['contact@pipesan.eu', 'ioan.adrian.bucur@gmail.com'];
const PROFILE_TIMEOUT_MS = 2000;  // original behavior preserved
const SESSION_TIMEOUT_MS = 2000;  // original behavior preserved
// cache local simplu pentru user (hidratare instant în tab nou)
const CACHE_KEY = 'ps_user';
const hasLS = () => typeof window !== 'undefined' && !!window.localStorage;
const readCachedUser = () => {
  try { return hasLS() ? JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') : null; } catch { return null; }
};
const writeCachedUser = (u) => {
  try { if (hasLS()) localStorage.setItem(CACHE_KEY, JSON.stringify(u)); } catch {}
};
const clearCachedUser = () => {
  try { if (hasLS()) localStorage.removeItem(CACHE_KEY); } catch {}
};



const AuthProviderComponent = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const bootProfileLoadedRef = useRef(false);

// hidratare instant din cache (UI pare logat instant în tab nou)
useEffect(() => {
  const cached = readCachedUser();
  if (cached && !user) {
    setUser(cached);
    setSessionChecked(true);   // ✅ UI poate randa butoanele imediat
    setLoading(false);         // ✅ nu mai arătăm „loading” pentru navbar
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  // -------------------------
  // Load user profile from DB with timeout and fallback
  // -------------------------
  const loadUserProfile = async (authUser, timeoutMs = PROFILE_TIMEOUT_MS) => {
    if (!authUser) {
      console.log('[auth] loadUserProfile called with null authUser');
      setUser(null);
      clearCachedUser();
      return null;
    }

    console.log('[auth] Loading profile for user:', authUser.email);
    console.log('[auth] loadUserProfile input:', {
      authUserId: authUser.id,
      authUserEmail: authUser.email,
      authUserRole: authUser.role,
      authUserMetadata: authUser.user_metadata,
      authUserAppMetadata: authUser.app_metadata,
    });

    // Immediate fallback user (non-blocking)
    const email = (authUser.email || '').toLowerCase();
    const isAdminEmail = ADMIN_EMAILS.includes(email);

    const fallbackUser = {
      id: authUser.id,
      email: authUser.email,
      role: isAdminEmail ? 'admin' : 'user',
      firstName: isAdminEmail ? 'Admin' : 'User',
      lastName: 'User',
      phone: '',
      country: 'RO',
      language: 'ro',
      emailVerified: !!authUser.email_confirmed_at, // derive from auth
      twoFactorEnabled: false,
    };

    try {
      // Add timeout to prevent hanging
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile loading timeout')), timeoutMs)
      );

      const { data: userProfile, error } = await Promise.race([
        profilePromise,
        timeoutPromise,
      ]);

      console.log('[auth] DB profile query result:', {
        hasProfile: !!userProfile,
        profileData: userProfile
          ? {
              id: userProfile.id,
              firstName: userProfile.first_name,
              lastName: userProfile.last_name,
              role: userProfile.role,
              authId: userProfile.auth_id,
              emailVerified: userProfile.email_verified,
            }
          : null,
        error: error
          ? {
              code: error.code,
              message: error.message,
              details: error.details,
            }
          : null,
      });

      if (error && error.code !== 'PGRST116') {
        console.error('[auth] Error loading user profile:', error);
        console.log('[auth] Using fallback user due to profile error');
       setUser(fallbackUser);
        writeCachedUser(fallbackUser);
        return fallbackUser;
      }

      if (!userProfile) {
        console.log('[auth] No user profile found in DB for:', authUser.email);

        // For admin users, attempt to create a profile quickly
        if (isAdminEmail) {
          console.log('[auth] Creating admin profile...');
          try {
            const { data: newProfile, error: createError } = await Promise.race([
              supabase
                .from('users')
                .insert({
                  auth_id: authUser.id,
                  first_name: 'Admin',
                  last_name: 'User',
                  role: 'admin',
                  email_verified: true,
                  country: 'RO',
                  language: 'ro',
                })
                .select()
                .single(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile creation timeout')), 3000)
              ),
            ]);

            if (createError) {
              console.error('[auth] Failed to create admin profile:', createError);
              setUser(fallbackUser);
              writeCachedUser(fallbackUser);
              return fallbackUser;
            }

            console.log('[auth] Admin profile created');
            const fullProfile = { ...newProfile, email: authUser.email };
            setUser(fullProfile);
            writeCachedUser(fullProfile);
            return fullProfile;
          } catch (createErr) {
            console.error('[auth] Exception creating admin profile:', createErr);
            setUser(fallbackUser);
            writeCachedUser(fallbackUser);
            return fallbackUser;
          }
        }

        // Regular user: use fallback
        console.log('[auth] Regular user without profile, using fallback');
        setUser(fallbackUser);
        writeCachedUser(fallbackUser);
        return fallbackUser;
      }

      console.log('[auth] User profile loaded successfully');
      const fullUserProfile = {
        ...userProfile,
        email: authUser.email,
        emailVerified: userProfile.email_verified || !!authUser.email_confirmed_at,
      };
      setUser(fullUserProfile);
      writeCachedUser(fullUserProfile);
      return fullUserProfile;
    } catch (err) {
      console.error('[auth] loadUserProfile exception:', err);
      console.log('[auth] Using fallback due to exception');
      setUser(fallbackUser);
      writeCachedUser(fallbackUser);
      return fallbackUser;
    }
  };
// -------------------------
// INIT: check existing session (no flicker, keeps cache on network errors)
// -------------------------
useEffect(() => {
  const checkSession = async () => {
    try {
      // Dacă avem user din cache, nu blocăm UI cu loading
      const hadCachedUser = !!user || !!readCachedUser();
      if (!hadCachedUser) setLoading(true);

      console.log('[auth] Starting session check…');
      console.log('[auth] Initial state:', {
        user: user ? { email: user.email, role: user.role } : null,
        loading,
        sessionChecked,
      });

      // Get current session with timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Session check timeout')), SESSION_TIMEOUT_MS)
      );

      const { data: { session }, error } = await Promise.race([
        sessionPromise,
        timeoutPromise,
      ]);

      console.log('[auth] Session check result:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        emailConfirmed: session?.user?.email_confirmed_at,
        sessionError: error?.message,
        accessToken: session?.access_token ? 'present' : 'missing',
      });

      if (error) {
        console.error('[auth] Session check error:', error);
        // ✅ Nu golim user-ul și nu ștergem cache-ul la erori de rețea.
        // Păstrăm UI-ul hidratat din cache.
        return;
      }

      if (session?.user) {
        console.log('[auth] Existing session for:', session.user.email);
        if (!bootProfileLoadedRef.current) {
          bootProfileLoadedRef.current = true;
          await loadUserProfile(session.user);
        }
      } else {
        console.log('[auth] No active session');
        // ✅ Doar dacă nu avem user în cache, clar suntem delogați
        if (!readCachedUser()) {
          setUser(null);
          clearCachedUser();
        }
      }
    } catch (err) {
      console.error('[auth] Session check failed:', err);
      console.log('[auth] Session check exception:', {
        name: err.name,
        message: err.message,
      });
      // ✅ Nu mai dăm setUser(null)/clearCachedUser() pe excepții — păstrăm cache-ul.
    } finally {
      console.log('[auth] Session check completed');
      setLoading(false);
      setSessionChecked(true);
    }
  };

  checkSession();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('[auth] Auth state changed:', event, session?.user?.email);
      console.log('[auth] Auth state change details:', {
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        userId: session?.user?.id,
        emailConfirmed: session?.user?.email_confirmed_at,
        currentUser: user ? { email: user.email, role: user.role } : null,
      });

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('[auth] User signed in, loading profile…');
        bootProfileLoadedRef.current = true;
        // ✅ NU mai atingem loading aici ca să evităm flicker.
        await loadUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        console.log('[auth] User signed out');
        setUser(null);
        clearCachedUser();
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('[auth] Token refreshed (no state change needed)');
        return;
      } else if (event === 'INITIAL_SESSION' && session?.user) {
        console.log('[auth] Initial session detected, loading profile…');
        if (!bootProfileLoadedRef.current) {
          setLoading(true);
          bootProfileLoadedRef.current = true;
          await loadUserProfile(session.user);
          setLoading(false);
        }
      }
      setSessionChecked(true);
    }
  );

  return () => subscription.unsubscribe();
}, []);

  // -------------------------
  // Auth actions with improved error handling
  // -------------------------
  const login = async (email, password) => {
    try {
      console.log('[auth] Login attempt:', { email, hasPassword: !!password });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('[auth] Login response:', {
        hasData: !!data,
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        userEmail: data?.user?.email,
        emailConfirmed: data?.user?.email_confirmed_at,
        error: error?.message,
      });

      if (error) throw error;

      // Let the onAuthStateChange handler load the profile
      return { success: true, user: data.user };
    } catch (err) {
      console.log('[auth] Login failed:', { message: err.message });

      // Friendly messages (EN)
      let friendlyMessage = 'Authentication error';

      if (err.message.includes('Invalid login credentials')) {
        friendlyMessage = 'Incorrect email or password';
      } else if (err.message.includes('Email not confirmed')) {
        friendlyMessage = 'Please confirm your email before logging in';
      } else if (err.message.includes('Too many requests')) {
        friendlyMessage = 'Too many attempts. Please try again in a few minutes';
      } else if (err.message.includes('User not found')) {
        friendlyMessage = 'No account found with this email';
      }

      return { success: false, error: friendlyMessage };
    }
  };

// Înlocuiește funcția register existentă cu aceasta (în src/contexts/AuthContext.jsx)
const register = async (userData) => {
  try {
    console.log('[auth] Registration attempt for:', userData.email);

    // NU mai folosim auth.admin.* aici

    // 1) Sign Up (email confirmation)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/email-verified`,
        // opțional: poți pune meta-date în user_metadata
        data: {
          accountType: userData.accountType,
          firstName: userData.firstName,
          lastName: userData.lastName,
          companyName: userData.companyName,
          cui: userData.cui,
          vatNumber: userData.vatNumber,
          companyAddress: userData.companyAddress,
          companyCity: userData.companyCity,
          companyPostalCode: userData.companyPostalCode,
          deliveryCountry: userData.deliveryCountry,
          acceptMarketing: userData.acceptMarketing,
          language: 'fr',
        },
      },
    });

    if (authError) {
      console.error('[auth] Auth registration error:', authError);
      const msg = String(authError.message || '');

      if (msg.includes('User already registered')) {
        return { success: false, error: 'Un compte avec cet e-mail existe déjà. Veuillez vous connecter ou utiliser « Mot de passe oublié ».' };
      }
      if (msg.toLowerCase().includes('invalid email')) {
        return { success: false, error: 'Adresse e-mail invalide.' };
      }
      if (msg.toLowerCase().includes('password')) {
        return { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.' };
      }
      if (msg.toLowerCase().includes('signup is disabled')) {
        return { success: false, error: 'Les inscriptions sont temporairement désactivées. Veuillez contacter le support.' };
      }

      return { success: false, error: 'Une erreur est survenue lors de la création du compte.' };
    }

    if (!authData?.user) {
      return { success: false, error: 'Le compte n’a pas pu être créé. Veuillez réessayer.' };
    }

    console.log('[auth] Auth user created:', authData.user.email);

    // 2) (Opțional) Crearea profilului în tabelul "users"
    // Notă: la majoritatea setărilor, până nu confirmă e-mailul, nu ai sesiune;
    // deci inserția poate eșua din cauza RLS. Recomand să faci upsert-ul după SIGNED_IN.
    // Dacă totuși păstrezi insertul aici și îți funcționează, îl poți lăsa:

    try {
      await supabase
        .from('users')
        .insert({
          auth_id: authData.user.id,
          first_name: userData.firstName || '',
          last_name: userData.lastName || '',
          phone: userData.phone || '',
          country: userData.deliveryCountry || 'FR',
          language: 'fr',
          role: 'user',
          email_verified: false,
        });
    } catch (e) {
      console.warn('[auth] Profile insert may be deferred until first login due to RLS:', e?.message);
    }

    return {
      success: true,
      message: 'Compte créé. Veuillez vérifier votre e-mail et confirmer votre adresse pour activer le compte.',
    };
  } catch (err) {
    console.error('[auth] Registration exception:', err);
    if (String(err.message || '').includes('fetch')) {
      return { success: false, error: 'Problème réseau. Vérifiez votre connexion et réessayez.' };
    }
    return { success: false, error: 'Une erreur inattendue est survenue. Veuillez réessayer ou contacter le support.' };
  }
};


  const logout = async () => {
    console.log('[auth] Logout initiated for:', user ? { email: user.email, role: user.role } : null);

    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    clearCachedUser();
    setLoading(false);

    console.log('[auth] Logout completed');
  };

  const forgotPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://pipesan.eu/reset-password',
      });

      if (error) {
        console.error('[auth] Forgot password error:', error);

        if (error.message.includes('User not found')) {
          return { success: false, error: 'No account found with this email' };
        } else if (error.message.includes('For security purposes')) {
          return {
            success: true,
            message:
              'If an account exists with this email, a reset link has been sent.',
          };
        }

        throw error;
      }

      return {
        success: true,
        message:
          'The reset link has been sent to your email. Please check your inbox and spam folder.',
      };
    } catch (err) {
      console.error('[auth] Forgot password exception:', err);
      return {
        success: false,
        error: 'Could not send the reset email. Please try again.',
      };
    }
  };

  // Resend email verification
  const resendEmailVerification = async () => {
    try {
      if (!user?.email) {
        return {
          success: false,
          error: 'Could not determine the email address. Please sign in again.',
        };
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
         emailRedirectTo: `${window.location.origin}/email-verified`,
        },
      });

      if (error) {
        console.error('[auth] Resend verification error:', error);

        if (error.message.includes('Email rate limit exceeded')) {
          return {
            success: false,
            error:
              'You have sent too many emails recently. Please try again in a few minutes.',
          };
        }

        throw error;
      }

      return {
        success: true,
        message:
          'Verification email resent! Please check your inbox and spam folder.',
      };
    } catch (err) {
      console.error('[auth] Resend verification exception:', err);
      return {
        success: false,
        error:
          'Could not resend the verification email. Please contact support.',
      };
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      if (!error && authUser) {
        await loadUserProfile(authUser);
      }
    } catch (error) {
      console.error('[auth] Error refreshing user:', error);
    }
  };

  const enable2FA = async () => {
    try {
      const data = await apiClient.auth.enable2FA();
      return { success: true, ...data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const verify2FA = async (token) => {
    try {
      const result = await apiClient.auth.verify2FA(token);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const disable2FA = async (token) => {
    try {
      const result = await apiClient.auth.disable2FA(token);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

// -------------------------
// Context value
// -------------------------
const isAdmin = !!user && (
  user.role === 'admin' ||
  ADMIN_EMAILS.includes((user.email || '').toLowerCase())
);

const value = React.useMemo(() => ({
  user,
  loading,
  sessionChecked,
  isAdmin,                           // ✅ disponibil în UI
  login,
  register,
  logout,
  forgotPassword,
  resendEmailVerification,
  refreshUser,
  enable2FA,
  verify2FA,
  disable2FA,
}), [user, loading, sessionChecked]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AuthProvider = React.memo(AuthProviderComponent);
