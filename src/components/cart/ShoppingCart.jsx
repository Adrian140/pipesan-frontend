// FILE: src/components/cart/ShoppingCart.jsx
import React from "react";
import { X, ShoppingBag, Trash2, Minus, Plus, Info } from "lucide-react";
import { Link } from "react-router-dom";

function ShoppingCart({ isOpen, onClose, items = [], onUpdateQuantity, onRemoveItem }) {
  if (!isOpen) return null;

  const subtotal = items.reduce((s, it) => s + Number(it.price) * Number(it.quantity || 0), 0);
  const estVat = subtotal * 0.20; // DOAR estimare (FR 20%), TVA real se calculează la checkout
  const totalEst = subtotal + estVat; // fără livrare; livrarea se calculează la checkout

  const dec = async (it) => onUpdateQuantity(it.id, Math.max(1, (it.quantity || 1) - 1));
  const inc = async (it) => onUpdateQuantity(it.id, (it.quantity || 1) + 1);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold">Panier</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Votre panier est vide</h3>
                <p className="text-gray-500">Ajoutez des produits pour commencer.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                    <img
                      src={item.image || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100"}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{item.name}</h4>
                      <p className="text-sm text-gray-500 mb-1">SKU: {item.sku}</p>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button className="w-8 h-8 border rounded" onClick={() => dec(item)}>
                            <Minus className="w-4 h-4 mx-auto" />
                          </button>
                          <span className="w-10 text-center font-medium">{item.quantity}</span>
                          <button className="w-8 h-8 border rounded" onClick={() => inc(item)}>
                            <Plus className="w-4 h-4 mx-auto" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">
                            €{(Number(item.price) * Number(item.quantity || 0)).toFixed(2)}
                          </span>
                          <button className="p-1 text-red-500 hover:bg-red-50 rounded" onClick={() => onRemoveItem(item.id)}>
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

          {/* Summary */}
          {items.length > 0 && (
            <div className="border-t p-6 space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    TVA estimée (20% FR)
                    <Info className="w-3 h-3 text-gray-400" title="Le montant exact de TVA sera calculé à l’étape de paiement en fonction de l’adresse de livraison / du statut B2C/B2B." />
                  </span>
                  <span>€{estVat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Livraison</span>
                  <span className="text-gray-500">calculée à la caisse</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total TTC (estimé)</span>
                  <span>€{totalEst.toFixed(2)}</span>
                </div>
              </div>

              <Link
                to="/checkout"
                onClick={onClose}
                className="block w-full bg-primary text-white py-3 rounded-lg font-semibold text-center hover:bg-primary-dark"
              >
                Passer à la caisse
              </Link>
              <button onClick={onClose} className="w-full border py-3 rounded-lg hover:bg-gray-50">
                Continuer vos achats
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShoppingCart;
