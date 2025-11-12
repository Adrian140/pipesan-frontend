import React, { useState } from 'react';
import { Building, Users, Truck, Calculator, FileText, Award, CheckCircle, ArrowRight } from 'lucide-react';

function B2BSolutions() {
  const [volumeQuote, setVolumeQuote] = useState({
    category: 'valves',
    quantity: 100,
    frequency: 'monthly'
  });

  const b2bFeatures = [
    {
      icon: Building,
      title: 'Volume Discounts',
      description: 'Competitive pricing for bulk orders and regular customers',
      benefits: ['5-15% volume discounts', 'Quarterly pricing reviews', 'Custom pricing agreements']
    },
    {
      icon: Users,
      title: 'Dedicated Account Manager',
      description: 'Personal support for your business needs',
      benefits: ['Direct contact person', 'Priority customer service', 'Technical consultation']
    },
    {
      icon: Truck,
      title: 'Flexible Delivery Options',
      description: 'Tailored logistics solutions for your business',
      benefits: ['Scheduled deliveries', 'Multiple delivery addresses', 'Express shipping options']
    },
    {
      icon: FileText,
      title: 'Extended Payment Terms',
      description: 'Business-friendly payment options',
      benefits: ['30-60 day payment terms', 'Monthly invoicing', 'Credit account options']
    }
  ];

  const industries = [
    {
      name: 'Plumbing Contractors',
      description: 'Professional plumbers and installation specialists',
      products: ['Ball valves', 'Pipe fittings', 'Flexible hoses', 'Tools'],
      volume: '500+ units/month'
    },
    {
      name: 'HVAC Companies',
      description: 'Heating, ventilation and air conditioning specialists',
      products: ['Valves', 'Reducers', 'Gaskets', 'Connectors'],
      volume: '300+ units/month'
    },
    {
      name: 'Industrial Maintenance',
      description: 'Facility maintenance and industrial applications',
      products: ['High-pressure valves', 'Steel fittings', 'Gaskets', 'Tools'],
      volume: '1000+ units/month'
    },
    {
      name: 'Wholesalers & Distributors',
      description: 'Resellers and distribution partners',
      products: ['Complete product range', 'Private labeling', 'Custom packaging'],
      volume: '2000+ units/month'
    }
  ];

  const calculateVolumeDiscount = () => {
    const basePrice = 25.99;
    let discount = 0;
    
    if (volumeQuote.quantity >= 1000) discount = 15;
    else if (volumeQuote.quantity >= 500) discount = 10;
    else if (volumeQuote.quantity >= 100) discount = 5;
    
    const discountedPrice = basePrice * (1 - discount / 100);
    const totalSavings = (basePrice - discountedPrice) * volumeQuote.quantity;
    
    return { discount, discountedPrice, totalSavings };
  };

  const { discount, discountedPrice, totalSavings } = calculateVolumeDiscount();

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            B2B Solutions for Professional Installers
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Tailored solutions for plumbing professionals, contractors and distributors. 
            Volume pricing, dedicated support and flexible payment terms for your business needs.
          </p>
        </div>

        {/* B2B Features */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-text-primary mb-12 text-center">
            Business Advantages
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {b2bFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-copper rounded-lg flex items-center justify-center mr-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary">{feature.title}</h3>
                    <p className="text-text-secondary">{feature.description}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-text-secondary">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Volume Calculator */}
        <section className="mb-20">
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-8">
            <div className="text-center mb-8">
              <Calculator className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-text-primary mb-4">
                Volume Discount Calculator
              </h2>
              <p className="text-text-secondary">
                Calculate your potential savings with our volume pricing
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Product Category
                  </label>
                  <select
                    value={volumeQuote.category}
                    onChange={(e) => setVolumeQuote({...volumeQuote, category: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="valves">Ball Valves</option>
                    <option value="fittings">Pipe Fittings</option>
                    <option value="elbows">Elbows</option>
                    <option value="tees">Tees</option>
                    <option value="hoses">Flexible Hoses</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={volumeQuote.quantity}
                    onChange={(e) => setVolumeQuote({...volumeQuote, quantity: parseInt(e.target.value)})}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Order Frequency
                  </label>
                  <select
                    value={volumeQuote.frequency}
                    onChange={(e) => setVolumeQuote({...volumeQuote, frequency: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-lg border-2 border-primary p-6 text-center">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-text-secondary">Volume Discount</p>
                    <p className="text-2xl font-bold text-primary">{discount}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Price per Unit</p>
                    <p className="text-2xl font-bold text-primary">€{discountedPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Total Savings</p>
                    <p className="text-2xl font-bold text-accent">€{totalSavings.toFixed(2)}</p>
                  </div>
                </div>
                <button className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors">
                  Request Official Quote
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Industries Served */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-text-primary mb-12 text-center">
            Industries We Serve
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {industries.map((industry, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-text-primary mb-3">{industry.name}</h3>
                <p className="text-text-secondary mb-4">{industry.description}</p>
                
                <div className="mb-4">
                  <h4 className="font-medium text-text-primary mb-2">Popular Products:</h4>
                  <div className="flex flex-wrap gap-2">
                    {industry.products.map((product, productIndex) => (
                      <span key={productIndex} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Typical Volume: {industry.volume}</span>
                  <button className="text-primary hover:text-primary-dark font-medium">
                    Learn More <ArrowRight className="w-4 h-4 inline ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Partnership Benefits */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-primary to-copper rounded-xl p-8 text-white text-center">
            <h2 className="text-3xl font-bold mb-6">
              Become a PipeSan Partner
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join our network of professional partners and enjoy exclusive benefits, 
              priority support and competitive pricing for your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-primary px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors">
                Apply for Partnership
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default B2BSolutions;
