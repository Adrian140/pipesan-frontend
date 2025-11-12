import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import CategoryGrid from '../components/categories/CategoryGrid';
import FeaturedCategories from '../components/categories/FeaturedCategories';
import PageHeader from '../components/layout/PageHeader';
import Section from '../components/layout/Section';
import { useTranslation } from '../translations/index';
import { apiClient } from '../config/api';

function Categories() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await apiClient.categories.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

 return (
    <div className="min-h-screen py-20">
       <PageHeader
        title="Professional Plumbing Categories"
        subtitle="Browse our extensive range of professional plumbing parts, pipe fittings, valves and installation components. All products come with complete technical specifications and CE certifications."
        icon={Package}
      />
      
      <Section>
        <CategoryGrid categories={categories} loading={loading} />
      </Section>
      
      <Section>
        <FeaturedCategories />
      </Section>
      
      <Section background="gradient">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-6">
            Technical Standards & Certifications
          </h2>
          <p className="text-xl text-text-secondary mb-8 max-w-3xl mx-auto">
            All our products meet European technical standards with complete documentation, 
            certificates and technical specifications for professional installations.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">🏆</div>
              <p className="font-semibold text-text-primary">CE Marking</p>
              <p className="text-sm text-text-secondary">European Conformity</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">💧</div>
              <p className="font-semibold text-text-primary">WRAS Approved</p>
              <p className="text-sm text-text-secondary">Water Regulations</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">✅</div>
              <p className="font-semibold text-text-primary">ACS Certified</p>
              <p className="text-sm text-text-secondary">French Standards</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📋</div>
              <p className="font-semibold text-text-primary">ISO 9001</p>
              <p className="text-sm text-text-secondary">Quality Management</p>
            </div>
          </div>
        </div>
      </Section>
   </div>
  );
}

export default Categories;
