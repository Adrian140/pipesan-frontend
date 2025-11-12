import { supabase } from '../supabase';
import { handleDatabaseError } from './health';

export const ordersApi = {
  // Creează o comandă pentru utilizator autentificat
  create: async (orderData) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Not authenticated');

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (profileError || !userProfile) {
        throw new Error('User profile not found.');
      }

      const orderNumber = `ORD-${Date.now()}`;

      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: userProfile.id,
          order_number: orderNumber,
          status: 'pending',
          payment_status: 'pending',
          customer_email: orderData.email,
          customer_phone: orderData.phone,
          billing_first_name: orderData.billingAddress?.firstName,
          billing_last_name: orderData.billingAddress?.lastName,
          billing_address: orderData.billingAddress?.street,
          billing_city: orderData.billingAddress?.city,
          billing_postal_code: orderData.billingAddress?.postalCode,
          billing_country: orderData.billingAddress?.country,
          shipping_first_name: orderData.shippingAddress?.firstName,
          shipping_last_name: orderData.shippingAddress?.lastName,
          shipping_address: orderData.shippingAddress?.street,
          shipping_city: orderData.shippingAddress?.city,
          shipping_postal_code: orderData.shippingAddress?.postalCode,
          shipping_country: orderData.shippingAddress?.country,
          subtotal: orderData.subtotal,
          tax_amount: orderData.tax,
          shipping_amount: orderData.shipping,
          total_amount: orderData.total,
          currency: orderData.currency || 'EUR',
          shipping_method: orderData.shippingMethod,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Inserăm și articolele (produsele) în order_items
      if (orderData.items && orderData.items.length > 0) {
        const itemsToInsert = orderData.items.map(it => ({
          order_id: data.id,
          product_id: it.productId || null,
          product_name: it.name,
          product_sku: it.sku || null,
          quantity: it.quantity,
          unit_price: it.price,
          total_price: it.totalPrice || it.price * it.quantity,
          weight_grams: it.weightGrams || 0
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Eroare inserare order_items:', itemsError);
        } else {
          console.log(`✅ ${itemsToInsert.length} articole salvate pentru comanda ${data.id}`);

          // 🔽 Scade automat stocul pentru fiecare produs
          for (const item of itemsToInsert) {
            if (item.product_id && item.quantity) {
              await supabase.rpc('decrease_stock', {
                p_product_id: item.product_id,
                p_quantity: item.quantity
              });
            }
          }
        }

        if (itemsError) {
          console.error('Eroare inserare order_items:', itemsError);
        } else {
          console.log(`✅ ${itemsToInsert.length} articole salvate pentru comanda ${data.id}`);
        }
      }

      return data;
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  },

  // Creează comandă pentru vizitator (fără user_id)
  createGuest: async (orderData) => {
    const orderNumber = `ORD-${Date.now()}`;

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: null,
        order_number: orderNumber,
        status: 'pending',
        payment_status: 'pending',
        customer_email: orderData.email,
        customer_phone: orderData.phone,
        billing_first_name: orderData.billingAddress?.firstName || orderData.firstName,
        billing_last_name: orderData.billingAddress?.lastName || orderData.lastName,
        billing_address: orderData.billingAddress?.street,
        billing_city: orderData.billingAddress?.city,
        billing_postal_code: orderData.billingAddress?.postalCode,
        billing_country: orderData.billingAddress?.country,
        shipping_first_name: orderData.shippingAddress?.firstName || orderData.firstName,
        shipping_last_name: orderData.shippingAddress?.lastName || orderData.lastName,
        shipping_address: orderData.shippingAddress?.street,
        shipping_city: orderData.shippingAddress?.city,
        shipping_postal_code: orderData.shippingAddress?.postalCode,
        shipping_country: orderData.shippingAddress?.country,
        subtotal: orderData.subtotal,
        tax_amount: orderData.tax,
        shipping_amount: orderData.shipping,
        total_amount: orderData.total,
        currency: orderData.currency || 'EUR',
        shipping_method: orderData.shippingMethod,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Inserăm și articolele (produsele) în order_items
    if (orderData.items && orderData.items.length > 0) {
      const itemsToInsert = orderData.items.map(it => ({
        order_id: order.id,
        product_id: it.productId || null,
        product_name: it.name,
        product_sku: it.sku || null,
        quantity: it.quantity,
        unit_price: it.price,
        total_price: it.totalPrice || it.price * it.quantity,
        weight_grams: it.weightGrams || 0
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Eroare inserare order_items (guest):', itemsError);
      } else {
        console.log(`✅ ${itemsToInsert.length} articole salvate pentru comanda ${order.id}`);

        // 🔽 Scade automat stocul pentru fiecare produs
        for (const item of itemsToInsert) {
          if (item.product_id && item.quantity) {
            await supabase.rpc('decrease_stock', {
              p_product_id: item.product_id,
              p_quantity: item.quantity
            });
          }
        }
      }
    }

    return order;
  },

  // Toate comenzile pentru user-ul autentificat
  getAll: async () => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Not authenticated');

        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (profileError || !userProfile) {
          if (retries > 0) {
            await handleDatabaseError(profileError, 'get user for orders', retries);
            retries--;
            continue;
          }
          return [];
        }

        const { data: orders, error } = await supabase
          .from('orders')
          .select(`
            id, order_number, status, payment_status, customer_email, customer_phone,
            billing_first_name, billing_last_name, billing_address, billing_city, billing_postal_code, billing_country,
            shipping_first_name, shipping_last_name, shipping_address, shipping_city, shipping_postal_code, shipping_country,
            subtotal, tax_amount, shipping_amount, total_amount, shipping_method, tracking_number, notes, created_at, updated_at
          `)
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false });

        if (error) {
          if (retries > 0) {
            await handleDatabaseError(error, 'get orders', retries);
            retries--;
            continue;
          }
          throw error;
        }

        // Adaugă items și imagine produs (opțional)
        const ordersWithItems = await Promise.all(
          (orders || []).map(async (order) => {
            try {
              const { data: orderItems, error: itemsError } = await supabase
              .from('order_items')
              .select(`
                id, product_id, product_name, product_sku, quantity, unit_price, total_price,
                product:products(id, name, sku, images)
              `)
              .eq('order_id', order.id);

              if (itemsError) {
                console.warn(`Error fetching items for order ${order.id}:`, itemsError);
                return { ...order, items: [] };
              }

              return { ...order, items: orderItems || [] };
            } catch (err) {
              console.warn(`Error processing order ${order.id}:`, err);
              return { ...order, items: [] };
            }
          })
        );

        return ordersWithItems;
      } catch (error) {
        const result = await handleDatabaseError(error, 'get orders', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        console.error('Get orders error:', error);
        return [];
      }
    }
  },

  // Detalii comandă după ID
  getById: async (orderId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            id, product_name, product_sku, quantity, unit_price, total_price
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get order by id error:', error);
      throw error;
    }
  },
};
