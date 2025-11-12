import { supabase } from '../supabase';
import { handleDatabaseError } from './health';

export const shippingRatesApi = {
  // Get all shipping rates (admin)
  getAll: async () => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('shipping_rates')
          .select('*')
          .eq('is_active', true)
          .order('country_name', { ascending: true })
          .order('weight_min_grams', { ascending: true });
        
        if (error) {
          await handleDatabaseError(error, 'get all shipping rates', retries);
          retries--;
          continue;
        }
        
        return data || [];
      } catch (error) {
        const result = await handleDatabaseError(error, 'get all shipping rates', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  // Get shipping rates by country
  getByCountry: async (countryCode) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('shipping_rates')
          .select('*')
          .eq('country_code', countryCode)
          .eq('is_active', true)
          .order('weight_min_grams', { ascending: true });
        
        if (error) {
          await handleDatabaseError(error, 'get shipping rates by country', retries);
          retries--;
          continue;
        }
        
        return data || [];
      } catch (error) {
        const result = await handleDatabaseError(error, 'get shipping rates by country', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  // Create shipping rate
  create: async (rateData) => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('shipping_rates')
          .insert({
            country_code: rateData.countryCode,
            country_name: rateData.countryName,
            weight_min_grams: parseInt(rateData.weightMinGrams) || 0,
            weight_max_grams: rateData.weightMaxGrams ? parseInt(rateData.weightMaxGrams) : null,
            shipping_cost: parseFloat(rateData.shippingCost) || 0,
            currency: rateData.currency || 'EUR'
          })
          .select()
          .single();
        
        if (error) {
          await handleDatabaseError(error, 'create shipping rate', retries);
          retries--;
          continue;
        }
        
        return data;
      } catch (error) {
        const result = await handleDatabaseError(error, 'create shipping rate', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

 // Update shipping rate
update: async (id, rateData) => {
  let retries = 2;
  while (retries >= 0) {
    try {
      // sanitize numeric inputs
      const weightMin = Number.isFinite(Number(rateData.weightMinGrams))
        ? Number(rateData.weightMinGrams)
        : 0;

      // dacă e gol, NU îl trimitem (ca să nu încalce NOT NULL)
      const hasWeightMax = rateData.weightMaxGrams !== undefined && rateData.weightMaxGrams !== null && `${rateData.weightMaxGrams}`.trim() !== '';
      const weightMax = hasWeightMax ? Number(rateData.weightMaxGrams) : undefined;

      const shippingCost = Number.isFinite(Number(rateData.shippingCost))
        ? Number(rateData.shippingCost)
        : 0;

      // construim payload fără câmpuri undefined
      const payload = {
        country_code: rateData.countryCode,
        country_name: rateData.countryName,
        weight_min_grams: weightMin,
        shipping_cost: shippingCost,
        currency: rateData.currency || 'EUR',
        updated_at: new Date().toISOString()
      };
      if (hasWeightMax) payload.weight_max_grams = weightMax;

      const { error } = await supabase
        .from('shipping_rates')
        .update(payload)
        .eq('id', id); // fără .select()

      if (error) {
        await handleDatabaseError(error, 'update shipping rate', retries);
        retries--;
        continue;
      }

      // după update, citim rândul separat (select standard, fără obiect single)
      const { data: rows, error: fetchErr } = await supabase
        .from('shipping_rates')
        .select('*')
        .eq('id', id)
        .limit(1);

      if (fetchErr) {
        await handleDatabaseError(fetchErr, 'fetch updated shipping rate', retries);
        retries--;
        continue;
      }

      return rows && rows[0] ? rows[0] : null;

    } catch (error) {
      const result = await handleDatabaseError(error, 'update shipping rate', retries);
      if (result === null && retries > 0) {
        retries--;
        continue;
      }
      throw error;
    }
  }
},


  // Calculate shipping cost for cart based on total weight - IMPROVED VERSION
  calculateShippingByWeight: async (totalWeightGrams, countryCode) => {
    try {
      console.log('🚚 Calculating shipping for:', { totalWeightGrams, countryCode });
      
      // Get shipping rates for the specific country
      const { data: countryRates, error: countryError } = await supabase
        .from('shipping_rates')
        .select('*')
        .eq('country_code', countryCode)
        .eq('is_active', true)
        .lte('weight_min_grams', totalWeightGrams)
        .or(`weight_max_grams.is.null,weight_max_grams.gt.${totalWeightGrams}`)
        .order('weight_min_grams', { ascending: false })
        .limit(1);

      let applicableRate = null;
      
      if (!countryError && countryRates && countryRates.length > 0) {
        applicableRate = countryRates[0];
        console.log('✅ Found country-specific rate:', applicableRate);
      } else {
        console.log('⚠️ No country-specific rate found, trying OTHER...');
        
        // Fallback to OTHER country rates
        const { data: otherRates, error: otherError } = await supabase
          .from('shipping_rates')
          .select('*')
          .eq('country_code', 'OTHER')
          .eq('is_active', true)
          .lte('weight_min_grams', totalWeightGrams)
          .or(`weight_max_grams.is.null,weight_max_grams.gt.${totalWeightGrams}`)
          .order('weight_min_grams', { ascending: false })
          .limit(1);

        if (!otherError && otherRates && otherRates.length > 0) {
          applicableRate = otherRates[0];
          console.log('✅ Found OTHER country rate:', applicableRate);
        }
      }

      // Calculate final shipping cost
      const shippingCost = applicableRate ? Number(applicableRate.shipping_cost) : 19.99;
      
      // Generate weight range description
      const weightRange = applicableRate 
        ? `${(applicableRate.weight_min_grams / 1000).toFixed(1)}kg - ${
            applicableRate.weight_max_grams 
              ? (applicableRate.weight_max_grams / 1000).toFixed(1) + 'kg' 
              : '∞'
          }`
        : 'Standard rate';

      // Estimate delivery days based on country
      const estimatedDays = (() => {
        const fastCountries = ['FR', 'DE', 'IT', 'ES', 'BE', 'NL', 'AT', 'PT'];
        const slowCountries = ['CH', 'NO', 'GB'];
        
        if (fastCountries.includes(countryCode)) return { min: 2, max: 5 };
        if (slowCountries.includes(countryCode)) return { min: 3, max: 7 };
        return { min: 3, max: 7 }; // Default for other countries
      })();

      const result = {
        shippingCost,
        currency: applicableRate?.currency || 'EUR',
        weightRange,
        estimatedDays,
        appliedRate: applicableRate,
        debug: {
          totalWeightGrams,
          countryCode,
          rateFound: !!applicableRate,
          rateDetails: applicableRate
        }
      };

      console.log('🚚 Final shipping calculation:', result);
      return result;

    } catch (error) {
      console.error('❌ Error calculating shipping by weight:', error);
      return {
        shippingCost: 19.99,
        currency: 'EUR',
        weightRange: 'Fallback rate',
        estimatedDays: { min: 3, max: 7 },
        error: error.message
      };
    }
  },

  // Calculate shipping for cart items using actual product weights
  calculateCartShipping: async (cartItems, countryCode) => {
    try {
      console.log('🛒 Calculating cart shipping for items:', cartItems.length);
      
      // Calculate total weight from cart items using actual product data
      let totalWeightGrams = 0;
      const itemsWithWeight = [];
      
      for (const item of cartItems) {
        let itemWeight = 500; // Default fallback
        
        // Try to get actual weight from product
        if (item.weightGrams || item.weight_grams) {
          itemWeight = item.weightGrams || item.weight_grams;
        } else if (item.productId) {
          try {
            const { data: product, error } = await supabase
              .from('products')
              .select('weight_grams, name')
              .eq('id', item.productId)
              .single();
            
            if (!error && product && product.weight_grams) {
              itemWeight = product.weight_grams;
              console.log(`📦 Product ${product.name}: ${itemWeight}g`);
            }
          } catch (err) {
            console.warn(`⚠️ Could not fetch weight for product ${item.productId}:`, err);
          }
        }
        
        const itemTotalWeight = itemWeight * item.quantity;
        totalWeightGrams += itemTotalWeight;
        
        itemsWithWeight.push({
          ...item,
          unitWeight: itemWeight,
          totalWeight: itemTotalWeight
        });
      }

      console.log('📊 Cart weight breakdown:', {
        totalWeightGrams,
        totalWeightKg: (totalWeightGrams / 1000).toFixed(2),
        itemsWithWeight: itemsWithWeight.map(i => ({
          name: i.name,
          quantity: i.quantity,
          unitWeight: i.unitWeight,
          totalWeight: i.totalWeight
        }))
      });

      // Calculate shipping cost using updated weight
      const shippingInfo = await shippingRatesApi.calculateShippingByWeight(totalWeightGrams, countryCode);
      
      return {
        ...shippingInfo,
        totalWeightGrams,
        totalWeightKg: (totalWeightGrams / 1000).toFixed(2),
        breakdown: itemsWithWeight
      };
    } catch (error) {
      console.error('❌ Error calculating cart shipping:', error);
      return {
        shippingCost: 19.99,
        currency: 'EUR',
        totalWeightGrams: 1000,
        totalWeightKg: '1.0',
        weightRange: 'Fallback rate',
        estimatedDays: { min: 3, max: 7 }
      };
    }
  }
};
