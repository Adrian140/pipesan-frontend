// FILE: src/components/product/ProductCard.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { productPath } from "../../seo/meta";
import { Star, ShoppingCart, Check, ExternalLink } from "lucide-react";
import { normalizeProduct } from "../../utils/normalizeProduct";
import { useCart } from "../../contexts/CartContext";
import { apiClient } from "../../config/api";              // ⬅️ nou
import { useLanguage } from "../../contexts/LanguageContext";
import { extractSpecs } from "../../utils/productSpecs";
import { cartErrorMessage } from "../../domain/cartErrors";

const PH_400 =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='%23e5e7eb'/></svg>";


const L = {
  fr: { exVat: "TTC", amazon: "Voir sur Amazon", onAmazon: "Sur Amazon", unavailable: "Indisponible", add: "Ajouter au panier", added: "Ajouté au panier", adding: "Ajout..." },
  en: { exVat: "incl. VAT", amazon: "View on Amazon", onAmazon: "On Amazon", unavailable: "Unavailable", add: "Add to cart", added: "Added to cart", adding: "Adding..." },
  it: { exVat: "IVA incl.", amazon: "Vedi su Amazon", onAmazon: "Su Amazon", unavailable: "Non disponibile", add: "Aggiungi al carrello", added: "Aggiunto al carrello", adding: "Aggiunta..." },
  de: { exVat: "inkl. MwSt.", amazon: "Auf Amazon ansehen", onAmazon: "Auf Amazon", unavailable: "Nicht verfügbar", add: "In den Warenkorb", added: "Im Warenkorb", adding: "Wird hinzugefügt..." },
  es: { exVat: "IVA incl.", amazon: "Ver en Amazon", onAmazon: "En Amazon", unavailable: "No disponible", add: "Añadir al carrito", added: "Añadido al carrito", adding: "Añadiendo..." },
  ro: { exVat: "TVA inclus", amazon: "Vezi pe Amazon", onAmazon: "Pe Amazon", unavailable: "Indisponibil", add: "Adaugă în coș", added: "Adăugat în coș", adding: "Se adaugă..." },
};

export default function ProductCard({ product }) {
  const p = normalizeProduct(product);
  const { currentLanguage } = useLanguage();
  const l = L[currentLanguage] || L.fr;
    const prefetchProduct = async (id) => {
    const key = `product:${id}`;
    try {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        // dacă e deja în formatul nou, verifică TTL simplu (60s)
        try {
          const { ts } = JSON.parse(cached);
          if (ts && Date.now() - ts < 60_000) return;
        } catch {}
      }
      const raw = await apiClient.products.getById(id);
     const np = normalizeProduct(raw);
      sessionStorage.setItem(key, JSON.stringify({ data: np, ts: Date.now() }));
    } catch {}
  };
  const { addItem, isAddingItem } = useCart();
  const [showSuccess, setShowSuccess] = useState(false);

  const mainImage = (Array.isArray(p.images) && p.images[0]) || PH_400;

  const base = Number(p.price) || 0;
  const sale = Number(p.sale_price) || 0;
  const hasDiscount = sale > 0 && sale < base;
  const displayPrice = hasDiscount ? sale : base;

  const amazonLinks = p.amazon_links || {};
  // Amazon.fr by default, like the product page; another marketplace only when FR is missing.
  const amazonUrl = [amazonLinks.FR, ...Object.values(amazonLinks)].find(
    (u) => typeof u === "string" && u.trim()
  );

  const isOutOfStock = !p.inStock;
  const isAdding = isAddingItem(p.id);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isAdding) return;

    try {
      await addItem(
        {
          ...p,
          id: p.id,
          name: p.name || "",
          sku: p.sku || "",
          price: displayPrice,
          image: mainImage,
          images: p.images || [],
          weight_grams: p.weight_grams || 500,
          weightGrams: p.weight_grams || 500,
        },
        1,
        null
      );
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert(cartErrorMessage(error, currentLanguage));
    }
  };

  const handleAmazonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (amazonUrl) {
      window.open(amazonUrl, "_blank", "noopener,noreferrer");
    }
  };

  // ⬅️ prefill minim, suficient pentru paint instant
  const prefill = {
    id: p.id,
    name: p.name,
    sku: p.sku,
    currency: p.currency || "EUR",
    price: p.price,
    sale_price: p.sale_price,
    images: p.images,
    image: p.image,
    rating: p.rating,
    review_count: p.review_count,
    manage_stock: p.manage_stock,
    stock_quantity: p.stock_quantity,
    amazon_links: p.amazon_links,
    description: p.description, // opțional
    inStock: p.inStock,
    slug: p.slug,
    reviewCount: p.reviewCount,
  };

  const specs = extractSpecs(p.name);
  const discountPct = hasDiscount && base > 0 ? Math.round(((base - sale) / base) * 100) : 0;

  return (
    <div
      className="group relative flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-lift transition-all duration-300"
      onMouseEnter={() => prefetchProduct(p.id)}            // ⬅️ prefetch
    >
      <Link
        to={productPath(p)}
        className="flex flex-col flex-1"
        state={{ prefill }}                                 // ⬅️ trimite prefill
        title={p.name}
      >
        <div className="relative aspect-square bg-white p-4 overflow-hidden">
          <img
            src={mainImage}
            alt={p.name}
            className="w-full h-full object-contain group-hover:scale-[1.04] transition-transform duration-500"
            onError={(e) => { e.currentTarget.src = PH_400; }}
            loading="lazy"
            decoding="async"
          />
          {isOutOfStock && (
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur border border-gray-200 text-text-secondary px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider">
              {amazonUrl ? l.onAmazon : l.unavailable}
            </span>
          )}
          {!isOutOfStock && discountPct > 0 && (
            <span className="absolute top-3 left-3 bg-graphite-900 text-brass-light px-2 py-0.5 rounded font-mono text-[11px] font-semibold">
              -{discountPct}%
            </span>
          )}
        </div>

        <div className="flex flex-col flex-1 border-t border-gray-100 p-4 gap-2">
          {p.sku && (
            <p className="font-mono text-[10px] text-text-light tracking-wider uppercase truncate">{p.sku}</p>
          )}
          <h3 className="text-sm font-semibold text-text-primary leading-snug line-clamp-3 min-h-[3.9em]">
            {p.name || "Product Name"}
          </h3>

          {specs.length > 0 && (
            <ul className="flex flex-wrap gap-1">
              {specs.map((s) => (
                <li key={s} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-paper text-text-secondary border border-gray-200">
                  {s}
                </li>
              ))}
            </ul>
          )}

          {Number(p.rating) > 0 && (
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(Number(p.rating))
                      ? "text-brass fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="text-[11px] text-text-light">({p.review_count || 0})</span>
            </div>
          )}

          <div className="mt-auto pt-2 flex items-end justify-between gap-2 min-h-[44px]">
            {!isOutOfStock ? (
              <>
                <div className="leading-tight">
                  {hasDiscount && base > 0 && (
                    <span className="block text-xs text-text-light line-through">
                      {base.toFixed(2)} {p.currency}
                    </span>
                  )}
                  <span className="text-lg font-extrabold text-text-primary">
                    {displayPrice.toFixed(2)} <span className="text-sm font-bold">{p.currency}</span>
                  </span>
                  <span className="block text-[11px] text-text-light">{l.exVat}</span>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  aria-label={showSuccess ? l.added : isAdding ? l.adding : l.add}
                  title={showSuccess ? l.added : isAdding ? l.adding : l.add}
                  className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    showSuccess
                      ? "bg-emerald-600 text-white"
                      : "bg-graphite-900 text-white hover:bg-primary"
                  }`}
                >
                  {showSuccess ? (
                    <Check className="w-5 h-5" />
                  ) : isAdding ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <ShoppingCart className="w-[18px] h-[18px]" />
                  )}
                </button>
              </>
            ) : amazonUrl ? (
              <button
                onClick={handleAmazonClick}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-text-primary hover:border-graphite-900 transition-colors"
              >
                {l.amazon}
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-sm text-text-light">{l.unavailable}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
