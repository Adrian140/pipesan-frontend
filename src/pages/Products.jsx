// FILE: src/pages/Products.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Grid, List, SlidersHorizontal } from 'lucide-react';
import ProductGrid from '../components/products/ProductGrid';
import { apiClient } from '../config/api';
import { useLanguage } from '../contexts/LanguageContext';
// --- lightweight cache (per tab) ---
const memCache = {
  list: null,
  cats: null,
  ts: 0,
};
const readListCache = () => {
  try {
    const raw = sessionStorage.getItem('products:list');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const writeListCache = (data) => {
  try { sessionStorage.setItem('products:list', JSON.stringify(data)); } catch {}
};
const readCatsCache = () => {
  try {
    const raw = sessionStorage.getItem('products:cats');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const writeCatsCache = (data) => {
  try { sessionStorage.setItem('products:cats', JSON.stringify(data)); } catch {}
};

// ===== Translations (local to this page) =====
const T = {
  fr: {
    title: 'Produits',
    subtitle: 'Raccords, vannes et composants de plomberie professionnels',
    searchPh: 'Rechercher des produits...',
    allCategories: 'Toutes les catégories',
    sortLabel: 'Trier par',
    sort: {
      name: 'Nom A–Z',
      category: 'Catégorie',
      priceLow: 'Prix : croissant',
      priceHigh: 'Prix : décroissant',
      rating: 'Mieux noté',
      newest: 'Plus récents',
    },
    filtersBtn: 'Filtres',
    priceRange: 'Plage de prix (€)',
    min: 'Min',
    max: 'Max',
    availability: 'Disponibilité',
    inStockOnly: 'Doar în stoc', // you might want FR here: 'En stock uniquement'
    categoriesInfo: 'Catégories disponibles',
    loadingCats: 'Chargement des catégories...',
    catsAvailable: (n) => `${n} catégories disponibles`,
    showing: (a, b) => `Affichage de ${a} din ${b} produse`, // FR alt: `Affichage de ${a} sur ${b} produits`
    currentCategory: (c) => `Categorie: ${c}`, // FR alt: `Catégorie : ${c}`
    noProducts: 'Aucun produit trouvé',
    tryAdjust: 'Essayez de modifier la recherche ou les filtres.',
    currentlyFilteringBy: 'Filtrare curentă după:', // FR alt: 'Filtrage actuel :'
    noCatsTitle: 'Aucune catégorie',
    noCatsMsg: 'Créez des catégories dans le panneau admin pour organiser vos produits.',
    goAdmin: "Aller à l'Admin",
    loadMore: (n) => `Charger plus de produits (${n} de plus)`,
  },

  en: {
    title: 'Products',
    subtitle: 'Professional pipe fittings, valves, and plumbing components',
    searchPh: 'Search products...',
    allCategories: 'All Categories',
    sortLabel: 'Sort by',
    sort: {
      name: 'Name A–Z',
      category: 'Category',
      priceLow: 'Price: Low to High',
      priceHigh: 'Price: High to Low',
      rating: 'Highest Rated',
      newest: 'Newest First',
    },
    filtersBtn: 'Filters',
    priceRange: 'Price Range (€)',
    min: 'Min',
    max: 'Max',
    availability: 'Availability',
    inStockOnly: 'In Stock Only',
    categoriesInfo: 'Available Categories',
    loadingCats: 'Loading categories...',
    catsAvailable: (n) => `${n} categories available`,
    showing: (a, b) => `Showing ${a} of ${b} products`,
    currentCategory: (c) => `Category: ${c}`,
    noProducts: 'No products found',
    tryAdjust: 'Try adjusting your search or filter criteria.',
    currentlyFilteringBy: 'Currently filtering by:',
    noCatsTitle: 'No Categories Found',
    noCatsMsg: 'Create product categories in the admin panel to organize your products.',
    goAdmin: 'Go to Admin Panel',
    loadMore: (n) => `Load More Products (${n} more)`,
  },

  it: {
    title: 'Prodotti',
    subtitle: 'Raccordi, valvole e componenti idraulici professionali',
    searchPh: 'Cerca prodotti...',
    allCategories: 'Tutte le categorie',
    sortLabel: 'Ordina per',
    sort: {
      category: 'Categoria',
      name: 'Nome A–Z',
      priceLow: 'Prezzo: dal più basso',
      priceHigh: 'Prezzo: dal più alto',
      rating: 'Più votati',
      newest: 'Più recenti',
    },
    filtersBtn: 'Filtri',
    priceRange: 'Fascia di prezzo (€)',
    min: 'Min',
    max: 'Max',
    availability: 'Disponibilità',
    inStockOnly: 'Solo disponibili',
    categoriesInfo: 'Categorie disponibili',
    loadingCats: 'Caricamento categorie...',
    catsAvailable: (n) => `${n} categorie disponibili`,
    showing: (a, b) => `Visualizzati ${a} di ${b} prodotti`,
    currentCategory: (c) => `Categoria: ${c}`,
    noProducts: 'Nessun prodotto trovato',
    tryAdjust: 'Prova a modificare la ricerca o i filtri.',
    currentlyFilteringBy: 'Filtro attuale:',
    noCatsTitle: 'Nessuna categoria trovata',
    noCatsMsg: "Crea categorie dall'area admin per organizzare i prodotti.",
    goAdmin: 'Vai al Pannello Admin',
    loadMore: (n) => `Carica altri prodotti (${n} in più)`,
  },

  de: {
    title: 'Produkte',
    subtitle: 'Professionelle Rohrfittings, Ventile und Sanitärkomponenten',
    searchPh: 'Produkte suchen...',
    allCategories: 'Alle Kategorien',
    sortLabel: 'Sortieren nach',
    sort: {
      category: 'Kategorie',
      name: 'Name A–Z',
      priceLow: 'Preis: aufsteigend',
      priceHigh: 'Preis: absteigend',
      rating: 'Beste Bewertung',
      newest: 'Neueste zuerst',
    },
    filtersBtn: 'Filter',
    priceRange: 'Preisspanne (€)',
    min: 'Min',
    max: 'Max',
    availability: 'Verfügbarkeit',
    inStockOnly: 'Nur lagernd',
    categoriesInfo: 'Verfügbare Kategorien',
    loadingCats: 'Kategorien werden geladen...',
    catsAvailable: (n) => `${n} Kategorien verfügbar`,
    showing: (a, b) => `${a} von ${b} Produkten`,
    currentCategory: (c) => `Kategorie: ${c}`,
    noProducts: 'Keine Produkte gefunden',
    tryAdjust: 'Passen Sie Suche oder Filter an.',
    currentlyFilteringBy: 'Aktueller Filter:',
    noCatsTitle: 'Keine Kategorien gefunden',
    noCatsMsg: 'Erstellen Sie Kategorien im Adminbereich, um Produkte zu organisieren.',
    goAdmin: 'Zum Adminbereich',
    loadMore: (n) => `Mehr Produkte laden (${n} weitere)`,
  },

  es: {
    title: 'Productos',
    subtitle: 'Accesorios, válvulas y componentes de fontanería profesionales',
    searchPh: 'Buscar productos...',
    allCategories: 'Todas las categorías',
    sortLabel: 'Ordenar por',
    sort: {
      category: 'Categoría',
      name: 'Nombre A–Z',
      priceLow: 'Precio: de menor a mayor',
      priceHigh: 'Precio: de mayor a menor',
      rating: 'Mejor valorados',
      newest: 'Más recientes',
    },
    filtersBtn: 'Filtros',
    priceRange: 'Rango de precios (€)',
    min: 'Mín',
    max: 'Máx',
    availability: 'Disponibilidad',
    inStockOnly: 'Solo en stock',
    categoriesInfo: 'Categorías disponibles',
    loadingCats: 'Cargando categorías...',
    catsAvailable: (n) => `${n} categorías disponibles`,
    showing: (a, b) => `Mostrando ${a} de ${b} productos`,
    currentCategory: (c) => `Categoría: ${c}`,
    noProducts: 'No se encontraron productos',
    tryAdjust: 'Intenta ajustar tu búsqueda o filtros.',
    currentlyFilteringBy: 'Filtrando por:',
    noCatsTitle: 'No hay categorías',
    noCatsMsg: 'Crea categorías en el panel de admin para organizar tus productos.',
    goAdmin: 'Ir al Panel de Admin',
    loadMore: (n) => `Cargar más productos (${n} más)`,
  },

  ro: {
    title: 'Produse',
    subtitle: 'Fitinguri, robinete și componente profesionale pentru instalații',
    searchPh: 'Caută produse...',
    allCategories: 'Toate categoriile',
    sortLabel: 'Sortează după',
    sort: {
      category: 'Categorie',
      name: 'Nume A–Z',
      priceLow: 'Preț: crescător',
      priceHigh: 'Preț: descrescător',
      rating: 'Cele mai apreciate',
      newest: 'Cele mai noi',
    },
    filtersBtn: 'Filtre',
    priceRange: 'Interval preț (€)',
    min: 'Min',
    max: 'Max',
    availability: 'Disponibilitate',
    inStockOnly: 'Doar în stoc',
    categoriesInfo: 'Categorii disponibile',
    loadingCats: 'Se încarcă categoriile...',
    catsAvailable: (n) => `${n} categorii disponibile`,
    showing: (a, b) => `Afișăm ${a} din ${b} produse`,
    currentCategory: (c) => `Categorie: ${c}`,
    noProducts: 'Nu am găsit produse',
    tryAdjust: 'Încearcă să ajustezi căutarea sau filtrele.',
    currentlyFilteringBy: 'Filtrare curentă după:',
    noCatsTitle: 'Nu există categorii',
    noCatsMsg: 'Creează categorii în panoul de administrare pentru a organiza produsele.',
    goAdmin: 'Deschide Panoul Admin',
    loadMore: (n) => `Încarcă mai multe produse (${n} în plus)`,
  },
};

// helper to get current lang dict
const useT = () => {
  const { currentLanguage } = useLanguage();
  return T[(currentLanguage || 'fr').toLowerCase()] || T.fr;
};

const ALL = '__all__';

function Products() {
  const t = useT();

 const [products, setProducts] = useState([]);
const [categories, setCategories] = useState([]);
const [initialLoading, setInitialLoading] = useState(true);    
const [refreshing, setRefreshing] = useState(false);          
const [categoriesLoading, setCategoriesLoading] = useState(true);
const [viewMode, setViewMode] = useState('grid');
const [filters, setFilters] = useState({
  search: '',
  category: ALL,
  priceRange: [0, 1000],
  inStock: false,
  sortBy: 'category',
});
const [showFilters, setShowFilters] = useState(false);

  const sortOptions = useMemo(
    () => [
      { value: 'category', label: t.sort.category },
      { value: 'name', label: t.sort.name },
      { value: 'price-low', label: t.sort.priceLow },
      { value: 'price-high', label: t.sort.priceHigh },
      { value: 'rating', label: t.sort.rating },
      { value: 'newest', label: t.sort.newest },
    ],
    [t]
  );

  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

 const fetchInitialData = async () => {
  try {
    // 1) încearcă cache (instant paint)
    const cachedList = memCache.list || readListCache();
    const cachedCats = memCache.cats || readCatsCache();

    if (cachedList) setProducts(cachedList);
    if (cachedCats) setCategories(cachedCats);

    setInitialLoading(!cachedList);       // dacă avem cache, nu blocăm UI
    setCategoriesLoading(!cachedCats);

    // 2) paralelizăm rețeaua (nu blocăm UI dacă avem cache)
    const [productsData, categoriesData] = await Promise.all([
      apiClient.products.getAll({ search: '', category: '', sortBy: 'name' }),
      apiClient.categories.getAll(),
    ]);

    setProducts(productsData || []);
    setCategories(categoriesData || []);

    memCache.list = productsData || [];
    memCache.cats = categoriesData || [];
    memCache.ts = Date.now();
    writeListCache(memCache.list);
    writeCatsCache(memCache.cats);
  } catch (error) {
    console.error('Error fetching initial data:', error);
  } finally {
    setInitialLoading(false);
    setCategoriesLoading(false);
  }
};

 useEffect(() => {
  const timeoutId = setTimeout(() => {
    fetchProducts();
  }, 250); // puțin mai scurt
  return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [filters.search, filters.category, filters.sortBy]);

const fetchProducts = async () => {
  try {
    // dacă avem deja produse pe ecran, nu mai „ștergem” UI-ul
    setRefreshing(true);

    const categorySlug = filters.category === ALL ? '' : filters.category;

    const data = await apiClient.products.getAll({
      search: filters.search,
      category: categorySlug,
      sortBy: filters.sortBy,
    });

    setProducts(data || []);

    // actualizează cache-ul cu ultima listă (opțional)
    memCache.list = data || [];
    memCache.ts = Date.now();
    writeListCache(memCache.list);
  } catch (error) {
    console.error('Error fetching products:', error);
  } finally {
    setRefreshing(false);
  }
};


  // Local refinement filters (stock & price & client-side search fallback)
  // MEMO: filtre locale (search, price, stock)
const filteredProducts = useMemo(() => {
  const q = (filters.search || '').toLowerCase();
  const [minP, maxP] = filters.priceRange;

  return products.filter((product) => {
    const matchesSearch =
      !q ||
      product.name?.toLowerCase().includes(q) ||
      product.sku?.toLowerCase().includes(q);

    const price = product.salePrice ?? product.price ?? 0;
    const matchesPrice = price >= minP && price <= maxP;
    const matchesStock = !filters.inStock || !!product.inStock;

    return matchesSearch && matchesPrice && matchesStock;
  });
}, [products, filters.search, filters.priceRange, filters.inStock]);

// MEMO: sortare
const sortedProducts = useMemo(() => {
  const arr = [...filteredProducts];
  switch (filters.sortBy) {
    case 'price-low':
      arr.sort((a, b) => (a.salePrice ?? a.price ?? 0) - (b.salePrice ?? b.price ?? 0));
      break;
    case 'price-high':
      arr.sort((a, b) => (b.salePrice ?? b.price ?? 0) - (a.salePrice ?? a.price ?? 0));
      break;
    case 'rating':
      arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case 'newest':
      arr.sort((a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0));
      break;
    case 'category':
      arr.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
      break;
    default:
      arr.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }
  return arr;
}, [filteredProducts, filters.sortBy]);

const sortedCategories = useMemo(
  () =>
    [...(categories || [])].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '')
    ),
  [categories]
);

const categoryOptions = useMemo(
  () => [
    { label: t.allCategories, value: ALL },
    ...sortedCategories.map((c) => ({ label: c.name, value: c.slug })),
  ],
  [sortedCategories, t.allCategories]
);

const selectedCategoryLabel =
  categoryOptions.find((o) => o.value === filters.category)?.label || t.allCategories;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">{t.title}</h1>
          <p className="text-text-secondary text-base md:text-lg">{t.subtitle}</p>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 items-center">
            {/* Search */}
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t.searchPh}
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative w-full lg:w-auto">
              {categoriesLoading ? (
                <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 min-w-[180px]">
                  <div className="animate-pulse bg-gray-200 h-4 w-32 rounded" />
                </div>
              ) : (
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full lg:w-auto px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent min-w-[180px]"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                  ))}
                </select>
              )}
            </div>

            {/* Sort */}
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
              className="w-full lg:w-auto px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent min-w-[180px]"
              aria-label={t.sortLabel}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* View Mode */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 ${
                  viewMode === 'grid'
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                aria-label="Grid view"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 ${
                  viewMode === 'list'
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                aria-label="List view"
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <SlidersHorizontal className="w-5 h-5" />
              {t.filtersBtn}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
          <div className="mt-5 pt-5 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t.priceRange}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder={t.min}
                      value={filters.priceRange[0]}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          priceRange: [parseInt(e.target.value) || 0, prev.priceRange[1]],
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder={t.max}
                      value={filters.priceRange[1]}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          priceRange: [prev.priceRange[0], parseInt(e.target.value) || 1000],
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Stock Filter */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t.availability}
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.inStock}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, inStock: e.target.checked }))
                      }
                      className="mr-2"
                    />
                    {t.inStockOnly}
                  </label>
                </div>

                {/* Categories Info */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t.categoriesInfo}
                  </label>
                  <div className="text-sm text-text-secondary">
                    {categoriesLoading
                      ? t.loadingCats
                      : t.catsAvailable(categories.length)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count and Category Info */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-text-secondary">
              {t.showing(sortedProducts.length, products.length)}
            </p>
            {filters.category !== ALL && (
              <p className="text-sm text-text-light">
                {t.currentCategory(selectedCategoryLabel)}
              </p>
            )}
          </div>

          {/* Debug info only in dev */}
          {import.meta.env.DEV && (
            <div className="text-xs text-gray-400">
              Categories loaded: {categories.length}
            </div>
          )}
        </div>

        {/* Products Grid */}
       <ProductGrid
  products={sortedProducts}
  loading={initialLoading || (refreshing && products.length === 0)}
  viewMode={viewMode}
/>

        {/* No Products Message */}
{!initialLoading && !refreshing && sortedProducts.length === 0 && (
  <div className="text-center py-12">
    <div className="text-gray-400 mb-4">
      <svg
        className="w-16 h-16 mx-auto"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4.5"
        />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{t.noProducts}</h3>
    <div className="text-gray-500 space-y-1">
      <p>{t.tryAdjust}</p>
      {filters.category !== ALL && (
        <p className="text-sm">
          {t.currentlyFilteringBy}{' '}
          <span className="font-medium">{selectedCategoryLabel}</span>
        </p>
      )}
      {categories.length === 0 && !categoriesLoading && (
        <p className="text-sm text-yellow-600">{t.noCatsMsg}</p>
      )}
    </div>
  </div>
)}

        {/* Load More (placeholder – logic depends on backend pagination) */}
        {!initialLoading &&
  sortedProducts.length > 0 &&
  products.length > sortedProducts.length && (
            <div className="text-center mt-12">
              <button className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors">
                {t.loadMore(products.length - sortedProducts.length)}
              </button>
            </div>
          )}

        {/* Categories Admin Help */}
        {!categoriesLoading && categories.length === 0 && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">{t.noCatsTitle}</h3>
            <p className="text-yellow-700 mb-4">{t.noCatsMsg}</p>
            <a
              href="/admin"
              className="bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
            >
              {t.goAdmin}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
