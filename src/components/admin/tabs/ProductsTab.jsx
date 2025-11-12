import React, { useMemo, useRef, useState, useEffect } from "react";
import { Plus, Trash2, X, CheckCircle, FileImage, Upload } from "lucide-react";
import { uploadProductImage, deleteImage } from "../../../config/supabase";
import { apiClient } from "../../../config/api";

const COUNTRY_KEYS = ["FR","DE","IT","ES","BE","NL","PL","SE","UK","OTHER"];
// Limbi pentru editor (FR = baza)
const SUPPORTED_LOCALES = [
  { code: 'FR', label: 'Français',  flag: '🇫🇷' },
  { code: 'EN', label: 'English',   flag: '🇬🇧' },
  { code: 'IT', label: 'Italiano',  flag: '🇮🇹' },
  { code: 'DE', label: 'Deutsch',   flag: '🇩🇪' },
  { code: 'ES', label: 'Español',   flag: '🇪🇸' },
  { code: 'RO', label: 'Română',    flag: '🇷🇴' },
];

// Șablon pentru o traducere
const emptyT = () => ({
  name: '',
  description: '',
  dimensions: '',
  bullets: ['', '', '', '', ''],
  category_label: '', // eticheta traducerii pentru categorie (id-ul rămâne global)
});

const emptyForm = {
  name: "",        // compat: FR implicit
  sku: "",
  price: "",
  currency: "EUR",
  description: "", // compat: FR
  dimensions: "",  // compat: FR
  weightGrams: 500,
  categoryId: "",
  bullet_points: ["", "", "", "", ""], // compat: FR
  translations: {},  
  amazon_links: COUNTRY_KEYS.reduce((acc, k) => ({ ...acc, [k]: "" }), {}),
  local_stock: false,
  stock_qty: 0,
  images: [],
};

const emptyCategory = {
  name: "",
  slug: "",
  description: "",
  sortOrder: 0
};

// slugify local
function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
}
function ensureSlug(name, sku, fallback) {
  const n = slugify(name || '');
  if (n) return n;
  const s = slugify(String(sku || ''));
  if (s) return s;
  return `draft-${fallback || Date.now()}`;
}

function countryLabel(code) {
  const labels = { FR:"FR", DE:"DE", IT:"IT", ES:"ES", BE:"BE", NL:"NL", PL:"PL", SE:"SE", UK:"UK", OTHER:"Other" };
  return labels[code] || code;
}

function getFlag(code) {
  const flags = { FR:'🇫🇷', DE:'🇩🇪', IT:'🇮🇹', ES:'🇪🇸', BE:'🇧🇪', NL:'🇳🇱', PL:'🇵🇱', SE:'🇸🇪', UK:'🇬🇧', OTHER:'🌍' };
  return flags[code] || '🌍';
}

// normalizează cheile de limbă (fr/de/en -> FR/DE/EN)
function normalizeTranslations(trs = {}) {
  const out = {};
  Object.entries(trs || {}).forEach(([k, v]) => {
    out[String(k || '').toUpperCase()] = v || {};
  });
  return out;
}

// obține blocul de traducere pentru un produs + limbă, cu fallback corect
function getProductTranslation(p, code) {
  const C = String(code || 'FR').toUpperCase();
  const trs = normalizeTranslations(p.translations || {});
  const tx = trs[C];

  if (C === 'FR') {
    // FR: folosește câmpurile legacy ca fallback
    return {
      name: tx?.name ?? p.name ?? '',
      description: tx?.description ?? p.description ?? '',
      dimensions: tx?.dimensions ?? p.dimensions ?? '',
      bullets: Array.isArray(tx?.bullets) ? tx.bullets : (p.bullet_points || []),
      category_label: tx?.category_label ?? '',
    };
  }
  return tx || null;
}

// titlul vizibil în tabel în funcție de limbă
function getDisplayTitle(p, code) {
  const C = String(code || 'FR').toUpperCase();
  const tx = getProductTranslation(p, C);
  if (tx?.name?.trim()) return tx.name.trim();
  // fallback: FR -> p.name, altfel FR din translations, apoi 'Untitled Draft'
  if (C === 'FR' && p?.name) return p.name;
  const frTx = getProductTranslation(p, 'FR');
  return frTx?.name?.trim() || 'Untitled Draft';
}

export default function ProductsTab({
  products = [],
  handleSave,
  handleDelete,
  pageLoading = false,
  actionLoading = false,
  message,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [categories, setCategories] = useState([]);
  const fileInputRef = useRef(null);
  const [isDraft, setIsDraft] = useState(true);
const [currentLocale, setCurrentLocale] = useState('FR');

const getT = (code = currentLocale) => {
  const tx = form.translations?.[code];
  if (code === 'FR') {
    if (tx) return tx;
    // compat: FR citește din câmpurile legacy dacă nu există încă translations.FR
    return {
      name: form.name || '',
      description: form.description || '',
      dimensions: form.dimensions || '',
      bullets: Array.isArray(form.bullet_points) ? [...form.bullet_points] : ['', '', '', '', ''],
      category_label: '',
    };
  }
  // pentru celelalte limbi: primele vizite sunt goale (nu prepopulăm cu FR)
  return tx || emptyT();
};
const isEmptyT = (t) =>
  !t?.name?.trim() &&
  !t?.description?.trim() &&
  !t?.dimensions?.trim() &&
  (!Array.isArray(t?.bullets) || t.bullets.every(b => !b?.trim())) &&
  !t?.category_label?.trim();

const pruneTranslations = (trs = {}) => {
  const out = {};
  for (const [k, v] of Object.entries(trs)) {
    if (!isEmptyT(v)) out[k] = v;
  }
  return out;
};

// scrie patch în traducerea pentru o limbă
const setT = (code, patch) => {
  setForm(f => {
    const base = f.translations?.[code] || emptyT();
    const next = { ...base, ...patch };

    const updates = {
      translations: { ...(f.translations || {}), [code]: next },
    };

    // dacă edităm FR, menținem compatibilitatea cu câmpurile legacy
    if (code === 'FR') {
      updates.name = patch.name ?? f.name;
      updates.description = patch.description ?? f.description;
      updates.dimensions = patch.dimensions ?? f.dimensions;
      updates.bullet_points = patch.bullets ?? f.bullet_points;
    }

    return { ...f, ...updates };
  });
};

  // Category creation states
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ ...emptyCategory });
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryMessage, setCategoryMessage] = useState('');

  const isEdit = useMemo(() => Boolean(editingId), [editingId]);

  // Fetch categories when component mounts
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await apiClient.categories.getAll();
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const startCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setSelectedFiles([]);
    setShowForm(true);
    setCurrentLocale('FR');
    setShowCategoryForm(false);
    setIsDraft(true); // Start as draft
  };

  const startEdit = (p) => {
    setEditingId(p.id);
  const frSeed = {
    name: p.name || '',
    description: p.description || '',
    dimensions: p.dimensions || '',
    bullets: Array.isArray(p.bullet_points) ? [...p.bullet_points].slice(0,5) : ['', '', '', '', ''],
    category_label: '',
  };
  setForm({
    price: p.price ?? "",
    sku: p.sku || "",
    currency: p.currency || "EUR",
    description: frSeed.description,
    dimensions: frSeed.dimensions,
    weightGrams: p.weight_grams || 500,
    categoryId: p.category_id || "",
    bullet_points: frSeed.bullets,
    translations: { FR: frSeed, ...normalizeTranslations(p.translations || {}) },
    amazon_links: { ...COUNTRY_KEYS.reduce((a,k)=>({ ...a, [k]: "" }), {}), ...(p.amazon_links || {}) },
    local_stock: Boolean(p.manage_stock),
    stock_qty: p.stock_quantity ?? 0,
    images: Array.isArray(p.images) ? p.images : [],
  });
    setSelectedFiles([]);
    setShowForm(true);
    setCurrentLocale('FR');
    setShowCategoryForm(false);
    setIsDraft(p.is_draft || false);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setSelectedFiles([]);
    setShowCategoryForm(false);
    setCategoryForm({ ...emptyCategory });
    setCategoryMessage('');
    setIsDraft(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onBulletChange = (i, v) =>
    setForm((f) => {
      const bp = [...f.bullet_points];
      bp[i] = v;
      return { ...f, bullet_points: bp };
    });

  const onAmazonLinkChange = (code, v) =>
    setForm((f) => ({ ...f, amazon_links: { ...f.amazon_links, [code]: v } }));

  // Category creation handlers
  const handleCategoryChange = (key, value) => {
    setCategoryForm(prev => ({
      ...prev,
      [key]: value,
      ...(key === 'name' ? { slug: slugify(value) } : {})
    }));
  };

  const saveNewCategory = async () => {
    if (!categoryForm.name.trim()) {
      setCategoryMessage('Category name is required');
      return;
    }

    setSavingCategory(true);
    setCategoryMessage('');

    try {
      const newCategory = await apiClient.admin.createCategory({
        name: categoryForm.name.trim(),
        slug: categoryForm.slug || slugify(categoryForm.name),
        description: categoryForm.description.trim(),
        sortOrder: parseInt(categoryForm.sortOrder) || 0
      });

      // Update categories list
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);

      // Select the new category in the product form
      setForm(prev => ({ ...prev, categoryId: newCategory.id }));

      // Close category form
      setShowCategoryForm(false);
      setCategoryForm({ ...emptyCategory });
      setCategoryMessage('');

    } catch (error) {
      console.error('Error creating category:', error);
      setCategoryMessage('Error creating category: ' + (error.message || 'Unknown error'));
    } finally {
      setSavingCategory(false);
    }
  };

  const handleCategorySelection = (value) => {
    if (value === 'create-new') {
      setShowCategoryForm(true);
      setCategoryForm({ ...emptyCategory });
      setCategoryMessage('');
    } else {
      setShowCategoryForm(false);
      onChange('categoryId', value);
    }
  };

  // ✅ NEW: Create draft immediately for image uploads (no validation required)
  const createDraftProduct = async () => {
    if (editingId) return editingId; // Already exists

    setBusy(true);
    try {
      console.log('🎨 Creating draft product for image uploads...');
      
      // Create minimal draft with no validation
      const { data: draftProduct, error } = await apiClient.admin.createProduct({
        name: `Draft Product ${Date.now()}`,
        sku: `DRAFT-${Date.now()}`,
        slug: `draft-${Date.now()}`,
        price: 0,
        currency: 'EUR',
        weight_grams: 500,
        is_active: false,
          is_draft: true,
        images: [],
        bullet_points: [],
        amazon_links: {}
      });

      if (error) {
        console.error('❌ Error creating draft:', error);
        throw new Error('Could not create draft product');
      }

      const productId = draftProduct?.id || draftProduct?.data?.id;
      if (!productId) {
        throw new Error('No product ID returned from draft creation');
      }

      setEditingId(productId);
      console.log('✅ Draft product created with ID:', productId);
      return productId;

    } catch (error) {
      console.error('❌ Draft creation failed:', error);
      alert('Error creating draft product: ' + (error.message || 'Unknown error'));
      return null;
    } finally {
      setBusy(false);
    }
  };

  // ✅ IMPROVED: Upload images anytime (no validation required)
  const attachSelectedImages = async () => {
    if (!selectedFiles.length) return;

    const current = form.images?.length || 0;
    if (current + selectedFiles.length > 4) {
      alert("Maximum 4 images per product.");
      return;
    }

    setBusy(true);
    try {
      console.log('🖼️ Starting image upload process...');
      
      // Create or get draft product for images
      let productId = editingId;
      if (!productId) {
        productId = await createDraftProduct();
        if (!productId) return;
      }

      console.log('📸 Uploading images to product ID:', productId);
      const uploaded = [];
      for (const f of selectedFiles) {
        console.log('📤 Uploading:', f.name, 'Size:', f.size, 'Type:', f.type);
        const url = await uploadProductImage(f, productId);
        console.log('✅ Uploaded successfully:', url);
        uploaded.push(url);
      }
      
      const allImages = [...(form.images || []), ...uploaded];
      const uniqueImages = Array.from(new Set(allImages));

      // Update product with new images
      await handleSave({ id: productId, images: uniqueImages }, "products");
      setForm((f) => ({ ...f, images: uniqueImages }));
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      console.log('🎉 Images attached successfully:', uniqueImages.length, 'total images');
    } catch (e) {
      console.error('❌ Image upload error:', e);
      alert(e?.message || "Image upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const removeImageUrl = async (url) => {
    const next = (form.images || []).filter((u) => u !== url);
    setForm((f) => ({ ...f, images: next }));
    try {
      if (editingId) {
        await handleSave({ id: editingId, images: next }, "products");
      }
      await deleteImage(url, "product-images");
    } catch (error) {
      console.warn('Error removing image:', error);
    }
  };

// ✅ FULL validation for publish
const validateForPublish = () => {
  const frT = form.translations?.FR || {
    name: form.name?.trim(),
    description: form.description?.trim(),
    dimensions: form.dimensions?.trim(),
    bullets: Array.isArray(form.bullet_points) ? form.bullet_points : [],
  };

  const priceNum = Number(String(form.price ?? '').replace(',', '.'));

  if (!frT?.name?.trim()) return "Titlul în FR este obligatoriu (FR este fallback-ul default).";
  if (!String(form.sku || '').trim()) return "SKU este obligatoriu.";
  if (!String(form.price ?? '').trim() || isNaN(priceNum)) return "Prețul trebuie să fie numeric.";
  if (!form.categoryId && !showCategoryForm) return "Selectează o categorie.";
  if (!form.weightGrams || isNaN(Number(form.weightGrams)) || Number(form.weightGrams) <= 0) return "Greutatea trebuie să fie > 0.";
  if ((form.images?.length || 0) < 1) return "Atașează cel puțin o imagine.";
  return null;
};



  // ✅ MINIMAL validation for draft
  const validateForDraft = () => {
    // No validation required for draft - can save incomplete products
    return null;
  };

  // ✅ NEW: Save as draft (minimal validation)
  const saveDraft = async () => {
    const err = validateForDraft();
    if (err) {
      alert(err);
      return;
    }
    
    setBusy(true);
    try {
      console.log('💾 Saving as draft...');
      
      const frT = form.translations?.FR || {
  name: form.name?.trim() || `Draft Product ${Date.now()}`,
  description: form.description?.trim() || "",
  dimensions: form.dimensions?.trim() || "",
  bullets: Array.isArray(form.bullet_points) ? form.bullet_points : [],
};

const payload = {
  name: (frT.name || `Draft Product ${Date.now()}`).trim(),
  slug: (frT.name ? slugify(frT.name) : `draft-${Date.now()}`),
  sku: String(form.sku || '').trim() || `DRAFT-${Date.now()}`,
  price: Number(String(form.price).replace(',', '.')) || 0,
  currency: form.currency || "EUR",
  description: frT.description || "",
  dimensions: frT.dimensions || "",
  weight_grams: parseInt(form.weightGrams) || 500,
  category_id: form.categoryId || null,
  manage_stock: !!form.local_stock,
  stock_quantity: Number(form.stock_qty || 0),
  bullet_points: (frT.bullets || []).map(s => (s || '').trim()).filter(Boolean),
  amazon_links: Object.fromEntries(
    Object.entries(form.amazon_links).filter(([_, url]) => url && url.trim())
  ),
  images: form.images || [],
  translations: pruneTranslations(form.translations || {}),
  is_active: false,
  is_draft: true,
  created_by_admin: true,
};


      if (editingId) {
        await handleSave({ id: editingId, ...payload }, "products");
        alert("Draft saved successfully!");
      } else {
        const created = await handleSave(payload, "products");
        const pid = (created?.data ?? created)?.id;
        if (pid) setEditingId(pid);
        alert("Draft created successfully!");
      }

    } catch (e) {
      console.error('❌ Draft save error:', e);
      alert(e?.message || "Failed to save draft.");
    } finally {
      setBusy(false);
    }
  };

const publishProduct = async () => {
  const err = validateForPublish();
  if (err) { alert(err); return; }
  setBusy(true);
  try {
    console.log('🚀 Publishing product...');
    const frT = form.translations?.FR || {
      name: form.name?.trim(),
      description: form.description?.trim(),
      dimensions: form.dimensions?.trim(),
      bullets: Array.isArray(form.bullet_points) ? form.bullet_points : [],
    };

    const payload = {
      name: (frT.name || '').trim(),
      slug: ensureSlug(frT.name, form.sku, editingId),
      sku: String(form.sku || '').trim(),
      price: Number(String(form.price ?? '').replace(',', '.')),
      currency: form.currency || "EUR",
      description: frT.description || "",
      dimensions: frT.dimensions || "",
      weight_grams: parseInt(form.weightGrams) || 500,
      category_id: form.categoryId || null,
      manage_stock: !!form.local_stock,
      stock_quantity: Number(form.stock_qty || 0),
      bullet_points: (frT.bullets || []).map(s => (s || '').trim()).filter(Boolean),
      amazon_links: Object.fromEntries(
        Object.entries(form.amazon_links).filter(([_, url]) => url && url.trim())
      ),
      images: form.images || [],
      translations: pruneTranslations(form.translations || {}),
      is_active: true,
      is_draft: false,
      created_by_admin: true,
    };

    if (editingId) {
      await handleSave({ id: editingId, ...payload }, "products");
    } else {
      const created = await handleSave(payload, "products");
      const pid = (created?.data ?? created)?.id;
      if (pid) setEditingId(pid);
    }

    alert("Product published successfully!");
    cancelForm();
  } catch (e) {
    console.error('❌ Publish error:', e);
    alert(e?.message || "Publish failed.");
  } finally {
    setBusy(false);
  }
};

  const tablePlaceholder =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><rect width='100%' height='100%' fill='%23e5e7eb'/></svg>";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
        <button
          onClick={startCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          New Product
        </button>
      </div>

      {/* Table */}
      {pageLoading ? (
        <div className="bg-white rounded-xl border p-6 text-gray-500">
          Loading products…
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Image</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Weight (g)</th>
                <th className="px-4 py-3 text-left">Stock</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => {
                const img =
                  Array.isArray(p.images) && p.images.length ? p.images[0] : tablePlaceholder;
                const stock =
                  p.manage_stock && (p.stock_quantity ?? 0) > 0
                    ? `${p.stock_quantity}`
                    : "—";
                const categoryName = categories.find(c => c.id === p.category_id)?.name || "—";
                const isDraftProduct = p.is_draft || (!p.is_active && p.created_by_admin);
                
                return (
                  <tr key={p.id} className={isDraftProduct ? 'bg-yellow-50' : ''}>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        isDraftProduct 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : p.is_active 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isDraftProduct ? 'Draft' : p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <img
                        src={img}
                        alt=""
                        className="w-12 h-12 rounded object-cover"
                      />
                    </td>
                    <td className="px-4 py-3">{getDisplayTitle(p, currentLocale)}</td>
                    <td className="px-4 py-3">{p.sku || 'No SKU'}</td>
                    <td className="px-4 py-3">{categoryName}</td>
                    <td className="px-4 py-3">
                      {Number(p.price).toFixed(2)} {p.currency || "EUR"}
                    </td>
                    <td className="px-4 py-3">{p.weight_grams || 0}g</td>
                    <td className="px-4 py-3">{stock}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => startEdit(p)}
                        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, "products")}
                        className="px-3 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200"
                      >
                        <Trash2 className="w-4 h-4 inline-block -mt-1 mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                    No products yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer / Form */}
      {showForm && (
        <div className="bg-white rounded-xl border p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
  <span className="text-sm text-gray-500">Language:</span>
  <select
    value={currentLocale}
    onChange={(e) => setCurrentLocale(e.target.value)}
    className="px-2 py-1 border rounded-lg"
  >
    {SUPPORTED_LOCALES.map(l => (
      <option key={l.code} value={l.code}>
        {l.flag} {l.label}
      </option>
    ))}
  </select>
</div>

            <div className="flex items-center gap-3">
              {/* Draft/Published Toggle */}
              <div className="flex items-center gap-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isDraft}
                    onChange={(e) => setIsDraft(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Save as draft</span>
                </label>
              </div>
              <button onClick={cancelForm} className="p-2 rounded hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Draft Status Indicator */}
          {(isDraft || (isEdit && form.is_draft)) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <FileImage className="w-5 h-5 text-yellow-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Draft Mode</p>
                  <p className="text-xs text-yellow-700">
                    Product will be saved as draft. You can add images and partial information. 
                    Use "Publish Product" when ready to make it live.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: Basic info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Title {!isDraft && '*'}
                </label>
                <input
  type="text"
  value={getT().name}
  onChange={(e) => setT(currentLocale, { name: e.target.value })}
  className="w-full px-3 py-2 border rounded-lg"
  placeholder={isDraft ? "Enter title (optional for draft)" : "Product title"}
/>

              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-sm font-medium mb-1">
                    SKU {!isDraft && '*'}
                  </label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => onChange("sku", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder={isDraft ? "Optional" : "SKU"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Price {!isDraft && '*'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => onChange("price", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="0.00"
                  />
                </div>
              
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => onChange("currency", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Weight (grams)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.weightGrams}
                    onChange={(e) => onChange("weightGrams", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category {!isDraft && '*'}
                  </label>
                  <select
                    value={showCategoryForm ? 'create-new' : form.categoryId}
                    onChange={(e) => handleCategorySelection(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                    <option value="create-new">+ Create New Category</option>
                  </select>
                </div>
              </div>

              {/* New Category Creation Form */}
              {showCategoryForm && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-blue-900 mb-3">Create New Category</h4>
                  
                  {categoryMessage && (
                    <div className={`mb-3 p-2 rounded text-sm ${
                      categoryMessage.includes('Error') 
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-green-50 text-green-600 border border-green-200'
                    }`}>
                      {categoryMessage}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1">Category Name *</label>
                      <input
                        type="text"
                        value={categoryForm.name}
                        onChange={(e) => handleCategoryChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Advanced Valves"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1">Slug (auto-generated)</label>
                      <input
                        type="text"
                        value={categoryForm.slug}
                        onChange={(e) => handleCategoryChange('slug', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        placeholder="advanced-valves"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={categoryForm.description}
                        onChange={(e) => handleCategoryChange('description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Category description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1">Sort Order</label>
                      <input
                        type="number"
                        min="0"
                        value={categoryForm.sortOrder}
                        onChange={(e) => handleCategoryChange('sortOrder', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={saveNewCategory}
                        disabled={savingCategory || !categoryForm.name.trim()}
                        className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {savingCategory ? 'Saving...' : 'Save Category'}
                      </button>
                      <button
                        onClick={() => {
                          setShowCategoryForm(false);
                          setCategoryForm({ ...emptyCategory });
                          setCategoryMessage('');
                        }}
                        className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Dimensions</label>
               <input
  type="text"
  value={getT().dimensions}
  onChange={(e) => setT(currentLocale, { dimensions: e.target.value })}
  className="w-full px-3 py-2 border rounded-lg"
  placeholder="e.g. 10x8x3 inches"
/>

              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
  rows={5}
  value={getT().description}
  onChange={(e) => setT(currentLocale, { description: e.target.value })}
  className="w-full px-3 py-2 border rounded-lg"
  placeholder="Product description"
/>

              </div>
            </div>

            {/* RIGHT: Images, bullets, stock */}
            <div className="space-y-4">
              {/* ✅ IMPROVED: Images section - upload anytime */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Images (max 4) - Can upload anytime!
                </label>
                
                {/* Existing Images */}
                {Array.isArray(form.images) && form.images.length > 0 ? (
                  <div className="flex flex-wrap gap-3 mb-3">
                    {form.images.map((url, idx) => (
                      <div key={`${url}-${idx}`} className="relative w-20 h-20 border rounded overflow-hidden">
                        <img src={url} alt={`img-${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImageUrl(url)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-3 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <FileImage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No images yet - upload some below!</p>
                  </div>
                )}

                {/* File Selection & Upload */}
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                        .filter(f => f.type.startsWith("image/"));
                      const roomLeft = 4 - (form.images?.length || 0);
                      setSelectedFiles(files.slice(0, Math.max(0, roomLeft)));
                      console.log('📁 Files selected:', files.length, 'Room left:', roomLeft);
                    }}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-900 hover:file:bg-gray-200"
                  />
                  
                  {selectedFiles.length > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800 mb-2">
                        Selected: {selectedFiles.map(f => f.name).join(", ")}
                      </p>
                      <button
                        type="button"
                        onClick={attachSelectedImages}
                        disabled={busy || actionLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {busy ? (
                          <>
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Uploading…
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Upload Images
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    💡 You can upload images immediately, even without completing all fields!
                    {`${Math.max(0, 4 - (form.images?.length || 0))} slots remaining.`}
                  </p>
                </div>
              </div>

              {/* Bullet points */}
              <div>
                <label className="block text-sm font-medium mb-2">Bullet points (max 5)</label>
                <div className="space-y-2">
                 {getT().bullets.map((v, i) => (
                    <input
                      key={i}
                      type="text"
                      value={v}
                      onChange={(e) => {
                        const bullets = [...getT().bullets];
                        bullets[i] = e.target.value;
                        setT(currentLocale, { bullets });
                      }}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder={`Bullet ${i + 1} (optional)`}
                    />
                  ))}

                </div>
              </div>

              {/* Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <input
                    id="local_stock"
                    type="checkbox"
                    checked={form.local_stock}
                    onChange={(e) => onChange("local_stock", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="local_stock" className="text-sm font-medium">
                    Manage local stock
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock_qty}
                    onChange={(e) => onChange("stock_qty", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="0"
                    disabled={!form.local_stock}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Amazon links by country */}
          <div>
            <label className="block text-sm font-medium mb-2">Amazon links by country (optional)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {COUNTRY_KEYS.map((code) => (
                <div key={code} className="flex items-center gap-2">
                  <span className="w-10 text-lg">{getFlag(code)}</span>
                  <input
                    type="url"
                    value={form.amazon_links[code] || ""}
                    onChange={(e) => onAmazonLinkChange(code, e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder={`Amazon ${countryLabel(code)} URL`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <button onClick={cancelForm} className="px-4 py-2 rounded-lg border">
              Cancel
            </button>
            
            {/* Save Draft Button */}
            <button
              onClick={saveDraft}
              disabled={busy || actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50"
            >
              <FileImage className="w-4 h-4" />
              {(busy || actionLoading) ? "Saving..." : "Save Draft"}
            </button>
            
            {/* Publish Button */}
            <button
              onClick={publishProduct}
              disabled={busy || actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {(busy || actionLoading) ? "Publishing..." : "Publish Product"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}