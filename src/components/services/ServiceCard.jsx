import React from 'react';
import { Package, CheckCircle, Euro } from 'lucide-react';

function ServiceCard({ service, onRequestQuote }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
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
            {service.features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-text-secondary">{feature || ''}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Pricing */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 mb-4">
        <div className="flex items-center">
          <Euro className="w-5 h-5 text-primary mr-1" />
          <span className="text-lg font-bold text-primary">{service.price || ''}</span>
        </div>
        <span className="text-sm text-text-light">{service.unit || ''}</span>
      </div>
      
      <button 
        onClick={() => onRequestQuote(service)}
        className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
      >
        Request Quote
      </button>
    </div>
  );
}

export default ServiceCard;
