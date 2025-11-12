// FILE: src/config/api/products.js
import { supabase } from '../supabase';
import { handleDatabaseError, checkTablesExist } from './health';

// Small helpers for sessionStorage cache
const SS_KEY_ALL = 'products_all_v1';

const readCache = (key) => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCache = (key, val) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(val));
  } catch {}
};

const TABLE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let tableCheckCache = { ok: true, ts: 0 };

const ensureTablesExist = async () => {
  const now = Date.now();
  if (tableCheckCache.ts && now - tableCheckCache.ts < TABLE_TTL_MS) {
    return tableCheckCache.ok;
  }

  const checks = await checkTablesExist();
  const ok = Object.values(checks).every(Boolean);
  tableCheckCache = { ok, ts: now };
  return ok;
};

export const productsApi = {
  /**
   * Get all products.
   * - `filters.light === true` -> fetch minimal fields for faster listing
   * - `opts.signal` -> AbortController.signal to cancel the request
   * - stale-while-revalidate cache for the no-filter case
   */
  getAll: async (filters = {}, opts = {}) => {
    const { signal, force = false } = opts;

    // Cache only when no filters are applied
    const cacheable = !filters || Object.keys(filters).length === 0;

    // 1) Serve from sessionStorage immediately, then refresh in background
    if (cacheable && !force) {
      const cached = readCache(SS_KEY_ALL);
      if (cached) {
        // Background refresh without blocking UI
        setTimeout(() => {
          productsApi.getAll({}, { force: true }).catch(() => {});
        }, 0);
        return cached;
      }
    }

    let retries = 2;
    while (retries >= 0) {
      try {
        const tablesReady = await ensureTablesExist();
        if (!tablesReady) {
          throw new Error('Products table does not exist or is unavailable. Please run database migrations.');
        }

        // Choose a light projection for listings if requested
        const LIGHT_SELECT = `
          id, name, slug, sku, price, sale_price, currency, weight_grams,
          images, stock_quantity, manage_stock, rating, review_count,
          categories(id, name, slug),
          product_images(image_url, alt_text, is_primary, sort_order)
        `;

        const FULL_SELECT = `
          id, name, slug, sku, description, price, sale_price, currency, weight_grams, dimensions,
          specifications, features, bullet_points, amazon_links, stock_quantity, stock_status,
          manage_stock, rating, review_count, is_featured, is_active, meta_title, meta_description,
          created_at, updated_at,
          images,
          categories(id, name, slug),
          product_images(image_url, alt_text, is_primary, sort_order)
        `;

        const useLight = filters?.light === true;

        let query = supabase
          .from('products')
          .select(useLight ? LIGHT_SELECT : FULL_SELECT)
          .eq('is_active', true);

        // Attach abort signal if supported (Supabase JS v2)
        if (signal && typeof query.abortSignal === 'function') {
          query = query.abortSignal(signal);
        }

        // Category filtering (slug or name)
        if (filters.category && filters.category !== 'All Categories') {
          try {
            const { data: categoryBySlug } = await supabase
              .from('categories')
              .select('id')
              .eq('slug', String(filters.category).toLowerCase())
              .single();
            if (categoryBySlug?.id) {
              query = query.eq('category_id', categoryBySlug.id);
            } else {
              const { data: categoryByName } = await supabase
                .from('categories')
                .select('id')
                .eq('name', String(filters.category))
                .single();
              if (categoryByName?.id) {
                query = query.eq('category_id', categoryByName.id);
              }
            }
          } catch {
            // ignore if category not found
          }
        }

        // Search
        if (filters.search) {
          const s = String(filters.search);
          query = query.or(
            `name.ilike.%${s}%,sku.ilike.%${s}%,description.ilike.%${s}%`
          );
        }

        // Sorting
        switch (filters.sortBy) {
          case 'price-low':
            query = query.order('price', { ascending: true });
            break;
          case 'price-high':
            query = query.order('price', { ascending: false });
            break;
          case 'rating':
            query = query.order('rating', { ascending: false });
            break;
          case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
          default:
            query = query.order('name', { ascending: true });
            break;
        }

        const { data, error } = await query;
        if (error) {
          await handleDatabaseError(error, 'get products', retries);
          retries--;
          continue;
        }

        const mapped = (data || []).map((p) => {
          const imgsFromJson = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
          const imgsFromRel = (p.product_images || [])
            .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999))
            .map((x) => x.image_url)
            .filter(Boolean);

          const images = imgsFromJson.length > 0 ? imgsFromJson : imgsFromRel;
          const thumb =
            images[0] ||
            'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400';

          return {
            ...p,
            images,
            image: thumb,
            inStock: (p.stock_quantity || 0) > 0,
            category: p.categories?.name || 'Uncategorized',
            categorySlug: p.categories?.slug || '',
          };
        });

        // 2) Write-through cache for base list (no filters)
        if (cacheable) writeCache(SS_KEY_ALL, mapped);

        return mapped;
      } catch (error) {
        const result = await handleDatabaseError(error, 'get products', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  getById: async (id, opts = {}) => {
    const { signal } = opts;
    let retries = 2;
    while (retries >= 0) {
      try {
        let query = supabase
          .from('products')
          .select(`
            id, name, slug, sku, description, price, sale_price, currency, weight_grams, dimensions,
            specifications, features, bullet_points, amazon_links, stock_quantity, stock_status,
            manage_stock, rating, review_count, is_featured, is_active, meta_title, meta_description,
            created_at, updated_at,
            images,
            categories(id, name, slug),
            product_images(image_url, alt_text, is_primary, sort_order),
            product_variants(*)
          `)
          .eq('id', id)
          .eq('is_active', true)
          .single();

        if (signal && typeof query.abortSignal === 'function') {
          query = query.abortSignal(signal);
        }

        const { data, error } = await query;
        if (error) {
          await handleDatabaseError(error, 'get product by id', retries);
          retries--;
          continue;
        }

        const imgsFromJson = Array.isArray(data.images) ? data.images.filter(Boolean) : [];
        const imgsFromRel = (data.product_images || [])
          .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999))
          .map((x) => x.image_url)
          .filter(Boolean);
        const images = imgsFromJson.length > 0 ? imgsFromJson : imgsFromRel;

        return {
          ...data,
          images,
          bulletPoints: data.bullet_points || [],
          amazonLinks: data.amazon_links || {},
          variants: data.product_variants || [],
          inStock: (data.stock_quantity || 0) > 0,
          category: data.categories?.name || 'Uncategorized',
          categorySlug: data.categories?.slug || '',
        };
      } catch (error) {
        const result = await handleDatabaseError(error, 'get product by id', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  getByCategory: async (categorySlug, opts = {}) => {
    const { signal } = opts;
    let retries = 2;
    while (retries >= 0) {
      try {
        // Fetch category id by slug
        let catQuery = supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .single();

        if (signal && typeof catQuery.abortSignal === 'function') {
          catQuery = catQuery.abortSignal(signal);
        }

        const { data: category, error: categoryError } = await catQuery;
        if (categoryError) {
          await handleDatabaseError(categoryError, 'get category for products', retries);
          retries--;
          continue;
        }

        if (!category) {
          return [];
        }

        let query = supabase
          .from('products')
          .select(`
            id, name, slug, sku, description, price, sale_price, currency, weight_grams,
            images, stock_quantity, manage_stock, rating, review_count,
            categories(id, name, slug)
          `)
          .eq('category_id', category.id)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (signal && typeof query.abortSignal === 'function') {
          query = query.abortSignal(signal);
        }

        const { data, error } = await query;
        if (error) {
          await handleDatabaseError(error, 'get products by category', retries);
          retries--;
          continue;
        }

        return (data || []).map((p) => {
          const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
          const thumb =
            images[0] ||
            'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400';

          return {
            ...p,
            images,
            image: thumb,
            inStock: (p.stock_quantity || 0) > 0,
            category: p.categories?.name || 'Uncategorized',
            categorySlug: p.categories?.slug || '',
          };
        });
      } catch (error) {
        const result = await handleDatabaseError(error, 'get products by category', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  search: async (searchTerm, opts = {}) => {
    const { signal } = opts;
    let retries = 2;
    while (retries >= 0) {
      try {
        let query = supabase
          .from('products')
          .select(`
            id, name, slug, sku, description, price, sale_price, currency,
            images, stock_quantity, manage_stock, rating, review_count,
            categories(id, name, slug)
          `)
          .eq('is_active', true)
          .or(
            `name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
          )
          .order('name', { ascending: true });

        if (signal && typeof query.abortSignal === 'function') {
          query = query.abortSignal(signal);
        }

        const { data, error } = await query;
        if (error) {
          await handleDatabaseError(error, 'search products', retries);
          retries--;
          continue;
        }

        return (data || []).map((p) => {
          const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
          const thumb =
            images[0] ||
            'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400';

          return {
            ...p,
            images,
            image: thumb,
            inStock: (p.stock_quantity || 0) > 0,
            category: p.categories?.name || 'Uncategorized',
            categorySlug: p.categories?.slug || '',
          };
        });
      } catch (error) {
        const result = await handleDatabaseError(error, 'search products', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },

  getFeatured: async (opts = {}) => {
    const { signal } = opts;
    let retries = 2;
    while (retries >= 0) {
      try {
        let query = supabase
          .from('products')
          .select(`
            id, name, slug, sku, description, price, sale_price, currency,
            images, stock_quantity, manage_stock, rating, review_count,
            categories(id, name, slug)
          `)
          .eq('is_active', true)
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (signal && typeof query.abortSignal === 'function') {
          query = query.abortSignal(signal);
        }

        const { data, error } = await query;
        if (error) {
          await handleDatabaseError(error, 'get featured products', retries);
          retries--;
          continue;
        }

        return (data || []).map((p) => {
          const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
          const thumb =
            images[0] ||
            'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400';

          return {
            ...p,
            images,
            image: thumb,
            inStock: (p.stock_quantity || 0) > 0,
            category: p.categories?.name || 'Uncategorized',
            categorySlug: p.categories?.slug || '',
          };
        });
      } catch (error) {
        const result = await handleDatabaseError(error, 'get featured products', retries);
        if (result === null && retries > 0) {
          retries--;
          continue;
        }
        throw error;
      }
    }
  },
};
