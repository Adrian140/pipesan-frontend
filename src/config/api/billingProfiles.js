import { supabase } from '../supabase';
import { handleDatabaseError } from './health';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const billingProfilesApi = {
  getAll: async () => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Not authenticated');

        const { data: userProfile, error: profileError } = await supabase
          .from('users').select('id').eq('auth_id', user.id).single();
        
        if (profileError) {
          await handleDatabaseError(profileError, 'get user for billing profiles', retries);
          retries--;
          continue;
        }

        const { data, error } = await supabase
          .from('billing_profiles')
          .select('*')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          await handleDatabaseError(error, 'get billing profiles', retries);
          retries--;
          continue;
        }
        
        console.log('💳 Raw billing profiles from database:', data);
        return data || [];
      } catch (error) {
        const result = await handleDatabaseError(error, 'get billing profiles', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  create: async (profileData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Not authenticated');

        const { data: userProfile, error: profileError } = await supabase
          .from('users').select('id').eq('auth_id', user.id).single();
        
        if (profileError) {
          await handleDatabaseError(profileError, 'get user for create billing profile', retries);
          retries--;
          continue;
        }

        console.log('📤 Creating billing profile with data:', profileData);

        // ✅ FIXED: Map frontend fields to database fields correctly
        const dbData = {
          user_id: userProfile.id,
          type: profileData.type,
          first_name: profileData.firstName || '',     // ✅ Map firstName -> first_name
          last_name: profileData.lastName || '',       // ✅ Map lastName -> last_name
          company_name: profileData.companyName || '', // ✅ Map companyName -> company_name
          vat_number: profileData.vatNumber || '',     // ✅ Map vatNumber -> vat_number
          siren_siret: profileData.sirenSiret || '',   // ✅ Map sirenSiret -> siren_siret
          country: profileData.country,
          address: profileData.address,
          city: profileData.city,
          postal_code: profileData.postalCode,         // ✅ Map postalCode -> postal_code
          phone: profileData.phone || '',
          is_default: profileData.isDefault            // ✅ Map isDefault -> is_default
        };

        console.log('💾 Inserting to database:', dbData);

        const { data, error } = await supabase
          .from('billing_profiles')
          .insert(dbData)
          .select()
          .single();
        
        if (error) {
          console.error('❌ Database insert error:', error);
          await handleDatabaseError(error, 'create billing profile', retries);
          retries--;
          continue;
        }
        
        console.log('✅ Billing profile created successfully:', data);
        return data;
      } catch (error) {
        const result = await handleDatabaseError(error, 'create billing profile', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  update: async (id, profileData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        console.log('�� Updating billing profile with data:', profileData);

        // ✅ FIXED: Map frontend fields to database fields correctly
        const dbData = {
          type: profileData.type,
          first_name: profileData.firstName || '',     // ✅ Map firstName -> first_name
          last_name: profileData.lastName || '',       // ✅ Map lastName -> last_name
          company_name: profileData.companyName || '', // ✅ Map companyName -> company_name
          vat_number: profileData.vatNumber || '',     // ✅ Map vatNumber -> vat_number
          siren_siret: profileData.sirenSiret || '',   // ✅ Map sirenSiret -> siren_siret
          country: profileData.country,
          address: profileData.address,
          city: profileData.city,
          postal_code: profileData.postalCode,         // ✅ Map postalCode -> postal_code
          phone: profileData.phone || '',
          is_default: profileData.isDefault,           // ✅ Map isDefault -> is_default
          updated_at: new Date().toISOString()
        };

        console.log('💾 Updating in database:', dbData);

        const { data, error } = await supabase
          .from('billing_profiles')
          .update(dbData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('❌ Database update error:', error);
          await handleDatabaseError(error, 'update billing profile', retries);
          retries--;
          continue;
        }
        
        console.log('✅ Billing profile updated successfully:', data);
        return data;
      } catch (error) {
        const result = await handleDatabaseError(error, 'update billing profile', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  delete: async (id) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { error } = await supabase.from('billing_profiles').delete().eq('id', id);
        if (error) {
          await handleDatabaseError(error, 'delete billing profile', retries);
          retries--;
          continue;
        }
        
        return { success: true };
      } catch (error) {
        const result = await handleDatabaseError(error, 'delete billing profile', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  validateVAT: async () => {
    await delay(1000);
    return { valid: true, companyName: 'Mock Company' };
  },
};
