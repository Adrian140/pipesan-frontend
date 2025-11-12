import { supabase } from '../supabase';
import { handleDatabaseError } from './health';

export const addressesApi = {
  getAll: async () => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Not authenticated');

        const { data: userProfile, error: profileError } = await supabase
          .from('users').select('id').eq('auth_id', user.id).single();
        
        if (profileError) {
          await handleDatabaseError(profileError, 'get user for addresses', retries);
          retries--;
          continue;
        }

        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          await handleDatabaseError(error, 'get addresses', retries);
          retries--;
          continue;
        }
        
        console.log('📍 Raw addresses from database:', data);
        return data || [];
      } catch (error) {
        const result = await handleDatabaseError(error, 'get addresses', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  create: async (addressData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Not authenticated');

        const { data: userProfile, error: profileError } = await supabase
          .from('users').select('id').eq('auth_id', user.id).single();
        
        if (profileError) {
          await handleDatabaseError(profileError, 'get user for create address', retries);
          retries--;
          continue;
        }

        console.log('�� Creating address with data:', addressData);

        // ✅ FIXED: Map frontend fields to database fields correctly
        const dbData = {
          user_id: userProfile.id,
          type: addressData.type,
          label: addressData.label || '',
          first_name: addressData.firstName,    // ✅ Map firstName -> first_name
          last_name: addressData.lastName,      // ✅ Map lastName -> last_name
          company: addressData.company || '',
          address: addressData.address,
          city: addressData.city,
          postal_code: addressData.postalCode,  // ✅ Map postalCode -> postal_code
          country: addressData.country,
          phone: addressData.phone || '',
          is_default: addressData.isDefault     // ✅ Map isDefault -> is_default
        };

        console.log('💾 Inserting to database:', dbData);

        const { data, error } = await supabase
          .from('addresses')
          .insert(dbData)
          .select()
          .single();
        
        if (error) {
          console.error('❌ Database insert error:', error);
          await handleDatabaseError(error, 'create address', retries);
          retries--;
          continue;
        }
        
        console.log('✅ Address created successfully:', data);
        return data;
      } catch (error) {
        const result = await handleDatabaseError(error, 'create address', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  update: async (id, addressData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        console.log('🔄 Updating address with data:', addressData);

        // ✅ FIXED: Map frontend fields to database fields correctly
        const dbData = {
          type: addressData.type,
          label: addressData.label || '',
          first_name: addressData.firstName,    // ✅ Map firstName -> first_name
          last_name: addressData.lastName,      // ✅ Map lastName -> last_name
          company: addressData.company || '',
          address: addressData.address,
          city: addressData.city,
          postal_code: addressData.postalCode,  // ✅ Map postalCode -> postal_code
          country: addressData.country,
          phone: addressData.phone || '',
          is_default: addressData.isDefault,    // ✅ Map isDefault -> is_default
          updated_at: new Date().toISOString()
        };

        console.log('💾 Updating in database:', dbData);

        const { data, error } = await supabase
          .from('addresses')
          .update(dbData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('❌ Database update error:', error);
          await handleDatabaseError(error, 'update address', retries);
          retries--;
          continue;
        }
        
        console.log('✅ Address updated successfully:', data);
        return data;
      } catch (error) {
        const result = await handleDatabaseError(error, 'update address', retries);
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
        const { error } = await supabase.from('addresses').delete().eq('id', id);
        if (error) {
          await handleDatabaseError(error, 'delete address', retries);
          retries--;
          continue;
        }
        
        return { success: true };
      } catch (error) {
        const result = await handleDatabaseError(error, 'delete address', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },
};
