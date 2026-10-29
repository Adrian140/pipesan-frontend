export const placeholderImage = '/product-placeholder.svg';
export function safeUrl(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; }
  catch { return ''; }
}
export function normalizeProduct(row) {
  const images = (Array.isArray(row.images) ? row.images : []).map(x => safeUrl(typeof x === 'string' ? x : x?.url)).filter(Boolean);
  const stock = Number(row.stock_quantity ?? row.stock ?? 0);
  const price = row.price == null || row.price === '' ? NaN : Number(row.price);
  const sale = row.sale_price == null ? null : Number(row.sale_price);
  return {
    ...row, name: row.name || '', sku: row.sku || '', price,
    salePrice: Number.isFinite(sale) && sale >= 0 && sale < price ? sale : null,
    currency: row.currency || 'EUR', images: images.length ? images : [placeholderImage], image: images[0] || placeholderImage,
    category: row.categories?.name || '', categorySlug: row.categories?.slug || '',
    inStock: Number.isFinite(price) && price >= 0 && row.is_active !== false && row.is_draft !== true && row.in_stock !== false && row.stock_status !== 'out_of_stock' && (row.manage_stock === false || stock > 0),
    stockCount: stock, rating: Number(row.avg_rating ?? row.rating ?? 0), reviewCount: Number(row.total_reviews ?? row.review_count ?? 0),
    amazonLinks: Object.fromEntries(Object.entries(row.amazon_links || {}).map(([k,v]) => [k.toUpperCase(),safeUrl(v)]).filter(([,v]) => v)),
    variants: [], specifications: row.specifications || {},
  };
}
export const productPrice = product => product.salePrice ?? product.price;
export function filterProducts(products, filters) {
  const search = (filters.search || '').trim().toLocaleLowerCase();
  const result = products.filter(p => (!search || `${p.name} ${p.sku}`.toLocaleLowerCase().includes(search)) &&
    (!filters.category || p.categorySlug === filters.category || p.category_id === filters.category) &&
    (!filters.inStock || p.inStock) && productPrice(p) >= (filters.priceRange?.[0] ?? 0) && productPrice(p) <= (filters.priceRange?.[1] ?? Infinity));
  return result.sort((a,b) => {
    switch(filters.sortBy) {
      case 'price-low': return productPrice(a)-productPrice(b);
      case 'price-high': return productPrice(b)-productPrice(a);
      case 'rating': return b.rating-a.rating;
      case 'newest': return Date.parse(b.created_at || 0)-Date.parse(a.created_at || 0);
      default: return a.name.localeCompare(b.name);
    }
  });
}
