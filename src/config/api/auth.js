import { supabase } from '../supabase';
import { handleDatabaseError } from './health';

export const authApi = {
  login: async (email, password) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);

        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', data.user.id)
          .maybeSingle();
        
        if (profileError && profileError.code !== 'PGRST116') {
          await handleDatabaseError(profileError, 'load user profile', retries);
          retries--;
          continue;
        }

        return { 
          token: data.session.access_token, 
          user: userProfile ? { ...userProfile, email: data.user.email } : {
            id: data.user.id,
            email: data.user.email,
            role: 'user'
          }
        };
      } catch (error) {
        const result = await handleDatabaseError(error, 'login', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  register: async (userData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
        });
        if (authError) throw new Error(authError.message);

        const { error: profileError } = await supabase.from('users').insert({
          auth_id: authData.user.id,
          first_name: userData.firstName || '',
          last_name: userData.lastName || '',
          phone: userData.phone || '',
          country: userData.deliveryCountry || 'FR',
          language: 'fr',
          role: 'user',
        });
        
        if (profileError) {
          await handleDatabaseError(profileError, 'create user profile', retries);
          retries--;
          continue;
        }

        return { message: 'Account created successfully' };
      } catch (error) {
        const result = await handleDatabaseError(error, 'register', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  validate: async () => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) throw new Error('Invalid session');

        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .maybeSingle();
        
        if (profileError && profileError.code !== 'PGRST116') {
          await handleDatabaseError(profileError, 'validate user', retries);
          retries--;
          continue;
        }

        return userProfile ? { ...userProfile, email: user.email } : {
          id: user.id,
          email: user.email,
          role: 'user'
        };
      } catch (error) {
        const result = await handleDatabaseError(error, 'validate', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  forgotPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
    return { message: 'Password reset link sent to your email' };
  },

  changePassword: async (_currentPassword, newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
    return { message: 'Password changed successfully' };
  },

  // Mock 2FA methods
  enable2FA: async () => ({ 
    qrCode: 'data:image/png;base64,mock-qr-code-from-backend', 
    secret: 'MOCK2FASECRET' 
  }),
  
  verify2FA: async () => ({ 
    message: '2FA enabled successfully' 
  }),
  
  disable2FA: async () => ({ 
    message: '2FA disabled successfully' 
  }),
};
