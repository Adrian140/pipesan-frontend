import React, { useState } from 'react';
import { Package, CheckCircle, Calculator, Download, Gift, Truck, Star } from 'lucide-react';

function ServicesPricing() {
  const [quantity, setQuantity] = useState(100);
  const [fbmOrders, setFbmOrders] = useState(50);
  const [storagePallets, setStoragePallets] = useState(1);
  const [selectedServices, setSelectedServices] = useState({
    labeling: true,
    fbmShipping: false,
    storage: false
  });

  const calculateTotal = () => {
    let total = 0;
    if (selectedServices.labeling) {
      const rate = quantity <= 100 ? 0.45 : 0.50;
      total += quantity * rate;
    }
    if (selectedServices.fbmShipping) {
      let shippingRate = 1.20;
      if (fbmOrders >= 2000) shippingRate = 0.95;
      else if (fbmOrders >= 1000) shippingRate = 1.10;
      total += fbmOrders * shippingRate;
    }
    if (selectedServices.storage) total += storagePallets * 15;
    return total.toFixed(2);
  };

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            Amazon FBA Prep Services & Pricing
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Complete Amazon FBA prep services in France with competitive pricing. Professional reception, quality control inspection, FNSKU labeling, polybagging & fast shipping to European Amazon fulfillment centers.
          </p>
        </div>

        {/* New Customer Bonus Banner */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-accent to-accent-dark rounded-xl p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <Gift className="w-8 h-8 text-white mr-3" />
              <h2 className="text-2xl font-bold text-white">New Customer Bonus</h2>
            </div>
            <p className="text-white text-lg mb-4">
              First 2 months: €0.45/product (instead of €0.50) + Free setup consultation
            </p>
            <p className="text-orange-100 text-sm">
              Plus: 100 FREE FNSKU labels when you exceed 1000 units in any calendar month
            </p>
          </div>
        </section>

        {/* Standard FBA Services */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <Star className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Standard FBA Services
            </h2>
            <p className="text-text-secondary">
              Complete prep solution with everything included
            </p>
          </div>
          
          <div className="bg-white rounded-xl border-2 border-primary p-8 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-text-primary mb-4">
                  FNSKU Labeling Service
                </h3>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-text-secondary">Reception & visual inspection</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-text-secondary">Professional polybagging</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-text-secondary">FNSKU labeling</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-text-secondary">Dunnage protection</span>
                  </div>
                </div>
              </div>
              <div className="text-center lg:text-right">
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-sm text-text-secondary mb-2">Standard Rate</p>
                  <p className="text-4xl font-bold text-primary mb-2">€0.50</p>
                  <p className="text-text-secondary mb-4">per product</p>
                  <div className="bg-accent text-white px-4 py-2 rounded-lg inline-block">
                    <p className="text-sm font-medium">New customers: €0.45</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Calculator */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <Calculator className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Get a Custom Quote
            </h2>
            <p className="text-text-secondary">
              Calculate your estimated costs based on your needs
            </p>
          </div>
          
          <div className="bg-white rounded-xl border-2 border-primary p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label htmlFor="quantity" className="block text-lg font-medium text-text-primary mb-2">
                    Number of Units (for FNSKU Labeling)
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary shadow-sm text-lg"
                    min="1"
                  />
                </div>
                
                {selectedServices.fbmShipping && (
                  <div>
                    <label htmlFor="fbmOrders" className="block text-lg font-medium text-text-primary mb-2">
                      Number of FBM Orders per Month
                    </label>
                    <input
                      type="number"
                      id="fbmOrders"
                      value={fbmOrders}
                      onChange={(e) => setFbmOrders(parseInt(e.target.value, 10))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary shadow-sm text-lg"
                      min="1"
                    />
                  </div>
                )}
                
                {selectedServices.storage && (
                  <div>
                    <label htmlFor="storagePallets" className="block text-lg font-medium text-text-primary mb-2">
                      Number of Pallets for Storage
                    </label>
                    <input
                      type="number"
                      id="storagePallets"
                      value={storagePallets}
                      onChange={(e) => setStoragePallets(parseInt(e.target.value, 10))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary shadow-sm text-lg"
                      min="1"
                    />
                  </div>
                )}
              </div>
              <div className="lg:col-span-1">
                <h3 className="text-xl font-semibold text-text-primary mb-4">Select Services:</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="labeling"
                      checked={selectedServices.labeling}
                      onChange={(e) => setSelectedServices({ ...selectedServices, labeling: e.target.checked })}
                      className="h-5 w-5 text-primary rounded mr-3 focus:ring-primary"
                    />
                    <label htmlFor="labeling" className="text-text-secondary">FNSKU Labeling</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="fbmShipping"
                      checked={selectedServices.fbmShipping}
                      onChange={(e) => setSelectedServices({ ...selectedServices, fbmShipping: e.target.checked })}
                      className="h-5 w-5 text-primary rounded mr-3 focus:ring-primary"
                    />
                    <label htmlFor="fbmShipping" className="text-text-secondary">FBM Shipping</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="storage"
                      checked={selectedServices.storage}
                      onChange={(e) => setSelectedServices({ ...selectedServices, storage: e.target.checked })}
                      className="h-5 w-5 text-primary rounded mr-3 focus:ring-primary"
                    />
                    <label htmlFor="storage" className="text-text-secondary">Storage</label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <p className="text-lg font-semibold text-text-primary">Estimated Total Cost:</p>
                <p className="text-4xl font-bold text-primary mt-2">€{calculateTotal()}</p>
              </div>
              <button className="bg-accent hover:bg-accent-dark text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300 ease-in-out flex items-center">
                <Download className="w-5 h-5 mr-2" />
                Request a Quote
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ServicesPricing;
