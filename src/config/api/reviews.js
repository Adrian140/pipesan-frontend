import { supabase } from '../supabase';
import { handleDatabaseError } from './health';

export const reviewsApi = {
  // Get reviews for a specific product
  getByProduct: async (productId) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('product_reviews')
          .select('*')
          .eq('product_id', productId)
          .eq('is_approved', true)
          .order('is_verified_purchase', { ascending: false })
          .order('created_at', { ascending: false });
        
        if (error) {
          await handleDatabaseError(error, 'get product reviews', retries);
          retries--;
          continue;
        }
        
        return data || [];
      } catch (error) {
        const result = await handleDatabaseError(error, 'get product reviews', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  // Create a new review
  create: async (reviewData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        let userId = null;
        if (!authError && user) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();
          userId = userProfile?.id;
        }

        const { data, error } = await supabase
          .from('product_reviews')
          .insert({
            product_id: reviewData.productId,
            user_id: userId,
            customer_name: reviewData.customerName,
            customer_email: reviewData.customerEmail || '',
            rating: reviewData.rating,
            title: reviewData.title,
            comment: reviewData.comment,
            is_verified_purchase: reviewData.isVerifiedPurchase || false,
            purchase_date: reviewData.purchaseDate || null,
            created_by_admin: reviewData.createdByAdmin || false
          })
          .select()
          .single();
        
        if (error) {
          await handleDatabaseError(error, 'create review', retries);
          retries--;
          continue;
        }
        
        return data;
      } catch (error) {
        const result = await handleDatabaseError(error, 'create review', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  // Get all reviews (admin)
  getAllForAdmin: async () => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('product_reviews')
          .select(`
            *,
            products(name, sku, images)
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          await handleDatabaseError(error, 'get all reviews for admin', retries);
          retries--;
          continue;
        }
        
        return data || [];
      } catch (error) {
        const result = await handleDatabaseError(error, 'get all reviews for admin', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  // Update review (admin)
  update: async (reviewId, reviewData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('product_reviews')
          .update({
            customer_name: reviewData.customerName,
            rating: reviewData.rating,
            title: reviewData.title,
            comment: reviewData.comment,
            is_verified_purchase: reviewData.isVerifiedPurchase,
            purchase_date: reviewData.purchaseDate,
            is_approved: reviewData.isApproved,
            admin_notes: reviewData.adminNotes || '',
            updated_at: new Date().toISOString()
          })
          .eq('id', reviewId)
          .select()
          .single();
        
        if (error) {
          await handleDatabaseError(error, 'update review', retries);
          retries--;
          continue;
        }
        
        return data;
      } catch (error) {
        const result = await handleDatabaseError(error, 'update review', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  // Delete review (admin)
  delete: async (reviewId) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { error } = await supabase
          .from('product_reviews')
          .delete()
          .eq('id', reviewId);
        
        if (error) {
          await handleDatabaseError(error, 'delete review', retries);
          retries--;
          continue;
        }
        
        return { success: true };
      } catch (error) {
        const result = await handleDatabaseError(error, 'delete review', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  }
};
