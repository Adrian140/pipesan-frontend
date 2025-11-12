import React, { useState, useEffect } from 'react';
import { Package, CheckCircle, Euro, Clock, ArrowRight } from 'lucide-react';
import { apiClient } from '../../config/api';

function ServicesGrid({ services: propServices, loading: propLoading }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (propServices) {
      setServices(propServices);
      setLoading(propLoading || false);
    } else {
      fetchServices();
    }
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.admin.getServices();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Error loading services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg">{error}</div>
        <button 
          onClick={fetchServices}
          className="mt-4 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {services.map((service) => (
        <div key={service.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-copper rounded-lg flex items-center justify-center mr-4">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
                <h3 className="text-xl font-semibold text-text-primary">{service.title || ''}</h3>
                <p className="text-sm text-text-secondary">{service.category || ''}</p>
            </div>
          </div>
          
            <p className="text-text-secondary mb-4">{service.description || ''}</p>
          
          {/* Features */}
          {service.features && service.features.length > 0 && (
            <div className="mb-4">
              <ul className="space-y-2">
                {service.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-text-secondary">{feature || ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Pricing */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center">
              <Euro className="w-5 h-5 text-primary mr-1" />
                <span className="text-lg font-bold text-primary">{service.price || ''}</span>
            </div>
              <span className="text-sm text-text-light">{service.unit || ''}</span>
          </div>
          
          <button className="w-full mt-4 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors">
            Request Quote
          </button>
        </div>
      ))}
      
      {services.length === 0 && (
        <div className="col-span-full text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-secondary mb-2">
            No Services Available
          </h3>
          <p className="text-text-light">
            Services will be displayed here once they are added by the administrator.
          </p>
        </div>
      )}
    </div>
  );
}

export default ServicesGrid;
