// src/utils/normalizeProduct.js
// Normalizator unic pt. toate sursele de produse (DB/Admin/API)

const SUPABASE_URL =
  import.meta?.env?.VITE_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  ""; // trebuie setat în .env

function safeJsonParse(maybeJson) {
  if (typeof maybeJson !== "string") return maybeJson;
  try { return JSON.parse(maybeJson); } catch { return maybeJson; }
}

function normalizeImageUrl(x) {
  if (!x) return "";
  if (typeof x === "string") {
    // deja URL absolut?
    if (/^https?:\/\//i.test(x)) return x;
    // path de storage gen: bucket/folder/file.jpg
    if (SUPABASE_URL && !x.startsWith("http")) {
      return `${SUPABASE_URL}/storage/v1/object/public/${x.replace(/^\/+/, "")}`;
    }
    return x;
  }
  if (typeof x === "object") {
    const candidate = x.url || x.publicUrl || x.public_url || x.path || x.src || "";
    return normalizeImageUrl(candidate);
  }
  return "";
}

export function normalizeProduct(raw) {
  const p = { ...(raw || {}) };

  // images: string JSON / array / single
  let images = safeJsonParse(p.images);
  if (!Array.isArray(images)) images = images ? [images] : [];
  images = images.map(normalizeImageUrl).filter(Boolean);

  // dacă n-avem listă, încearcă single image
  if (!images.length) {
    const single = normalizeImageUrl(p.image);
    if (single) images = [single];
  }

  // prima imagine clară (pt. compat și coș)
  const primaryImage = images[0] || normalizeImageUrl(p.image) || "";

  // bullet_points: poate veni ca string JSON
  let bullet_points = safeJsonParse(p.bullet_points);
  if (!Array.isArray(bullet_points)) bullet_points = [];
  bullet_points = bullet_points.map((x) => String(x || "")).filter(Boolean);

  // amazon_links: obiect sau string JSON
  let amazon_links = safeJsonParse(p.amazon_links);
  if (!amazon_links || typeof amazon_links !== "object") amazon_links = {};

  return {
    ...p,
    name: String(p.name || p.title || ""),
    sku: String(p.sku || ""),
    currency: String(p.currency || "EUR"),
    price: Number(p.price || 0),
    sale_price: p.sale_price != null ? Number(p.sale_price) : null,
    images,
    image: primaryImage,        // ✅ important: prima poză reală pentru coș/carduri
    bullet_points,
    amazon_links,
    manage_stock: !!p.manage_stock,
    stock_quantity: Number(p.stock_quantity ?? 0),

    // câteva câmpuri posibile pentru specificații (fallback gol)
    material: p.material ?? "",
    outlet_connection: p.outlet_connection ?? "",
    max_pressure: p.max_pressure ?? "",
    ports: p.ports ?? "",
    manufacturer: p.manufacturer ?? "",
    dimensions: p.dimensions ?? "",
    description: p.description ?? "",
  };
}
