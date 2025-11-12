import React from 'react';
import { Star, ShoppingCart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function FeaturedProducts() {
  const featuredProducts = [
    {
      id: 1,
      name: "Professional Brass Ball Valve",
      description: "High-quality brass ball valve with full bore design. Perfect for professional installations with BSP threading and PN25 pressure rating.",
      price: 89.99,
      originalPrice: 109.99,
      image: "https://content-studio.biela.dev/i/content-studio/68a9b2648cd1ba15f2ff2bbc/1755966541741-68a9b2648cd1ba15f2ff2bbc/1756156913998.jpeg/5fb1c28b-1947-40dc-90ab-35116c9ae782__cr00970600_pt0_sx970_v1___.webp",
      rating: 4.8,
      reviews: 24,
      badge: "Best Seller",
      specifications: ["DN25 (1\")", "CW617N Brass", "PN25 Rating", "BSP Threading"]
    },
    {
      id: 2,
      name: "Premium Pipe Fitting Set",
      description: "Complete set of professional pipe fittings including elbows, tees, and reducers. Made from premium brass with precision machined threads.",
      price: 156.99,
      originalPrice: 189.99,
      image: "https://content-studio.biela.dev/i/content-studio/68a9b2648cd1ba15f2ff2bbc/1755966541741-68a9b2648cd1ba15f2ff2bbc/1756156904693.jpeg/c908c596-3924-4a59-85d2-c4d346a1be4d__cr00970600_pt0_sx970_v1___.webp",
      rating: 4.9,
      reviews: 31,
      badge: "Professional Kit",
      specifications: ["Multiple Sizes", "Brass Construction", "CE Certified", "Complete Set"]
    }
  ];

  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary mb-4">
            Featured Professional Products
          </h2>
          <p className="text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto">
            Discover our most popular professional plumbing components. High-quality brass and stainless steel parts with complete technical specifications and CE certifications.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {featuredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group">
              {/* Product Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className="bg-accent text-white px-3 py-1 rounded-full text-sm font-medium">
                    {product.badge}
                  </span>
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </span>
                </div>

                {/* Quick Add Button */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="bg-primary text-white p-3 rounded-full hover:bg-primary-dark transition-colors shadow-lg">
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6">
                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.rating} ({product.reviews} reviews)
                  </span>
                </div>

                {/* Product Name */}
                <h3 className="text-xl font-bold text-text-primary mb-3">
                  {product.name}
                </h3>

                {/* Description */}
                <p className="text-text-secondary mb-4 line-clamp-3">
                  {product.description}
                </p>

                {/* Specifications */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-text-primary mb-2">Key Specifications:</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.specifications.map((spec, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">
                      €{product.price.toFixed(2)}
                    </span>
                    <span className="text-lg text-gray-500 line-through">
                      €{product.originalPrice.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">
                    Save €{(product.originalPrice - product.price).toFixed(2)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button className="flex-1 bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                  <Link
                    to={`/products/${product.id}`}
                    className="flex-1 border border-primary text-primary py-3 px-4 rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    View Details
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedProducts;