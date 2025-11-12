import React, { useState, useEffect } from 'react';
import { Truck, Edit, Save, X, Plus, Euro } from 'lucide-react';
import { apiClient } from '../../../config/api';
import FlagEmoji from '../../common/FlagEmoji';

const COUNTRIES = [
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'RO', name: 'Romania', flag: '��🇴' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'OTHER', name: 'Other Countries', flag: '🌍' }
];

function ShippingRatesTab() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [shippingRates, setShippingRates] = useState([]);
  const [editingRates, setEditingRates] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetchShippingRates();
    }
  }, [selectedProduct]);

  const fetchProducts = async () => {
    try {
      const data = await apiClient.admin.getProducts();
      setProducts(data || []);
      if (data && data.length > 0) {
        setSelectedProduct(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage('Error loading products');
    }
  };

  const fetchShippingRates = async () => {
    if (!selectedProduct) return;
    
    setLoading(true);
    try {
      const data = await apiClient.shippingRates.getByProduct(selectedProduct);
      
      // Create a map of existing rates
      const ratesMap = {};
      data.forEach(rate => {
        ratesMap[rate.country_code] = rate;
      });

      // Ensure all countries have entries
      const allRates = COUNTRIES.map(country => {
        return ratesMap[country.code] || {
          id: null,
          product_id: selectedProduct,
          country_code: country.code,
          country_name: country.name,
          shipping_cost: country.code === 'OTHER' ? 19.99 : 
                        ['FR', 'DE', 'IT', 'ES', 'NL', 'BE'].includes(country.code) ? 9.99 : 14.99,
          free_shipping_threshold: 100.00,
          estimated_days_min: ['FR', 'DE', 'IT', 'ES', 'NL', 'BE'].includes(country.code) ? 2 : 3,
          estimated_days_max: ['FR', 'DE', 'IT', 'ES', 'NL', 'BE'].includes(country.code) ? 5 : 7,
          is_active: true
        };
      });

      setShippingRates(allRates);
      setMessage('');
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      setMessage('Error loading shipping rates');
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (countryCode, field, value) => {
    setEditingRates(prev => ({
      ...prev,
      [countryCode]: {
        ...prev[countryCode],
        [field]: value
      }
    }));
  };

  const startEdit = (rate) => {
    setEditingRates(prev => ({
      ...prev,
      [rate.country_code]: { ...rate }
    }));
  };

  const cancelEdit = (countryCode) => {
    setEditingRates(prev => {
      const updated = { ...prev };
      delete updated[countryCode];
      return updated;
    });
  };

  const saveRate = async (countryCode) => {
    const editedRate = editingRates[countryCode];
    if (!editedRate) return;

    setLoading(true);
    try {
      if (editedRate.id) {
        await apiClient.shippingRates.update(editedRate.id, {
          shippingCost: editedRate.shipping_cost,
          freeShippingThreshold: editedRate.free_shipping_threshold,
          estimatedDaysMin: editedRate.estimated_days_min,
          estimatedDaysMax: editedRate.estimated_days_max
        });
      } else {
        await apiClient.shippingRates.create({
          productId: selectedProduct,
          countryCode: editedRate.country_code,
          countryName: editedRate.country_name,
          shippingCost: editedRate.shipping_cost,
          freeShippingThreshold: editedRate.free_shipping_threshold,
          estimatedDaysMin: editedRate.estimated_days_min,
          estimatedDaysMax: editedRate.estimated_days_max
        });
      }
      
      setMessage('Shipping rate saved successfully');
      await fetchShippingRates();
      cancelEdit(countryCode);
    } catch (error) {
      console.error('Error saving shipping rate:', error);
      setMessage('Error saving shipping rate');
    } finally {
      setLoading(false);
    }
  };

  const saveAllRates = async () => {
    if (!selectedProduct || Object.keys(editingRates).length === 0) return;

    setLoading(true);
    try {
      const ratesToSave = Object.values(editingRates).map(rate => ({
        countryCode: rate.country_code,
        countryName: rate.country_name,
        shippingCost: rate.shipping_cost,
        freeShippingThreshold: rate.free_shipping_threshold,
        estimatedDaysMin: rate.estimated_days_min,
        estimatedDaysMax: rate.estimated_days_max
      }));

      await apiClient.admin.updateShippingRates(selectedProduct, ratesToSave);
      setMessage('All shipping rates saved successfully');
      await fetchShippingRates();
      setEditingRates({});
    } catch (error) {
      console.error('Error saving shipping rates:', error);
      setMessage('Error saving shipping rates');
    } finally {
      setLoading(false);
    }
  };

  const selectedProductName = products.find(p => p.id === selectedProduct)?.name || '';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Tarife de Livrare</h2>
        {Object.keys(editingRates).length > 0 && (
          <button
            onClick={saveAllRates}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            Save All Changes
          </button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('success') 
            ? 'bg-green-50 border border-green-200 text-green-600'
            : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {message}
        </div>
      )}

      {/* Product Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Select Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Choose a product...</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Product Name
            </label>
            <div className="text-lg font-semibold text-text-primary bg-gray-50 px-4 py-3 rounded-lg">
              {selectedProductName || 'No product selected'}
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Rates Grid */}
      {selectedProduct && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-text-primary">
              Shipping Rates by Country
            </h3>
            <p className="text-sm text-text-secondary">
              Configure shipping costs, free shipping thresholds and delivery estimates for each country
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Country</th>
                    <th className="px-4 py-3 text-left">Shipping Cost</th>
                    <th className="px-4 py-3 text-left">Free Shipping</th>
                    <th className="px-4 py-3 text-left">Delivery Days</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {shippingRates.map((rate) => {
                    const isEditing = editingRates[rate.country_code];
                    const displayRate = isEditing || rate;
                    
                    return (
                      <tr key={rate.country_code}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                             <FlagEmoji code={rate.country_code} />
                            </span>
                            <span className="font-medium">{rate.country_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Euro className="w-4 h-4 text-gray-400" />
                              <input
                                type="number"
                                step="0.01"
                                value={displayRate.shipping_cost}
                                onChange={(e) => handleRateChange(rate.country_code, 'shipping_cost', e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Euro className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">
                                {Number(displayRate.shipping_cost).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Euro className="w-4 h-4 text-gray-400" />
                              <input
                                type="number"
                                step="0.01"
                                value={displayRate.free_shipping_threshold || ''}
                                onChange={(e) => handleRateChange(rate.country_code, 'free_shipping_threshold', e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                placeholder="100"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Euro className="w-4 h-4 text-gray-400" />
                              <span>
                                {displayRate.free_shipping_threshold ? 
                                  Number(displayRate.free_shipping_threshold).toFixed(2) : 
                                  '—'
                                }
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                value={displayRate.estimated_days_min}
                                onChange={(e) => handleRateChange(rate.country_code, 'estimated_days_min', e.target.value)}
                                className="w-12 px-2 py-1 border border-gray-300 rounded text-center"
                              />
                              <span>-</span>
                              <input
                                type="number"
                                min="1"
                                value={displayRate.estimated_days_max}
                                onChange={(e) => handleRateChange(rate.country_code, 'estimated_days_max', e.target.value)}
                                className="w-12 px-2 py-1 border border-gray-300 rounded text-center"
                              />
                              <span className="text-xs text-gray-500">days</span>
                            </div>
                          ) : (
                            <span className="text-gray-600">
                              {displayRate.estimated_days_min}-{displayRate.estimated_days_max} days
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => saveRate(rate.country_code)}
                                disabled={loading}
                                className="text-green-600 hover:text-green-800 p-1 disabled:opacity-50"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => cancelEdit(rate.country_code)}
                                className="text-gray-600 hover:text-gray-800 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(rate)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!selectedProduct && (
        <div className="text-center py-12">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-secondary mb-2">
            No Product Selected
          </h3>
          <p className="text-text-light">
            Please select a product to configure shipping rates.
          </p>
        </div>
      )}
    </div>
  );
}

export default ShippingRatesTab;
