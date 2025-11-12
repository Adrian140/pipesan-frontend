// Main API client that exports all modules
import { authApi } from './auth';
import { userApi } from './user';
import { productsApi } from './products';
import { categoriesApi } from './categories';
import { cartApi } from './cart';
import { addressesApi } from './addresses';
import { billingProfilesApi } from './billingProfiles';
import { invoicesApi } from './invoices';
import { ordersApi } from './orders';
import { adminApi } from './admin';
import { healthCheck } from './health';
import { shippingRatesApi } from './shippingRates';
import { vatApi } from './vat';
import { reviewsApi } from './reviews';
// --- lightweight in-memory caching layer for products ---
const _mem = {
  byId: new Map(),      // key: id -> { at:number, data:any }
  lists: new Map(),     // key: JSON.stringify({search,category,sortBy}) -> { at, data }
  ttl: 60 * 1000,       // 60s
};
const _get = (m, k) => {
  const hit = m.get(k);
  if (!hit) return null;
  if (Date.now() - hit.at > _mem.ttl) {
    m.delete(k);
    return null;
  }
  return hit.data;
};
const _set = (m, k, data) => m.set(k, { at: Date.now(), data });

const cachedProductsApi = {
  ...productsApi,
  async getById(id) {
    const key = String(id);
    const cached = _get(_mem.byId, key);
    if (cached) return cached;
    const data = await productsApi.getById(id);
    _set(_mem.byId, key, data);
    return data;
  },
  async getAll(params = {}) {
    // params: { search, category, sortBy, ... } – folosește-le în cheie
    const key = JSON.stringify({
      search: params.search || '',
      category: params.category || '',
      sortBy: params.sortBy || 'name',
    });
    const cached = _get(_mem.lists, key);
    if (cached) return cached;
    const data = await productsApi.getAll(params);
    _set(_mem.lists, key, data);
    return data;
  },
};
export const apiClient = {
  healthCheck,
  auth: authApi,
  user: userApi,
 products: cachedProductsApi,
  categories: categoriesApi,
  cart: cartApi,
  addresses: addressesApi,
  billingProfiles: billingProfilesApi,
  invoices: invoicesApi,
  orders: ordersApi,
  admin: adminApi,
  shippingRates: shippingRatesApi,
  vat: vatApi,
  reviews: reviewsApi,
};
