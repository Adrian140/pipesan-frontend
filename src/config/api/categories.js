import { supabase } from '../supabase';
import { handleDatabaseError } from './health';

export const categoriesApi = {
  getAll: async () => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        
        if (error) {
          await handleDatabaseError(error, 'get categories', retries);
          retries--;
          continue;
        }

        const categoriesWithCount = await Promise.all(
          (data || []).map(async (category) => {
            try {
              const { count } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('category_id', category.id)
                .eq('is_active', true);
              return { ...category, productCount: count || 0 };
            } catch (err) {
              console.error(`Error counting products for category ${category.id}:`, err);
              return { ...category, productCount: 0 };
            }
          })
        );
        return categoriesWithCount;
      } catch (error) {
        const result = await handleDatabaseError(error, 'get categories', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },
};
