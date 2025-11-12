import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../translations/index';

function CategoryCard({ category, icon: IconComponent }) {
  const { t } = useTranslation();

  return (
    <Link
      to={`/products?category=${category.slug}`}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 group"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-copper rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
          <IconComponent className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          {category.name}
        </h3>
        <p className="text-text-secondary mb-4">
          {category.productCount || 0} products available
        </p>
        {category.description && (
          <p className="text-sm text-text-light mb-4 line-clamp-2">
            {category.description}
          </p>
        )}
        <div className="flex items-center justify-center text-primary group-hover:text-primary-dark transition-colors">
          <span className="text-sm font-medium mr-2">Browse Products</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}

export default CategoryCard;
