import React, { useState, useEffect } from 'react';
import { Wrench, Settings, Droplets, Zap, ArrowRight, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../config/api';
import CategoryCard from './CategoryCard';

function CategoryGrid({ categories: propCategories, loading: propLoading }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dynamic icon mapping based on category slug
  const getCategoryIcon = (slug) => {
    const iconMap = {
      'raccords-tuyauterie': Settings,
      'vannes': Wrench,
      'arrosage-tuyaux': Droplets,
      'connecteurs': Zap,
      'joints-etancheite-ptfe': Package,
      'accessoires': Settings,
      'lots-pack': Package,
      'valves': Wrench,
      'fittings': Settings,
      'elbows': ArrowRight,
      'tees': Zap,
      'nipples': Package,
      'reducers': Settings,
      'hoses': Droplets,
      'gaskets': Package,
      'tools': Wrench,
      // Fallback for any new categories
      default: Package
    };
    
    return iconMap[slug] || iconMap.default;
  };

  useEffect(() => {
    if (propCategories) {
      setCategories(propCategories);
      setLoading(propLoading || false);
    } else {
      fetchCategories();
    }
  }, [propCategories, propLoading]);

  const fetchCategories = async () => {
    try {
      const data = await apiClient.categories.getAll();
      setCategories(data);
      console.log('�� CategoryGrid loaded categories:', data.map(c => ({ name: c.name, slug: c.slug })));
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="w-16 h-16 bg-gray-200 rounded-xl mx-auto mb-4" />
            <div className="h-6 bg-gray-200 rounded mb-2" />
            <div className="h-4 bg-gray-200 rounded mb-4" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text-secondary mb-2">
          No Categories Available
        </h3>
        <p className="text-text-light mb-6">
          Categories will appear here once they are created in the admin panel.
        </p>
        <a
          href="/admin"
          className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
        >
          Create Categories in Admin Panel
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          icon={getCategoryIcon(category.slug)}
        />
      ))}
    </div>
  );
}

export default CategoryGrid;
