import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { checkoutText } from '../../translations/checkout';
import { useShippingCountry } from '../../domain/shippingCountry';
import OrderEstimate from './OrderEstimate';

function ShoppingCart({ isOpen, onClose, items = [], onUpdateQuantity, onRemoveItem }) {
  const [isUpdating, setIsUpdating] = useState({});
  const { currentLanguage } = useLanguage();
  const t = checkoutText(currentLanguage);
  const [country, setCountry] = useShippingCountry();

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    setIsUpdating(prev => ({ ...prev, [itemId]: true }));
    await onUpdateQuantity(itemId, newQuantity);
    setIsUpdating(prev => ({ ...prev, [itemId]: false }));
  };

  const handleRemoveItem = async (itemId) => {
    setIsUpdating(prev => ({ ...prev, [itemId]: true }));
    await onRemoveItem(itemId);
    setIsUpdating(prev => ({ ...prev, [itemId]: false }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold text-text-primary">{t.cartTitle}</h2>
            <button
              aria-label={t.closeCart} onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t.emptyTitle}</h3>
                <p className="text-gray-500">{t.emptyText}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                    <img
                      src={item.image || '/product-placeholder.svg'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-text-primary mb-1">{item.name}</h4>
                      <p className="text-sm text-gray-500 mb-2">SKU: {item.sku}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            aria-label={t.decrease(item.name)}
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={isUpdating[item.id] || item.quantity <= 1}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <span className="w-8 text-center font-medium">{item.quantity}</span>

                          <button
                            aria-label={t.increase(item.name)}
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={isUpdating[item.id] || item.quantity >= (item.maxQuantity ?? 999)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">
                            €{(item.price * item.quantity).toFixed(2)}
                          </span>
                          <button
                            aria-label={t.remove(item.name)}
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isUpdating[item.id]}
                            className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t p-6 space-y-4">
              {/* Order Summary */}
              <OrderEstimate items={items} country={country} onCountryChange={setCountry} t={t} language={currentLanguage} />

              {/* Action Buttons */}
              <div className="space-y-2">
                <Link
                  to="/checkout"
                  onClick={onClose}
                  className="block w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors text-center"
                >
                  {t.checkoutBtn}
                </Link>
                <button
                  onClick={onClose}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  {t.continueShopping}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShoppingCart;
