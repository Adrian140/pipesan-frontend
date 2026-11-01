import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import ServicesGrid from '../components/services/ServicesGrid';
import PageHeader from '../components/layout/PageHeader';
import Section from '../components/layout/Section';
import { useTranslation } from '../translations/index';
import { supabase } from '../config/supabase';

function Services() {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      // Citire publică (RLS: doar serviciile active); API-ul de admin refuza vizitatorii.
      const { data, error } = await supabase.from('services').select('*').eq('is_active', true).order('sort_order');
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

 return (
    <div className="min-h-screen py-20">
       <PageHeader
        title="Professional Plumbing Services"
        subtitle="Complete range of professional plumbing services and components. High-quality parts with technical specifications and fast EU delivery."
        icon={Package}
      />
      
      <Section>
        <ServicesGrid services={services} loading={loading} />
      </Section>
      
      <Section background="gradient">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-6">
            Need Custom Services?
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            Contact our team for custom solutions and bulk pricing for your professional projects.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-primary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-dark transition-colors">
              Contact Technical Team
            </button>
            <a
              href="https://wa.me/33675116218"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-accent-dark transition-colors"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </Section>
   </div>
  );
}

export default Services;
