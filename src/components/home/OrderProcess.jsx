import React from 'react';

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
    <section className="py-20 lg:py-28 bg-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary mb-4">03 — Process</p>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-text-primary mb-4">
            {title}
          </h2>
          <p className="text-lg text-text-secondary">{subtitle}</p>
        </div>
        <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-10">
          {steps.map((item, index) => (
            <li key={index} className="relative">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-sm font-semibold text-primary">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="h-px flex-1 bg-gray-300" />
              </div>
              <h3 className="text-base font-bold text-text-primary mb-2">
                {item.step}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">{item.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default OrderProcess;
