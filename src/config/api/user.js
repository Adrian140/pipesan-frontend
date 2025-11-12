import { supabase } from '../supabase';
import { handleDatabaseError } from './health';

export const userApi = {
  updateProfile: async (profileData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Not authenticated');

        console.log('🔄 Updating user profile with data:', profileData);

        // ✅ FIXED: Map frontend camelCase to database snake_case
        const dbData = {
          first_name: profileData.firstName,    // ✅ Map firstName -> first_name
          last_name: profileData.lastName,      // ✅ Map lastName -> last_name
          phone: profileData.phone,
          country: profileData.country,
          language: profileData.language,
          updated_at: new Date().toISOString(),
        };

        console.log('💾 Updating user in database:', dbData);

        const { data, error } = await supabase
          .from('users')
          .update(dbData)
          .eq('auth_id', user.id)
          .select()
          .single();
        
        if (error) {
          console.error('❌ Database update error:', error);
          await handleDatabaseError(error, 'update profile', retries);
          retries--;
          continue;
        }

        console.log('✅ User profile updated successfully:', data);
        return { message: 'Profilul a fost actualizat cu succes' };
      } catch (error) {
        const result = await handleDatabaseError(error, 'update profile', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },
};
