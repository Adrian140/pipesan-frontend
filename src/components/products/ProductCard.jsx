// FILE: src/components/product/ProductCard.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Star, ShoppingCart, Check } from "lucide-react";
import { normalizeProduct } from "../../utils/normalizeProduct";
import { useCart } from "../../contexts/CartContext";
import { apiClient } from "../../config/api";              // ⬅️ nou

const PH_400 =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='%23e5e7eb'/></svg>";


export default function ProductCard({ product }) {
  const p = normalizeProduct(product);
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
  const amazonUrl = Object.values(amazonLinks).find(
    (u) => typeof u === "string" && u.trim()
  );

  const isOutOfStock = !!p.manage_stock && Number(p.stock_quantity) <= 0;
  const isAdding = isAddingItem(p.id);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isAdding) return;

    try {
      await addItem(
        {
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
      alert("Failed to add item to cart. Please try again.");
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
  };

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group relative"
      onMouseEnter={() => prefetchProduct(p.id)}            // ⬅️ prefetch
    >
      <Link
        to={`/products/${p.id}`}
        className="block"
        state={{ prefill }}                                 // ⬅️ trimite prefill
      >
        <div className="relative aspect-[5/4] overflow-hidden">
          <img
            src={mainImage}
            alt={p.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.currentTarget.src = PH_400; }}
            loading="lazy"
            decoding="async"
          />
          {isOutOfStock && (
            <span className="absolute top-3 left-3 bg-gray-700 text-white px-2 py-1 rounded-md text-xs font-medium">
              {amazonUrl ? "Disponible sur Amazon" : "Indisponibil"}
            </span>
          )}
          {!isOutOfStock && hasDiscount && base > 0 && (
            <span className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
              -{Math.round(((base - sale) / base) * 100)}%
            </span>
          )}
          <div className="absolute bottom-3 right-3">
            {isOutOfStock ? (
              amazonUrl ? (
                <button
                  onClick={handleAmazonClick}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-lg bg-[#FF9900] text-white font-semibold hover:bg-[#ff8a00] transition"
                  title="Cumpără pe Amazon"
                >
                  Amazon
                </button>
              ) : null
            ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={`p-2 rounded-full shadow-lg transition-all duration-200 ${
                    showSuccess
                      ? "bg-green-500 text-white"
                      : isAdding
                      ? "bg-yellow-500 text-white"
                      : "bg-primary text-white hover:bg-primary-dark hover:scale-110"
                  }`}
                  title={
                    showSuccess ? "Added to cart!" : isAdding ? "Adding..." : "Add to cart"
                  }
                >
                  {showSuccess ? (
                    <Check className="w-5 h-5" />
                  ) : isAdding ? (
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <ShoppingCart className="w-5 h-5" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-1.5 relative space-y-1">
          <p className="text-[10px] text-gray-500 tracking-wide uppercase">SKU: {p.sku || ""}</p>
          <h3 className="text-sm font-semibold text-text-primary leading-tight line-clamp-2">
            {p.name || "Product Name"}
          </h3>

          {Number(p.rating) > 0 && (
            <div className="flex items-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(Number(p.rating))
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="text-[11px] text-gray-500">({p.review_count || 0})</span>
            </div>
          )}

          {!isOutOfStock && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg font-bold text-primary leading-none">
                {displayPrice.toFixed(2)} {p.currency}
              </span>
              {hasDiscount && base > 0 && (
                <span className="text-xs text-gray-500 line-through absolute bottom-2 right-2">
                  {base.toFixed(2)} {p.currency}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>

      {showSuccess && (
        <div className="absolute inset-0 bg-green-500 bg-opacity-90 flex items-center justify-center rounded-xl">
          <div className="text-white text-center">
            <Check className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold">Added to cart!</p>
          </div>
        </div>
      )}
    </div>
  );
}
