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
import { useParams, useLocation } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../config/api";
import { normalizeProduct } from "../utils/normalizeProduct";

const COUNTRY_ORDER = ["FR", "DE", "IT", "ES", "BE", "NL", "PL", "SE", "UK", "OTHER"];
const PH =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'><rect width='100%' height='100%' fill='%23f3f4f6'/></svg>";

export default function ProductDetail() {
  const { id } = useParams();
  const location = useLocation();
 const navPrefill = location.state?.prefill || null;
  const { addItem, isAddingItem } = useCart();
  const { user } = useAuth();

const [product, setProduct] = useState(navPrefill || null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
const [loading, setLoading] = useState(!navPrefill);
  const [isFav, setIsFav] = useState(false);
  const [amazonCountry, setAmazonCountry] = useState("FR");
  const [showSuccess, setShowSuccess] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Check if this specific product is being added
  const isAdding = isAddingItem(id);

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
          const p = normalizeProduct(raw);
          setProduct(p);
          writeCache(p);
          setSelectedImage(0);
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
        }
      }

      if (!cancel && !hadInitialData) setLoading(false);
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
      const reviewsData = await apiClient.reviews.getByProduct(id);
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
    setIsFav(favs.has(String(id)));
  }, [id]);

  const selectedAmazonUrl = useMemo(() => {
    if (!product?.amazon_links) return "";
    const raw = product.amazon_links[amazonCountry];
    return typeof raw === "string" ? raw.trim() : "";
  }, [product, amazonCountry]);

  if (loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }
  if (!product) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center text-gray-600">
        Product not found.
      </div>
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
  const hasDiscount =
    typeof sale_price === "number" &&
    sale_price > 0 &&
    typeof price === "number" &&
    sale_price < price;

  const displayPrice = hasDiscount ? sale_price : price;
  const inStock = manage_stock ? (stock_quantity || 0) > 0 : true;

  const mainImage = images[selectedImage] || image || PH;

  const handleAddToCart = async () => {
    if (!product || isAdding) return;

    try {
      await addItem(
        {
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
      alert('Failed to add to cart. Please try again.');
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
        alert("Link copied to clipboard");
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
          i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="mb-8 text-sm">
          <Link to="/" className="text-primary">Home</Link>{" "}
          <span className="text-gray-400">/</span>{" "}
          <Link to="/products" className="text-primary">Products</Link>{" "}
          <span className="text-gray-400">/</span>{" "}
          <span className="text-gray-700">{name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* LEFT: Images + Specifications */}
          <div className="space-y-8">
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
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
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImage === i ? "border-primary" : "border-gray-200"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`thumb-${i}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = PH; }}
                    />
                  </button>
                ))}
              </div>
            )}

            {specList.length > 0 && (
              <section aria-labelledby="specs-title" className="bg-white">
                <h2 id="specs-title" className="text-lg font-semibold mb-4">Specifications</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {specList.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 py-2 border-b border-gray-100">
                      <span className="font-medium">{k}:</span>
                      <span className="text-gray-700 text-right">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT: Info + CTAs */}
          <div>
            <p className="text-sm text-gray-500">SKU: {sku}</p>
            <h1 className="text-3xl font-bold mt-1 mb-4">{name}</h1>

            <div className="flex items-center gap-2 mb-4">
              {renderStars(rating)}
              <span className="text-sm text-gray-600">
                {rating > 0 ? `${rating.toFixed(1)} (${review_count} reviews)` : "No reviews yet"}
              </span>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl font-bold text-primary">
                  {Number(displayPrice).toFixed(2)} {currency}
                </span>
                {hasDiscount && (
                  <span className="text-xl text-gray-500 line-through">
                    {Number(price).toFixed(2)} {currency}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">Price incl. VAT</p>
            </div>

            {/* Key Features Section */}
            {bullet_points.length > 0 && (
              <section aria-labelledby="features-title" className="bg-gray-50 rounded-xl p-6 mb-6">
                <h2 id="features-title" className="text-lg font-semibold text-text-primary mb-4">
                  Key Features
                </h2>
                <div className="space-y-3">
                  {bullet_points.slice(0, 5).map((bp, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{bp}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Stock */}
            <div className="mb-4">
              {inStock ? (
                <span className="text-green-600 text-sm">
                  In stock{manage_stock ? ` (${stock_quantity})` : ""}
                </span>
              ) : (
                <span className="text-red-600 text-sm">Out of stock</span>
              )}
            </div>

            {/* Success message */}
            {showSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  {quantity} {quantity === 1 ? 'item added' : 'items added'} to cart!
                </span>
              </div>
            )}

            {/* Quantity selector */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
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
                  className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
                    !inStock
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : isAdding
                      ? 'bg-yellow-500 text-white'
                      : 'bg-primary text-white hover:bg-primary-dark hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {isAdding ? (
                      <>
                        <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Adding to cart...
                      </>
                    ) : !inStock ? (
                      'Out of stock'
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        Add {quantity} to cart
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* Secondary actions */}
              <div className="flex items-center gap-3">
                <select
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
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
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    selectedAmazonUrl
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                  title={selectedAmazonUrl ? "Buy on Amazon" : "Not available yet"}
                >
                  {selectedAmazonUrl ? "Amazon" : "N/A"}
                </button>

                <button
                  onClick={toggleFavorite}
                  className={`p-2 border rounded-lg transition-colors ${
                    isFav ? "border-red-400 text-red-500" : "border-gray-300 text-gray-500 hover:border-gray-400"
                  }`}
                  title="Add to favorites"
                >
                  <Heart className={`w-5 h-5 ${isFav ? "fill-red-500" : ""}`} />
                </button>

                <button
                  onClick={share}
                  className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 transition-colors"
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Perks */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-sm">
                <Truck className="w-5 h-5 text-green-600" />
                <span>Free shipping for orders over €100</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <RotateCcw className="w-5 h-5 text-blue-600" />
                <span>30-day return policy</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-5 h-5 text-purple-600" />
                <span>2-year warranty included</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Description */}
        {!!(description && String(description).trim()) && (
          <section aria-labelledby="desc-title" className="bg-white rounded-xl border border-gray-200 p-8 mb-12">
            <h2 id="desc-title" className="text-2xl font-bold text-text-primary mb-6">
              Product Description
            </h2>
            <div className="text-gray-700 leading-relaxed text-lg">
              <p className="whitespace-pre-line">{String(description)}</p>
            </div>
          </section>
        )}

        {/* Customer Reviews - Full Width - ONLY DISPLAY */}
        <section aria-labelledby="reviews-title" className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 id="reviews-title" className="text-2xl font-bold text-text-primary">
              Customer Reviews
            </h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                {renderStars(rating)}
                <span className="text-sm text-gray-600 ml-2">
                  {rating.toFixed(1)} out of 5 ({review_count} reviews)
                </span>
              </div>
            )}
          </div>

          {reviewsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-copper rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-text-primary">{review.customer_name}</h4>
                          {review.is_verified_purchase && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(review.rating, "w-4 h-4")}
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {review.purchase_date ? 
                              `Purchased ${formatDate(review.purchase_date)}` : 
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
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-500 mb-2">
                No reviews yet
              </h3>
              <p className="text-gray-400">
                Be the first to share your experience with this product.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
