// FILE: src/config/supabase.js
import { createClient } from "@supabase/supabase-js";

/* =========================
   Env & validation
   ========================= */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const redact = (s, keep = 6) => (s ? `${s.slice(0, keep)}…(redacted)` : "MISSING");
const isValidUrl = (u) => {
  try {
    const x = new URL(u);
    return x.protocol === "https:" && /supabase\.co$/.test(x.hostname);
  } catch {
    return false;
  }
};

console.log("Supabase Config Check:", {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlPrefix: supabaseUrl ? `${supabaseUrl.substring(0, 30)}…` : "MISSING",
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase config missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}
if (!isValidUrl(supabaseUrl)) {
  console.warn("[supabase] URL looks unusual:", redact(supabaseUrl, 30));
}

/* =========================
   Supabase client
   ========================= */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: { schema: "public" },
  global: {
    headers: {
      apikey: supabaseAnonKey,                 // redundant but fine
      "X-Client-Info": "pipesan-admin@1.0.0",  // useful in Supabase logs
    },
  },
});

/* =========================
   Error helper + small retry
   ========================= */
const pgErr = (err) => {
  if (!err) return "Unknown error";
  const { code, message, details, hint } = err;
  return `[${code ?? "?"}] ${message}${
    details ? ` — ${details}` : ""
  }${hint ? ` (hint: ${hint})` : ""}`;
};

// Optional: exponential backoff retry for transient 429/5xx
export async function withRetry(fn, { tries = 3, baseMs = 250 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, baseMs * Math.pow(2, i)));
  }
  throw lastErr;
}

/* =========================
   Connection test
   ========================= */
export const testDatabaseConnection = async () => {
  try {
    console.log("Testing database connection...");
    // Use head + count; avoids selecting a non-existent 'count' column
    const { count, error } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true });

    if (error) {
      console.error("DB connection test failed:", pgErr(error));
      return { success: false, error: pgErr(error) };
    }
    console.log("DB connection OK. Users count (may be null due to RLS):", count ?? "n/a");
    return { success: true, count };
  } catch (err) {
    console.error("DB connection error:", err);
    return { success: false, error: err.message };
  }
};

/* =========================
   Table existence check
   ========================= */
export const checkTablesExist = async () => {
  const requiredTables = ["users", "products", "categories", "orders", "content"];
  const results = {};
  for (const table of requiredTables) {
    try {
      // HEAD request pattern; if table exists you'll get 200 even with RLS
      const { error, status } = await supabase
        .from(table)
        .select("id", { head: true, count: "estimated" })
        .limit(1);

      results[table] = !error && status === 200;
      if (error) console.warn(`Table ${table} check:`, pgErr(error));
    } catch (err) {
      console.error(`Error checking table ${table}:`, err);
      results[table] = false;
    }
  }
  return results;
};

/* =========================
   Storage helpers
   ========================= */
const PRODUCT_BUCKET = "product-images";
const DOCUMENTS_BUCKET = "documents";

const safeName = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200); // keep keys reasonable

const extOf = (filename = "") =>
  filename.includes(".") ? filename.split(".").pop().toLowerCase() : "";

/** Public URL from storage path */
export function getPublicUrl(bucket, path) {
  if (!bucket || !path) return "";
  const { data, error } = supabase.storage.from(bucket).getPublicUrl(path);
  if (error) {
    console.warn("[storage] getPublicUrl error:", pgErr(error));
    return "";
  }
  return data?.publicUrl || "";
}

/** Signed URL from storage path (private buckets) */
export async function getSignedUrl(bucket, path, expiresInSec = 3600) {
  if (!bucket || !path) throw new Error("Missing bucket/path");
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSec);
  if (error) throw new Error(pgErr(error));
  return data?.signedUrl || "";
}

/** Extract relative path from a public URL (handles region/CDN variants) */
export function pathFromPublicUrl(publicUrl, bucket = PRODUCT_BUCKET) {
  if (!publicUrl) return "";
  try {
    const u = new URL(publicUrl);
    const marker = `/object/public/${bucket}/`;
    const idx = u.pathname.indexOf(marker);
    if (idx >= 0) return decodeURIComponent(u.pathname.slice(idx + marker.length));
    // Fallbacks (older formats or CDN rewrites)
    const parts = u.pathname.split(`/${bucket}/`);
    if (parts.length > 1) return decodeURIComponent(parts[1]);
    return "";
  } catch {
    const parts = String(publicUrl).split(`/${bucket}/`);
    return parts[1] || "";
  }
}

/* =========================
   Image upload (PUBLIC)
   ========================= */
export async function uploadProductImage(file, productId, bucket = PRODUCT_BUCKET) {
  if (!file) throw new Error("Missing file");
  if (!productId) throw new Error("Missing productId");

  const ext = extOf(file.name) || "bin";
  const base = safeName(file.name.replace(/\.[^.]+$/, "") || "file");
  const name = `${Date.now()}-${base}.${ext}`;
  const path = `${safeName(productId)}/${name}`;

  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: false, // filenames are unique by timestamp
      contentType: file.type || (ext ? `image/${ext}` : "application/octet-stream"),
      cacheControl: "3600",
    });
  if (upErr) throw new Error(pgErr(upErr));

  return getPublicUrl(bucket, path);
}

export async function uploadProductImages(files, productId, bucket = PRODUCT_BUCKET) {
  const out = [];
  for (const f of Array.from(files || [])) {
    const url = await uploadProductImage(f, productId, bucket);
    out.push(url);
  }
  return out;
}

export async function deleteImage(publicUrl, bucket = PRODUCT_BUCKET) {
  const path = pathFromPublicUrl(publicUrl, bucket);
  if (!path) return;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(pgErr(error));
}

/* =========================
   Documents (PRIVATE)
   ========================= */
export async function uploadDocument(file, documentId, bucket = DOCUMENTS_BUCKET) {
  if (!file) throw new Error("Missing file");
  if (!documentId) throw new Error("Missing documentId");

  const ext = extOf(file.name) || "bin";
  const base = safeName(file.name.replace(/\.[^.]+$/, "") || "document");
  const name = `${Date.now()}-${base}.${ext}`;
  const path = `${safeName(documentId)}/${name}`;

  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: false,
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
    });

  if (upErr) throw new Error(pgErr(upErr));
  return await getSignedUrl(bucket, path, 3600);
}

/* =========================
   DevTools (optional)
   ========================= */
if (typeof window !== "undefined") {
  window.supabase = supabase;
  window.testDatabaseConnection = testDatabaseConnection;
  window.checkTablesExist = checkTablesExist;
}
