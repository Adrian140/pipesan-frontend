import { supabase } from '../supabase';
import { handleDatabaseError } from './health';

export const cartApi = {
  getItems: async () => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // Get current user's profile ID - PRIVACY: Filter by auth_id
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id) // ✅ PRIVACY: Only current user
          .single();
        
        if (profileError || !userProfile) {
          if (retries > 0) {
            await handleDatabaseError(profileError, 'get user profile for cart', retries);
            retries--;
            continue;
          }
          return [];
        }

        // Get ONLY this user's cart items - PRIVACY: Filter by user_id
        const { data, error } = await supabase
          .from('cart_items')
          .select(`
            id, product_id, variant_id, quantity, created_at, updated_at,
            products(name, sku, price, sale_price, images, weight_grams, stock_quantity, manage_stock),
            product_variants(name, sku, price)
          `)
          .eq('user_id', userProfile.id) // ✅ PRIVACY: Only current user's items
          .order('created_at', { ascending: false });
        
        if (error) {
          if (retries > 0) {
            await handleDatabaseError(error, 'get cart items', retries);
            retries--;
            continue;
          }
          throw error;
        }

        // Transform data for frontend
        // Un produs ascuns/dezactivat nu mai e vizibil (RLS) și vine ca null: îl sărim, nu golim tot coșul.
        return (data || []).filter((item) => item.products).map((item) => {
          const productImages = Array.isArray(item.products.images) ? item.products.images : [];
          const primaryImage = productImages[0] || '/product-placeholder.svg';
          const base = Number(item.products.price);
          const sale = Number(item.products.sale_price);
          // Același preț ca la plată: reducerea se aplică doar dacă e mai mică decât prețul de bază.
          const unitPrice = sale > 0 && sale < base ? sale : base;
          
          return {
            id: item.id,
            productId: item.product_id,
            name: item.product_variants?.name
              ? `${item.products.name} - ${item.product_variants.name}`
              : item.products.name,
            sku: item.product_variants?.sku || item.products.sku,
            price: item.product_variants?.price || unitPrice,
            maxQuantity: item.products.manage_stock === false ? 99 : Math.min(99, Math.max(0, Number(item.products.stock_quantity) || 0)),
            image: primaryImage,
            quantity: item.quantity,
            weightGrams: item.products.weight_grams || 500,
            variant: item.product_variants
              ? { id: item.variant_id, name: item.product_variants.name, sku: item.product_variants.sku }
              : null,
          };
        });
      } catch (error) {
        const result = await handleDatabaseError(error, 'get cart items', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        console.error('Cart error:', error);
        return [];
      }
    }
  },

  addItem: async (productId, variantId, quantity) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Not authenticated');

        // Get current user's profile ID - PRIVACY: Filter by auth_id
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id) // ✅ PRIVACY: Only current user
          .single();
        
        if (profileError || !userProfile) {
          if (retries > 0) {
            await handleDatabaseError(profileError, 'get user profile for add cart item', retries);
            retries--;
            continue;
          }
          throw new Error('User profile not found.');
        }

        console.log('🛒 Adding item to cart:', {
          userId: userProfile.id,
          productId,
          variantId,
          quantity
        });

     // ✅ FIX DUPLICATE SKU: Check if item already exists FIRST
let query = supabase
  .from('cart_items')
  .select('id, quantity')
  .eq('user_id', userProfile.id)
  .eq('product_id', productId);

if (variantId) {
  query = query.eq('variant_id', variantId);
} else {
  query = query.is('variant_id', null);
}

const { data: existingItem, error: checkError } = await query.maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          if (retries > 0) {
            await handleDatabaseError(checkError, 'check existing cart item', retries);
            retries--;
            continue;
          }
          throw new Error(checkError.message);
        }

        if (existingItem) {
          // ✅ UPDATE EXISTING ITEM: Add quantity to existing
          console.log('📦 Updating existing cart item:', existingItem.id, 'from', existingItem.quantity, 'to', existingItem.quantity + quantity);
          
          const { data: updatedData, error: updateError } = await supabase
            .from('cart_items')
            .update({ 
              quantity: existingItem.quantity + quantity, // ✅ ADD to existing quantity
              updated_at: new Date().toISOString() 
            })
            .eq('id', existingItem.id)
            .eq('user_id', userProfile.id) // ✅ PRIVACY: Double-check user ownership
            .select()
            .single();
          
          if (updateError) {
            if (retries > 0) {
              await handleDatabaseError(updateError, 'update existing cart item', retries);
              retries--;
              continue;
            }
            throw new Error(updateError.message);
          }
          
          console.log('✅ Successfully updated existing cart item');
          return updatedData;
        } else {
          // ✅ CREATE NEW ITEM: No existing item found
          console.log('🆕 Creating new cart item');
          
          const { data: newData, error: insertError } = await supabase
            .from('cart_items')
            .insert({ 
              user_id: userProfile.id, // ✅ PRIVACY: Tied to specific user
              product_id: productId, 
              variant_id: variantId || null, 
              quantity: quantity 
            })
            .select()
            .single();
          
          if (insertError) {
            if (retries > 0) {
              await handleDatabaseError(insertError, 'create new cart item', retries);
              retries--;
              continue;
            }
            throw new Error(insertError.message);
          }
          
          console.log('✅ Successfully created new cart item');
          return newData;
        }
      } catch (error) {
        const result = await handleDatabaseError(error, 'add item to cart', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        console.error('Add to cart error:', error);
        throw error;
      }
    }
  },

  updateQuantity: async (itemId, quantity) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Not authenticated');

        // Get user profile for privacy check
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();
        
        if (profileError || !userProfile) {
          if (retries > 0) {
            await handleDatabaseError(profileError, 'get user for update quantity', retries);
            retries--;
            continue;
          }
          throw new Error('User profile not found');
        }

        // ✅ PRIVACY: Update only if item belongs to current user
        const { data, error } = await supabase
          .from('cart_items')
          .update({ 
            quantity: Math.max(1, parseInt(quantity) || 1), 
            updated_at: new Date().toISOString() 
          })
          .eq('id', itemId)
          .eq('user_id', userProfile.id) // ✅ PRIVACY: Ensure user owns this item
          .select()
          .single();
        
        if (error) {
          if (retries > 0) {
            await handleDatabaseError(error, 'update cart quantity', retries);
            retries--;
            continue;
          }
          throw new Error(error.message);
        }
        
        return data;
      } catch (error) {
        const result = await handleDatabaseError(error, 'update cart quantity', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        console.error('Update quantity error:', error);
        throw error;
      }
    }
  },

  removeItem: async (itemId) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Not authenticated');

        // Get user profile for privacy check
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();
        
        if (profileError || !userProfile) {
          if (retries > 0) {
            await handleDatabaseError(profileError, 'get user for remove item', retries);
            retries--;
            continue;
          }
          throw new Error('User profile not found');
        }

        // ✅ PRIVACY: Remove only if item belongs to current user
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', itemId)
          .eq('user_id', userProfile.id); // ✅ PRIVACY: Ensure user owns this item
        
        if (error) {
          if (retries > 0) {
            await handleDatabaseError(error, 'remove cart item', retries);
            retries--;
            continue;
          }
          throw new Error(error.message);
        }
        
        return { success: true };
      } catch (error) {
        const result = await handleDatabaseError(error, 'remove cart item', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        console.error('Remove item error:', error);
        throw error;
      }
    }
  },

  clearCart: async () => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Not authenticated');

        // Get user profile for privacy check
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();
        
        if (profileError || !userProfile) {
          if (retries > 0) {
            await handleDatabaseError(profileError, 'get user for clear cart', retries);
            retries--;
            continue;
          }
          throw new Error('User profile not found');
        }

        // ✅ PRIVACY: Clear only current user's cart
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', userProfile.id); // ✅ PRIVACY: Only current user's items
        
        if (error) {
          if (retries > 0) {
            await handleDatabaseError(error, 'clear cart', retries);
            retries--;
            continue;
          }
          throw new Error(error.message);
        }
        
        return { success: true };
      } catch (error) {
        const result = await handleDatabaseError(error, 'clear cart', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        console.error('Clear cart error:', error);
        throw error;
      }
    }
  },
};
