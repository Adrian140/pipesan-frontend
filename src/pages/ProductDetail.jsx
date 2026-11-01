import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  Heart,
  Share2,
  ShoppingCart,
  Truck,
  Shield,
  RotateCcw,
  Check,
  Plus,
  Minus,
  User,
  Calendar,
} from "lucide-react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useSeo } from "../seo/useSeo";
import { NotFound } from "../seo/RouteSeo";
import { breadcrumbJsonLd, productJsonLd, productMeta, productPath, productShortName } from "../seo/meta";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../config/api";
import { normalizeProduct } from "../utils/normalizeProduct";
import { extractSpecs } from "../utils/productSpecs";
import { useLanguage } from "../contexts/LanguageContext";
import { cartErrorMessage } from "../domain/cartErrors";

const PD = {
  fr: { home: 'Accueil', products: 'Produits', specs: 'Caractéristiques', reviews: (n) => `${n} avis`, noReviews: 'Pas encore d’avis', priceIncl: 'Prix TTC, TVA incluse', features: 'Points clés', inStock: 'En stock', added: (n) => `${n} article(s) ajouté(s) au panier`, adding: 'Ajout…', outOfStock: 'Rupture de stock', add: (n) => `Ajouter ${n} au panier`, buyAmazon: 'Acheter sur Amazon', notAvailable: 'Pas encore disponible', favorites: 'Favoris', shipping: 'Expédié depuis notre entrepôt en France', returns: '14 jours pour changer d’avis', warranty: 'Garantie légale de 2 ans', description: 'Description du produit', customerReviews: 'Avis clients', verified: 'Achat vérifié', purchased: 'Acheté le', beFirst: 'Soyez le premier à donner votre avis sur ce produit.', outOf5: (r, n) => `${r} sur 5 (${n} avis)`, copied: 'Lien copié', notFound: 'Produit introuvable', locale: 'fr-FR' },
  en: { home: 'Home', products: 'Products', specs: 'Specifications', reviews: (n) => `${n} reviews`, noReviews: 'No reviews yet', priceIncl: 'Price incl. VAT', features: 'Key features', inStock: 'In stock', added: (n) => `${n} item(s) added to cart`, adding: 'Adding…', outOfStock: 'Out of stock', add: (n) => `Add ${n} to cart`, buyAmazon: 'Buy on Amazon', notAvailable: 'Not available yet', favorites: 'Add to favorites', shipping: 'Ships from our warehouse in France', returns: '14 days to change your mind', warranty: '2-year legal warranty', description: 'Product description', customerReviews: 'Customer reviews', verified: 'Verified purchase', purchased: 'Purchased', beFirst: 'Be the first to share your experience with this product.', outOf5: (r, n) => `${r} out of 5 (${n} reviews)`, copied: 'Link copied', notFound: 'Product not found', locale: 'en-GB' },
  it: { home: 'Home', products: 'Prodotti', specs: 'Specifiche', reviews: (n) => `${n} recensioni`, noReviews: 'Ancora nessuna recensione', priceIncl: 'Prezzo IVA inclusa', features: 'Caratteristiche principali', inStock: 'Disponibile', added: (n) => `${n} articolo/i aggiunto/i al carrello`, adding: 'Aggiunta…', outOfStock: 'Esaurito', add: (n) => `Aggiungi ${n} al carrello`, buyAmazon: 'Compra su Amazon', notAvailable: 'Non ancora disponibile', favorites: 'Preferiti', shipping: 'Spedito dal nostro magazzino in Francia', returns: '14 giorni per ripensarci', warranty: 'Garanzia legale di 2 anni', description: 'Descrizione del prodotto', customerReviews: 'Recensioni dei clienti', verified: 'Acquisto verificato', purchased: 'Acquistato il', beFirst: 'Sii il primo a recensire questo prodotto.', outOf5: (r, n) => `${r} su 5 (${n} recensioni)`, copied: 'Link copiato', notFound: 'Prodotto non trovato', locale: 'it-IT' },
  de: { home: 'Start', products: 'Produkte', specs: 'Technische Daten', reviews: (n) => `${n} Bewertungen`, noReviews: 'Noch keine Bewertungen', priceIncl: 'Preis inkl. MwSt.', features: 'Wichtigste Merkmale', inStock: 'Auf Lager', added: (n) => `${n} Artikel zum Warenkorb hinzugefügt`, adding: 'Wird hinzugefügt…', outOfStock: 'Nicht auf Lager', add: (n) => `${n} in den Warenkorb`, buyAmazon: 'Bei Amazon kaufen', notAvailable: 'Noch nicht verfügbar', favorites: 'Merken', shipping: 'Versand aus unserem Lager in Frankreich', returns: '14 Tage Widerrufsrecht', warranty: '2 Jahre gesetzliche Gewährleistung', description: 'Produktbeschreibung', customerReviews: 'Kundenbewertungen', verified: 'Verifizierter Kauf', purchased: 'Gekauft am', beFirst: 'Bewerten Sie dieses Produkt als Erste(r).', outOf5: (r, n) => `${r} von 5 (${n} Bewertungen)`, copied: 'Link kopiert', notFound: 'Produkt nicht gefunden', locale: 'de-DE' },
  es: { home: 'Inicio', products: 'Productos', specs: 'Especificaciones', reviews: (n) => `${n} opiniones`, noReviews: 'Aún no hay opiniones', priceIncl: 'Precio con IVA incluido', features: 'Características clave', inStock: 'En stock', added: (n) => `${n} artículo(s) añadido(s) al carrito`, adding: 'Añadiendo…', outOfStock: 'Agotado', add: (n) => `Añadir ${n} al carrito`, buyAmazon: 'Comprar en Amazon', notAvailable: 'Aún no disponible', favorites: 'Favoritos', shipping: 'Enviado desde nuestro almacén en Francia', returns: '14 días para cambiar de opinión', warranty: 'Garantía legal de 2 años', description: 'Descripción del producto', customerReviews: 'Opiniones de clientes', verified: 'Compra verificada', purchased: 'Comprado el', beFirst: 'Sé el primero en opinar sobre este producto.', outOf5: (r, n) => `${r} de 5 (${n} opiniones)`, copied: 'Enlace copiado', notFound: 'Producto no encontrado', locale: 'es-ES' },
  ro: { home: 'Acasă', products: 'Produse', specs: 'Specificații', reviews: (n) => `${n} recenzii`, noReviews: 'Nicio recenzie încă', priceIncl: 'Preț cu TVA inclus', features: 'Caracteristici principale', inStock: 'În stoc', added: (n) => `${n} produs(e) adăugat(e) în coș`, adding: 'Se adaugă…', outOfStock: 'Stoc epuizat', add: (n) => `Adaugă ${n} în coș`, buyAmazon: 'Cumpără pe Amazon', notAvailable: 'Încă indisponibil', favorites: 'Favorite', shipping: 'Expediat din depozitul nostru din Franța', returns: '14 zile pentru retur', warranty: 'Garanție legală 2 ani', description: 'Descrierea produsului', customerReviews: 'Recenziile clienților', verified: 'Cumpărare verificată', purchased: 'Cumpărat pe', beFirst: 'Fii primul care lasă o recenzie pentru acest produs.', outOf5: (r, n) => `${r} din 5 (${n} recenzii)`, copied: 'Link copiat', notFound: 'Produs negăsit', locale: 'ro-RO' },
};

const COUNTRY_ORDER = ["FR", "DE", "IT", "ES", "BE", "NL", "PL", "SE", "UK", "OTHER"];
const PH =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'><rect width='100%' height='100%' fill='%23f3f4f6'/></svg>";

export default function ProductDetail() {
  // The route param is the product slug (or the legacy UUID).
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
 const navPrefill = location.state?.prefill || null;
  const { addItem, isAddingItem } = useCart();
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = PD[currentLanguage] || PD.fr;

const [product, setProduct] = useState(navPrefill || null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
const [loading, setLoading] = useState(!navPrefill);
  const [isFav, setIsFav] = useState(false);
  const [amazonCountry, setAmazonCountry] = useState("FR");
  const [showSuccess, setShowSuccess] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const productKey = product?.id || id;

  // Check if this specific product is being added
  const isAdding = isAddingItem(productKey);

  // Old /products/<uuid> links move to the slug URL
  useEffect(() => {
    if (product?.slug && id !== product.slug && product.id === id) {
      navigate(productPath(product) + location.search, { replace: true, state: location.state });
    }
  }, [product, id, navigate, location.search, location.state]);

  useSeo(
    product
      ? {
          ...productMeta(product),
          jsonLd: [
            productJsonLd(product, product.categories),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Products", path: "/products" },
              ...(product.categories?.slug
                ? [{ name: product.categories.name, path: `/products?category=${product.categories.slug}` }]
                : []),
              { name: productShortName(product), path: productPath(product) },
            ]),
          ],
        }
      : null
  );

  // Fetch product data
  useEffect(() => {
    let cancel = false;

 const TTL = 60 * 1000; // 60s
const readCache = () => {
  try {
    const raw = sessionStorage.getItem(`product:${id}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (!ts || (Date.now() - ts) > TTL) return null;
    return data;
  } catch { return null; }
};
const writeCache = (p) => {
  try {
    sessionStorage.setItem(`product:${id}`, JSON.stringify({ data: p, ts: Date.now() }));
  } catch {}
};
      // dacă venim cu prefill din grilă, persistă-l în cache pentru refresh/navigare ulterioară
   if (navPrefill) {
      try {
    sessionStorage.setItem(`product:${id}`, JSON.stringify({ data: navPrefill, ts: Date.now() }));
  } catch {}
   }
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    (async () => {
      const hadInitialData = !!navPrefill || !!readCache();
  if (!hadInitialData) setLoading(true);

      const cached = readCache();
      if (cached && !cancel) {
        setProduct(cached);
        setSelectedImage(0);
      }

      let lastErr = null;
      for (const wait of [0, 300, 700, 1200]) {
        if (cancel) break;
        try {
          if (wait) await sleep(wait);
          const raw = await apiClient.products.getById(id);
          if (cancel) break;
          const p = raw ? normalizeProduct(raw) : null;
          setProduct(p);
          writeCache(p);
          setSelectedImage(0);
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
        }
      }

      // Oprim spinner-ul și când pornim din cache (altfel rămânea blocat la refresh)
      if (!cancel) setLoading(false);
      if (!cancel && lastErr && !cached) {
        console.error(lastErr);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [id]);

  // Load reviews from database
  useEffect(() => {
    if (product) {
      loadProductReviews();
    }
  }, [product]);

  const loadProductReviews = async () => {
    try {
      setReviewsLoading(true);
      const reviewsData = await apiClient.reviews.getByProduct(product.id);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    const favs = new Set(JSON.parse(localStorage.getItem("favorites") || "[]"));
    setIsFav(favs.has(String(productKey)));
  }, [productKey]);

  const selectedAmazonUrl = useMemo(() => {
    if (!product?.amazon_links) return "";
    const raw = product.amazon_links[amazonCountry];
    return typeof raw === "string" ? raw.trim() : "";
  }, [product, amazonCountry]);

  if (loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-brass" />
      </div>
    );
  }
  if (!product) {
    return (
      <NotFound title={t.notFound} />
    );
  }

  const {
    id: productId,
    name = "",
    sku: skuRaw = "",
    currency = "EUR",
    price = 0,
    sale_price = null,
    images = [],
    image = "",
    bullet_points = [],
    amazon_links = {},
    manage_stock = false,
    stock_quantity = 0,
    description = "",
    dimensions = "",
    material = "",
    outlet_connection = "",
    max_pressure = "",
    ports = "",
    manufacturer = "",
    rating = 0,
    review_count = 0,
  } = product || {};

  const sku = skuRaw || "—";
  const reviewCount = Number(product?.reviewCount ?? product?.total_reviews ?? review_count ?? 0);
  const hasDiscount =
    typeof sale_price === "number" &&
    sale_price > 0 &&
    typeof price === "number" &&
    sale_price < price;

  const displayPrice = hasDiscount ? sale_price : price;
  const inStock = product?.inStock === true;

  const mainImage = images[selectedImage] || image || PH;

  const handleAddToCart = async () => {
    if (!product || isAdding) return;

    try {
      await addItem(
        {
          ...product,
          id: product.id,
          name: product.name || "",
          sku: product.sku || "—",
          price: displayPrice,
          image: product.images?.[0] || product.image || "",
          images: product.images || [],
          weight_grams: product.weight_grams || 500,
          weightGrams: product.weight_grams || 500,
        },
        quantity,
        null
      );

      // Show success feedback
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(cartErrorMessage(error, currentLanguage));
    }
  };

  const toggleFavorite = () => {
    const key = "favorites";
    const set = new Set(JSON.parse(localStorage.getItem(key) || "[]"));
    const sid = String(productId);
    if (set.has(sid)) set.delete(sid);
    else set.add(sid);
    localStorage.setItem(key, JSON.stringify([...set]));
    setIsFav(set.has(sid));
  };

  const share = async () => {
    try {
      const url = window.location.href;
      if (navigator.share) await navigator.share({ title: name, url });
      else {
        await navigator.clipboard.writeText(url);
        alert(t.copied);
      }
    } catch {}
  };

  const openAmazon = () => {
    if (!selectedAmazonUrl) return;
    try {
      window.open(selectedAmazonUrl, "_blank", "noopener,noreferrer");
    } catch {}
  };

  const specList = [
    ["Dimensions", dimensions],
    ["Material", material],
    ["Outlet Connection", outlet_connection],
    ["Max Pressure", max_pressure],
    ["Ports", ports],
    ["Manufacturer", manufacturer],
  ].filter(([, v]) => v && String(v).trim());

  const renderStars = (rating, size = "w-5 h-5") => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < Math.floor(rating) ? "text-brass fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(t.locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-paper pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="mb-8 font-mono text-[11px] uppercase tracking-wider text-text-light truncate">
          <Link to="/" className="hover:text-text-primary">{t.home}</Link>
          <span className="mx-2">/</span>
          <Link to="/products" className="hover:text-text-primary">{t.products}</Link>
          <span className="mx-2">/</span>
          <span className="text-text-secondary">{sku}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 mb-12">
          {/* LEFT: Images + Specifications */}
          <div className="space-y-8">
            <div className="aspect-square bg-white rounded-2xl border border-gray-200 p-6 sm:p-10 overflow-hidden">
              <img
                src={mainImage}
                alt={name}
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.src = PH; }}
                loading="eager"
                decoding="async"
                fetchpriority="high"
              />
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    onClick={() => setSelectedImage(i)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 bg-white p-1.5 transition-colors ${
                      selectedImage === i ? "border-graphite-900" : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`thumb-${i}`}
                      className="w-full h-full object-contain"
                      onError={(e) => { e.currentTarget.src = PH; }}
                    />
                  </button>
                ))}
              </div>
            )}

            {specList.length > 0 && (
              <section aria-labelledby="specs-title" className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 id="specs-title" className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary mb-4">{t.specs}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  {specList.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 py-3 border-b border-gray-100 text-sm">
                      <span className="text-text-secondary">{k}</span>
                      <span className="font-semibold text-text-primary text-right">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT: Info + CTAs */}
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-text-light">SKU · {sku}</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary leading-tight mt-2 mb-4">{name}</h1>
            {extractSpecs(name, 5).length > 0 && (
              <ul className="flex flex-wrap gap-1.5 mb-4">
                {extractSpecs(name, 5).map((sp) => (
                  <li key={sp} className="font-mono text-xs px-2 py-1 rounded bg-white border border-gray-200 text-text-secondary">
                    {sp}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center gap-2 mb-4">
              {renderStars(rating)}
              <span className="text-sm text-text-secondary">
                {rating > 0 ? `${rating.toFixed(1)} (${t.reviews(reviewCount)})` : t.noReviews}
              </span>
            </div>

            <div className="mb-6 py-5 border-y border-gray-200">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-4xl font-extrabold text-text-primary">
                  {Number(displayPrice).toFixed(2)} {currency}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-text-light line-through">
                    {Number(price).toFixed(2)} {currency}
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary">{t.priceIncl}</p>
            </div>

            {/* Key Features Section */}
            {bullet_points.length > 0 && (
              <section aria-labelledby="features-title" className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
                <h2 id="features-title" className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary mb-4">
                  {t.features}
                </h2>
                <div className="space-y-3">
                  {bullet_points.slice(0, 5).map((bp, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-brass rounded-sm mt-2 flex-shrink-0" />
                      <span className="text-sm text-text-secondary leading-relaxed">{bp}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Stock */}
            <div className="mb-4">
              {inStock ? (
                <span className="inline-flex items-center gap-2 text-emerald-700 text-sm font-semibold"><span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {t.inStock}{manage_stock ? ` (${stock_quantity})` : ""}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-text-secondary text-sm font-semibold"><span className="w-2 h-2 rounded-full bg-gray-400" />Out of stock</span>
              )}
            </div>

            {/* Success message */}
            {showSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  {t.added(quantity)}
                </span>
              </div>
            )}

            {/* Quantity selector */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center bg-white border border-gray-300 rounded-lg">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    className="px-3 py-2 hover:bg-gray-50 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 border-x border-gray-300 font-medium min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)} 
                    className="px-3 py-2 hover:bg-gray-50 transition-colors"
                    disabled={manage_stock && quantity >= stock_quantity}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-gray-600">
                  Total: {(Number(displayPrice) * quantity).toFixed(2)} {currency}
                </span>
              </div>

              {/* Main Add to Cart Button */}
              <div className="mb-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock || isAdding}
                  className={`w-full py-4 rounded-lg font-bold text-base transition-colors duration-200 ${
                    !inStock
                      ? 'bg-gray-300 text-white cursor-not-allowed'
                      : isAdding
                      ? 'bg-graphite-700 text-white'
                      : 'bg-graphite-900 text-white hover:bg-primary'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {isAdding ? (
                      <>
                        <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        {t.adding}
                      </>
                    ) : !inStock ? (
                      t.outOfStock
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        {t.add(quantity)}
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* Secondary actions */}
              <div className="flex items-center gap-3">
                <select
                  className="flex-1 px-3 py-2.5 bg-white border border-gray-300 rounded-lg font-mono text-sm"
                  value={amazonCountry}
                  onChange={(e) => setAmazonCountry(e.target.value)}
                  title="Amazon Country"
                >
                  {COUNTRY_ORDER.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <button
                  onClick={openAmazon}
                  disabled={!selectedAmazonUrl}
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    selectedAmazonUrl
                      ? "bg-white border border-graphite-900 text-text-primary hover:bg-graphite-900 hover:text-white"
                      : "bg-gray-100 text-text-light cursor-not-allowed"
                  }`}
                  title={selectedAmazonUrl ? t.buyAmazon : t.notAvailable}
                >
                  {selectedAmazonUrl ? "Amazon" : "N/A"}
                </button>

                <button
                  onClick={toggleFavorite}
                  className={`p-2.5 border rounded-lg transition-colors ${
                    isFav ? "bg-white border-red-300 text-red-500" : "bg-white border-gray-300 text-text-secondary hover:border-gray-400"
                  }`}
                  title={t.favorites}
                >
                  <Heart className={`w-5 h-5 ${isFav ? "fill-red-500" : ""}`} />
                </button>

                <button
                  onClick={share}
                  className="p-2.5 bg-white border border-gray-300 rounded-lg text-text-secondary hover:border-gray-400 transition-colors"
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Perks */}
            <div className="grid sm:grid-cols-3 gap-3 mb-8">
              <div className="flex items-center gap-3 text-sm bg-white border border-gray-200 rounded-xl p-3">
                <Truck className="w-5 h-5 text-primary flex-shrink-0" />
                <span>{t.shipping}</span>
              </div>
              <div className="flex items-center gap-3 text-sm bg-white border border-gray-200 rounded-xl p-3">
                <RotateCcw className="w-5 h-5 text-primary flex-shrink-0" />
                <span>{t.returns}</span>
              </div>
              <div className="flex items-center gap-3 text-sm bg-white border border-gray-200 rounded-xl p-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                <span>{t.warranty}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Description */}
        {!!(description && String(description).trim()) && (
          <section aria-labelledby="desc-title" className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10 mb-8">
            <h2 id="desc-title" className="text-2xl font-extrabold text-text-primary mb-6">
              {t.description}
            </h2>
            <div className="text-text-secondary leading-relaxed max-w-4xl">
              <p className="whitespace-pre-line">{String(description)}</p>
            </div>
          </section>
        )}

        {/* Customer Reviews - Full Width - ONLY DISPLAY */}
        <section aria-labelledby="reviews-title" className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 id="reviews-title" className="text-2xl font-extrabold text-text-primary">
              {t.customerReviews}
            </h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                {renderStars(rating)}
                <span className="text-sm text-gray-600 ml-2">
                  {t.outOf5(rating.toFixed(1), reviewCount)}
                </span>
              </div>
            )}
          </div>

          {reviewsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-brass" />
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-graphite-900 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-brass-light" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-text-primary">{review.customer_name}</h4>
                          {review.is_verified_purchase && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              {t.verified}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(review.rating, "w-4 h-4")}
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {review.purchase_date ? 
                              `${t.purchased} ${formatDate(review.purchase_date)}` : 
                              formatDate(review.created_at)
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <h5 className="font-medium text-text-primary mb-2">{review.title}</h5>
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-paper rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-500 mb-2">
                {t.noReviews}
              </h3>
              <p className="text-gray-400">
                {t.beFirst}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
