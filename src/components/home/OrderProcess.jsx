import React from 'react';
import { ArrowRight } from 'lucide-react';

function OrderProcess({
  title = 'How to Order',
  subtitle = 'Simple 6-step process from selection to installation',
  steps = [
    { step: 'Browse', description: 'Browse our extensive catalog of professional parts' },
    { step: 'Select', description: 'Choose products with detailed technical specifications' },
    { step: 'Configure', description: 'Select variants, quantities and delivery options' },
    { step: 'Order', description: 'Secure checkout with multiple payment methods' },
    { step: 'Ship', description: 'Fast processing and dispatch to your location' },
    { step: 'Install', description: 'Professional installation with our quality parts' },
  ],
}) {
  return (
    <section className="py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary mb-4">
            {title}
          </h2>
          <p className="text-lg sm:text-xl text-text-secondary">{subtitle}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
          {steps.map((item, index) => (
            <div key={index} className="text-center">
              <div className="bg-primary text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-sm sm:text-base">
                {index + 1}
              </div>
              <h3 className="text-sm sm:text-lg font-semibold text-text-primary mb-2">
                {item.step}
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary">{item.description}</p>
              {index < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6 text-text-light mx-auto mt-4 hidden lg:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default OrderProcess;
