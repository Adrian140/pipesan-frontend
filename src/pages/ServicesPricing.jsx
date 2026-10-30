import React from 'react';
import ShippingRates from '../components/services/ShippingRates';

function ServicesPricing() {
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            Shipping Prices
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Every PipeSan order ships from our warehouse in France with Chronopost. Delivery is priced by parcel weight
            and destination country, and the same rates apply at checkout.
          </p>
        </div>

        <ShippingRates />
      </div>
    </div>
  );
}

export default ServicesPricing;
