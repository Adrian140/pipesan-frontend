import { supabase } from '../supabase';
import { handleDatabaseError } from './health';

export const adminApi = {
  // Categories
  getCategories: async () => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true });
        
        if (error) {
          await handleDatabaseError(error, 'get categories', retries);
          retries--;
          continue;
        }
        
        return data || [];
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

  createCategory: async (categoryData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .insert({
            name: categoryData.name,
            slug: categoryData.slug,
            description: categoryData.description || '',
            sort_order: categoryData.sortOrder || 0,
            is_active: true
          })
          .select()
          .single();
        
        if (error) {
          await handleDatabaseError(error, 'create category', retries);
          retries--;
          continue;
        }
        
        return data;
      } catch (error) {
        const result = await handleDatabaseError(error, 'create category', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },
getOrders: async ({ q = '', status = 'all', from, to, limit = 50, offset = 0 } = {}) => {
    let query = supabase
      .from('orders')
      .select(`
        id, order_number, status, payment_status, total_amount, currency,
        customer_email, customer_phone, created_at, shipping_method, carrier, tracking_number,
        user_id,
        users: user_id ( id, first_name, last_name, company_name )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') query = query.eq('status', status);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);
    if (q) {
      // căutăm după nr comandă / email
      query = query.or(`order_number.ilike.%${q}%,customer_email.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

getOrderById: async (id) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, payment_status, total_amount, currency, created_at,
      billing_first_name, billing_last_name, billing_address, billing_city, billing_postal_code, billing_country,
      shipping_first_name, shipping_last_name, shipping_address, shipping_city, shipping_postal_code, shipping_country,
      shipping_method, carrier, tracking_number, tracking_url, invoice_id,
      items:order_items ( id, product_id, sku, name, quantity, unit_price, price ),
      users:user_id ( id, first_name, last_name, company_name, email )
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
},

updateOrder: async (id, patch) => {
  const allowed = [
    'status',
    'admin_comment',
    'carrier',          // <- match DB column
    'tracking_number',
    'tracking_url',
    'invoice_id',
    'payment_status',
    'shipping_method',
  ];

  const safePatch = { updated_at: new Date().toISOString() };
  Object.keys(patch || {}).forEach((k) => {
    if (allowed.includes(k)) safePatch[k] = patch[k];
  });

  // 🔧 eliminăm complet .select() și .single()
const { error: upErr } = await supabase.from('orders').update(safePatch).eq('id', id);
  if (upErr) throw new Error(upErr.message);
  const { data: fresh, error: selErr } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, payment_status, total_amount, currency, created_at,
      billing_first_name, billing_last_name, billing_address, billing_city, billing_postal_code, billing_country,
      shipping_first_name, shipping_last_name, shipping_address, shipping_city, shipping_postal_code, shipping_country,
      carrier, tracking_number, tracking_url,
      items:order_items ( id, product_id, sku, name, quantity, unit_price, price ),
      users:user_id ( id, first_name, last_name, company_name, email )
    `)
    .eq('id', id)
    .single();
  if (selErr) throw new Error(selErr.message);
  return fresh;
},
  updateCategory: async (id, categoryData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .update({
            name: categoryData.name,
            slug: categoryData.slug,
            description: categoryData.description || '',
            sort_order: categoryData.sortOrder || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          await handleDatabaseError(error, 'update category', retries);
          retries--;
          continue;
        }
        
        return data;
      } catch (error) {
        const result = await handleDatabaseError(error, 'update category', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  deleteCategory: async (id) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        // Check if category has products
        const { count, error: countError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', id);

        if (countError) {
          await handleDatabaseError(countError, 'check category products', retries);
          retries--;
          continue;
        }

        if (count > 0) {
          throw new Error(`Cannot delete category: ${count} products are assigned to this category`);
        }

        const { error } = await supabase.from('categories').delete().eq('id', id);
        
        if (error) {
          await handleDatabaseError(error, 'delete category', retries);
          retries--;
          continue;
        }
        
        return { success: true };
      } catch (error) {
        const result = await handleDatabaseError(error, 'delete category', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  // Services
  getServices: async () => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        
        if (error) {
          await handleDatabaseError(error, 'get services', retries);
          retries--;
          continue;
        }
        
        return data || [];
      } catch (error) {
        const result = await handleDatabaseError(error, 'get services', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  createService: async (serviceData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('services')
          .insert({
            title: serviceData.title,
            description: serviceData.description,
            features: serviceData.features,
            price: serviceData.price,
            unit: serviceData.unit,
            category: serviceData.category,
          })
          .select()
          .single();
        
        if (error) {
          await handleDatabaseError(error, 'create service', retries);
          retries--;
          continue;
        }
        
        return data;
      } catch (error) {
        const result = await handleDatabaseError(error, 'create service', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  updateService: async (id, serviceData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('services')
          .update({
            title: serviceData.title,
            description: serviceData.description,
            features: serviceData.features,
            price: serviceData.price,
            unit: serviceData.unit,
            category: serviceData.category,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          await handleDatabaseError(error, 'update service', retries);
          retries--;
          continue;
        }
        
        return data;
      } catch (error) {
        const result = await handleDatabaseError(error, 'update service', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  deleteService: async (id) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { error } = await supabase.from('services').delete().eq('id', id);
        if (error) {
          await handleDatabaseError(error, 'delete service', retries);
          retries--;
          continue;
        }
        
        return { success: true };
      } catch (error) {
        const result = await handleDatabaseError(error, 'delete service', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  // ✅ IMPROVED: Products with draft support
  getProducts: async () => {
    let retries = 2;
    while (retries >= 0) {
      try {
        // Get ALL products for admin (including drafts)
        const { data, error } = await supabase
          .from('products')
          .select(`*, categories(name)`)
          .order('created_at', { ascending: false });
        
        if (error) {
          await handleDatabaseError(error, 'get admin products', retries);
          retries--;
          continue;
        }
        
        return data || [];
      } catch (error) {
        const result = await handleDatabaseError(error, 'get admin products', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  // ✅ IMPROVED: Create product with draft support
  createProduct: async (productData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        console.log('🛠️ Creating product:', productData);
        
        // ✅ FIXED: Support draft creation with minimal data
        const payload = {
          name: productData.name || `Draft Product ${Date.now()}`,
          slug: productData.slug || `draft-${Date.now()}`,
          sku: productData.sku || `DRAFT-${Date.now()}`,
          description: productData.description || '',
          price: (productData.price != null) ? parseFloat(productData.price) : 0,
          sale_price: (productData.sale_price != null) ? parseFloat(productData.sale_price)
                        : (productData.salePrice != null ? parseFloat(productData.salePrice) : null),
          currency: productData.currency || 'EUR',
          weight_grams: parseInt(productData.weight_grams || productData.weightGrams) || 500,
          dimensions: productData.dimensions || '',
          category_id: productData.category_id || productData.categoryId || null,
          bullet_points: productData.bullet_points || [],
          amazon_links: productData.amazon_links || {},
          stock_quantity: productData.stock_quantity || productData.stockQuantity || 0,
          manage_stock: productData.manage_stock || productData.manageStock || false,
          stock_status: productData.stock_status || productData.stockStatus || 'in_stock',
          specifications: productData.specifications || {},
          features: productData.features || [],
          images: productData.images || [],
          is_active: productData.is_active ?? false, // Default to inactive for drafts
          is_draft: productData.is_draft ?? true,     // Default to draft
          created_by_admin: true,
          meta_title: productData.meta_title || null,
          meta_description: productData.meta_description || null,
        };

        console.log('🛠️ Creating product with payload:', payload);

        const { data, error } = await supabase.from('products').insert(payload).select().single();
        if (error) {
          console.error('❌ Supabase insert error:', error);
          await handleDatabaseError(error, 'create product', retries);
          retries--;
          continue;
        }
        
        console.log('✅ Product created successfully:', data);
        return { data, success: true };
      } catch (error) {
        const result = await handleDatabaseError(error, 'create product', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  updateProduct: async (id, productData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        // ✅ FIXED: Use correct column names that match database schema
        const payload = {
          name: productData.name,
          slug: productData.slug,
          sku: productData.sku,
          description: productData.description,
          price: (productData.price != null) ? parseFloat(productData.price) : undefined,
          sale_price: (productData.sale_price != null) ? parseFloat(productData.sale_price)
                        : (productData.salePrice != null ? parseFloat(productData.salePrice) : undefined),
          currency: productData.currency,
          weight_grams: parseInt(productData.weight_grams || productData.weightGrams) || undefined,
          dimensions: productData.dimensions,
          category_id: productData.category_id || productData.categoryId,
          bullet_points: productData.bullet_points,
          amazon_links: productData.amazon_links,
          stock_quantity: productData.stock_quantity || productData.stockQuantity,
          manage_stock: productData.manage_stock || productData.manageStock,
          stock_status: productData.stock_status || productData.stockStatus,
          specifications: productData.specifications,
          features: productData.features,
          images: productData.images,
          is_active: productData.is_active,
          is_draft: productData.is_draft,
          meta_title: productData.meta_title,
          meta_description: productData.meta_description,
          updated_at: new Date().toISOString(),
        };
        
        // Remove undefined values to avoid database errors
        Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

        console.log('🔄 Updating product with payload:', payload);

        const { data, error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('❌ Supabase update error:', error);
          await handleDatabaseError(error, 'update product', retries);
          retries--;
          continue;
        }
        
        console.log('✅ Product updated successfully:', data);
        return { data, success: true };
      } catch (error) {
        const result = await handleDatabaseError(error, 'update product', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  deleteProduct: async (id) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
          await handleDatabaseError(error, 'delete product', retries);
          retries--;
          continue;
        }
        
        return { success: true };
      } catch (error) {
        const result = await handleDatabaseError(error, 'delete product', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  // Content
  getContent: async () => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase.from('content').select('*');
        if (error) {
          await handleDatabaseError(error, 'get content', retries);
          retries--;
          continue;
        }
        
        const contentObj = {};
        (data || []).forEach((item) => { contentObj[item.key] = item.value; });
        return contentObj;
      } catch (error) {
        const result = await handleDatabaseError(error, 'get content', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  updateContent: async (contentData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const updates = Object.entries(contentData).map(([key, value]) => ({
          key,
          value,
          updated_at: new Date().toISOString(),
        }));
        
        const { error } = await supabase.from('content').upsert(updates, { onConflict: 'key' });
        if (error) {
          await handleDatabaseError(error, 'update content', retries);
          retries--;
          continue;
        }
        
        return { success: true };
      } catch (error) {
        const result = await handleDatabaseError(error, 'update content', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  // Documents
  getDocuments: async () => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        
        if (error) {
          await handleDatabaseError(error, 'get documents', retries);
          retries--;
          continue;
        }
        
        return data || [];
      } catch (error) {
        const result = await handleDatabaseError(error, 'get documents', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  // ✅ NEW: Reviews Management
  getReviews: async () => {
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
          await handleDatabaseError(error, 'get all reviews', retries);
          retries--;
          continue;
        }
        
        return data || [];
      } catch (error) {
        const result = await handleDatabaseError(error, 'get all reviews', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  createReview: async (reviewData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('product_reviews')
          .insert({
            product_id: reviewData.productId,
            customer_name: reviewData.customerName,
            customer_email: reviewData.customerEmail || '',
            rating: reviewData.rating,
            title: reviewData.title,
            comment: reviewData.comment,
            is_verified_purchase: reviewData.isVerifiedPurchase || false,
            purchase_date: reviewData.purchaseDate || null,
            admin_notes: reviewData.adminNotes || '',
            is_approved: reviewData.isApproved ?? true,
            created_by_admin: true
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

  updateReview: async (id, reviewData) => {
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
            admin_notes: reviewData.adminNotes || '',
            is_approved: reviewData.isApproved,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
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

  deleteReview: async (id) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { error } = await supabase.from('product_reviews').delete().eq('id', id);
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
  },

  // Enhanced Users Management with full details - FIXED QUERY
  getUsers: async () => {
    let retries = 2;
    while (retries >= 0) {
      try {
        // FIXED: Simplified query to avoid complex joins that cause schema errors
        const { data, error } = await supabase
          .from('users')
          .select(`
            *,
            addresses(*),
            billing_profiles(*)
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          await handleDatabaseError(error, 'get users with details', retries);
          retries--;
          continue;
        }
        
        // Fetch orders and invoices separately to avoid join issues
        const usersWithDetails = await Promise.all(
          (data || []).map(async (user) => {
            try {
              // Get orders for this user
              const { data: userOrders } = await supabase
                .from('orders')
                .select('id, order_number, status, total_amount, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

              // Get invoices for this user
              const { data: userInvoices } = await supabase
                .from('invoices')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

              // Get shipping tracking for this user
              const { data: userTracking } = await supabase
                .from('shipping_tracking')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

              // Get order items for user orders (if any orders exist)
              let orderItems = [];
              if (userOrders && userOrders.length > 0) {
                const orderIds = userOrders.map(o => o.id);
                const { data: items } = await supabase
                  .from('order_items')
                  .select('id, order_id, quantity, price, unit_price, total_price, name, sku, product_id')
                  .in('order_id', orderIds);
                orderItems = items || [];
              }

              return {
                ...user,
                orders: (userOrders || []).map(order => ({
                  ...order,
                  items: orderItems.filter(item => item.order_id === order.id)
                })),
                invoices: userInvoices || [],
                tracking: userTracking || []
              };
            } catch (userError) {
              console.warn(`Error loading details for user ${user.id}:`, userError);
              return {
                ...user,
                orders: [],
                invoices: [],
                tracking: []
              };
            }
          })
        );
        
        return usersWithDetails;
      } catch (error) {
        const result = await handleDatabaseError(error, 'get users with details', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  getUserDetails: async (userId) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        // FIXED: Simplified query to avoid schema conflicts
        const { data, error } = await supabase
          .from('users')
          .select(`
            *,
            addresses(*),
            billing_profiles(*)
          `)
          .eq('id', userId)
          .single();
        
        if (error) {
          await handleDatabaseError(error, 'get user details', retries);
          retries--;
          continue;
        }

        // Fetch orders separately
        const { data: userOrders } = await supabase
          .from('orders')
          .select(`
            id, order_number, status, payment_status, total_amount, subtotal, tax_amount, shipping_amount,
            customer_email, created_at, updated_at,
            billing_first_name, billing_last_name, billing_address, billing_city, billing_postal_code, billing_country,
            shipping_first_name, shipping_last_name, shipping_address, shipping_city, shipping_postal_code, shipping_country
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        // Fetch order items separately
        let orderItems = [];
        if (userOrders && userOrders.length > 0) {
          const orderIds = userOrders.map(o => o.id);
          const { data: items } = await supabase
            .from('order_items')
            .select(`
              id, order_id, quantity, 
              price, unit_price, total_price, 
              name, sku, product_id
            `)
            .in('order_id', orderIds);
          
          orderItems = items || [];
        }

        // Fetch invoices separately
        const { data: userInvoices } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        // Fetch shipping tracking separately
        const { data: userTracking } = await supabase
          .from('shipping_tracking')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        return {
          ...data,
          orders: (userOrders || []).map(order => ({
            ...order,
            items: orderItems.filter(item => item.order_id === order.id)
          })),
          invoices: userInvoices || [],
          tracking: userTracking || []
        };
      } catch (error) {
        const result = await handleDatabaseError(error, 'get user details', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  // FIXED: Upload invoice to user-invoices bucket instead of documents
  uploadUserInvoice: async (userId, formData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        // Get user auth ID for storage path
        const { data: userProfile, error: userError } = await supabase
          .from('users')
          .select('auth_id')
          .eq('id', userId)
          .single();

        if (userError) {
          await handleDatabaseError(userError, 'get user for invoice upload', retries);
          retries--;
          continue;
        }

        // Upload the file to user-invoices bucket with user auth_id as folder
        const file = formData.get('invoice');
        const invoiceNumber = formData.get('invoiceNumber') || `INV-${Date.now()}`;
        
        const fileName = `${userProfile.auth_id}/${Date.now()}-${file.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-invoices')
          .upload(fileName, file, {
            upsert: false,
            contentType: 'application/pdf'
          });
        
        if (uploadError) {
          await handleDatabaseError(uploadError, 'upload user invoice file', retries);
          retries--;
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('user-invoices')
          .getPublicUrl(fileName);

        // Create invoice record in database
        const { data, error } = await supabase
          .from('invoices')
          .insert({
            user_id: userId,
            invoice_number: invoiceNumber,
            status: 'pending',
            total_amount: 0, // Will be updated later
            tax_amount: 0,
            date: new Date().toISOString().split('T')[0],
            pdf_url: publicUrl,
            file_path: fileName,
            file_size: file.size,
            uploaded_by_admin: true
          })
          .select()
          .single();
        
        if (error) {
          await handleDatabaseError(error, 'create invoice record', retries);
          retries--;
          continue;
        }
        
        return data;
      } catch (error) {
        const result = await handleDatabaseError(error, 'upload user invoice', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  downloadUserInvoice: async (invoiceId) => {
    try {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select('pdf_url')
        .eq('id', invoiceId)
        .single();
      
      if (error) throw error;
      
      if (invoice.pdf_url) {
        const response = await fetch(invoice.pdf_url);
        return await response.blob();
      }
      
      throw new Error('PDF URL not found');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error;
    }
  },

  deleteUserInvoice: async (invoiceId) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        // Get invoice details first
        const { data: invoice, error: fetchError } = await supabase
          .from('invoices')
          .select('file_path')
          .eq('id', invoiceId)
          .single();
        
        if (fetchError) {
          await handleDatabaseError(fetchError, 'fetch invoice for deletion', retries);
          retries--;
          continue;
        }

        // Delete from storage if file path exists
        if (invoice.file_path) {
          await supabase.storage.from('user-invoices').remove([invoice.file_path]);
        }

        // Delete from database
        const { error } = await supabase
          .from('invoices')
          .delete()
          .eq('id', invoiceId);
        
        if (error) {
          await handleDatabaseError(error, 'delete invoice record', retries);
          retries--;
          continue;
        }
        
        return { success: true };
      } catch (error) {
        const result = await handleDatabaseError(error, 'delete user invoice', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  // NEW: Shipping tracking management
  addTrackingInfo: async (userId, trackingData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('shipping_tracking')
          .insert({
            user_id: userId,
            order_id: trackingData.orderId || null,
            invoice_id: trackingData.invoiceId || null,
            carrier_name: trackingData.carrierName,
            carrier_url: trackingData.carrierUrl || '',
            tracking_number: trackingData.trackingNumber,
            tracking_url: trackingData.trackingUrl || '',
            shipping_status: trackingData.shippingStatus || 'pending',
            estimated_delivery: trackingData.estimatedDelivery || null,
            notes: trackingData.notes || ''
          })
          .select()
          .single();
        
        if (error) {
          await handleDatabaseError(error, 'add tracking info', retries);
          retries--;
          continue;
        }
        
        return data;
      } catch (error) {
        const result = await handleDatabaseError(error, 'add tracking info', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  updateTrackingInfo: async (trackingId, trackingData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('shipping_tracking')
          .update({
            carrier_name: trackingData.carrierName,
            carrier_url: trackingData.carrierUrl || '',
            tracking_number: trackingData.trackingNumber,
            tracking_url: trackingData.trackingUrl || '',
            shipping_status: trackingData.shippingStatus,
            estimated_delivery: trackingData.estimatedDelivery || null,
            actual_delivery_date: trackingData.actualDeliveryDate || null,
            notes: trackingData.notes || '',
            updated_at: new Date().toISOString()
          })
          .eq('id', trackingId)
          .select()
          .single();
        
        if (error) {
          await handleDatabaseError(error, 'update tracking info', retries);
          retries--;
          continue;
        }
        
        return data;
      } catch (error) {
        const result = await handleDatabaseError(error, 'update tracking info', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  deleteTrackingInfo: async (trackingId) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { error } = await supabase
          .from('shipping_tracking')
          .delete()
          .eq('id', trackingId);
        
        if (error) {
          await handleDatabaseError(error, 'delete tracking info', retries);
          retries--;
          continue;
        }
        
        return { success: true };
      } catch (error) {
        const result = await handleDatabaseError(error, 'delete tracking info', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  // Pricing
  getPricing: async () => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('pricing')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        
        if (error) {
          await handleDatabaseError(error, 'get pricing', retries);
          retries--;
          continue;
        }
        
        return data || [];
      } catch (error) {
        const result = await handleDatabaseError(error, 'get pricing', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  createPricing: async (pricingData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('pricing')
          .insert({
            service: pricingData.service,
            price: pricingData.price,
            unit: pricingData.unit,
            category: pricingData.category,
          })
          .select()
          .single();
        
        if (error) {
          await handleDatabaseError(error, 'create pricing', retries);
          retries--;
          continue;
        }
        
        return data;
      } catch (error) {
        const result = await handleDatabaseError(error, 'create pricing', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  updatePricing: async (id, pricingData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('pricing')
          .update({
            service: pricingData.service,
            price: pricingData.price,
            unit: pricingData.unit,
            category: pricingData.category,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          await handleDatabaseError(error, 'update pricing', retries);
          retries--;
          continue;
        }
        
        return data;
      } catch (error) {
        const result = await handleDatabaseError(error, 'update pricing', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  deletePricing: async (id) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { error } = await supabase.from('pricing').delete().eq('id', id);
        if (error) {
          await handleDatabaseError(error, 'delete pricing', retries);
          retries--;
          continue;
        }
        
        return { success: true };
      } catch (error) {
        const result = await handleDatabaseError(error, 'delete pricing', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  // Shipping Rates
  getShippingRates: async () => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('shipping_rates')
          .select('*')
          .eq('is_active', true)
          .order('country_name', { ascending: true });
        
        if (error) {
          await handleDatabaseError(error, 'get shipping rates', retries);
          retries--;
          continue;
        }
        
        return data || [];
      } catch (error) {
        const result = await handleDatabaseError(error, 'get shipping rates', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },
createShippingRate: async (rate) => {
    const payload = {
      country_code: rate.countryCode,
      country_name: rate.countryName,
      weight_min_grams: parseInt(rate.weightMinGrams) || 0,
      weight_max_grams: rate.weightMaxGrams ? parseInt(rate.weightMaxGrams) : null,
      shipping_cost: parseFloat(rate.shippingCost) || 0,
      currency: rate.currency || 'EUR',
      is_active: true,
    };
    const { data, error } = await supabase.from('shipping_rates').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  updateShippingRate: async (id, rate) => {
    const payload = {
      country_code: rate.countryCode,
      country_name: rate.countryName,
      weight_min_grams: parseInt(rate.weightMinGrams) || 0,
      weight_max_grams: rate.weightMaxGrams ? parseInt(rate.weightMaxGrams) : null,
      shipping_cost: parseFloat(rate.shippingCost) || 0,
      currency: rate.currency || 'EUR',
      is_active: true,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('shipping_rates').update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  deleteShippingRate: async (id) => {
    const { error } = await supabase.from('shipping_rates').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  },
  updateShippingRates: async (rates) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const ratesToInsert = rates.map(rate => ({
          country_code: rate.countryCode,
          country_name: rate.countryName,
          weight_min_grams: parseInt(rate.weightMinGrams) || 0,
          weight_max_grams: rate.weightMaxGrams ? parseInt(rate.weightMaxGrams) : null,
          shipping_cost: parseFloat(rate.shippingCost) || 0,
          currency: rate.currency || 'EUR',
          is_active: true
        }));

        const { data, error } = await supabase
          .from('shipping_rates')
          .upsert(ratesToInsert, { 
            onConflict: 'country_code,weight_min_grams,weight_max_grams',
            ignoreDuplicates: false 
          })
          .select();
        
        if (error) {
          await handleDatabaseError(error, 'update shipping rates', retries);
          retries--;
          continue;
        }
        
        return data;
      } catch (error) {
        const result = await handleDatabaseError(error, 'update shipping rates', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },
};
