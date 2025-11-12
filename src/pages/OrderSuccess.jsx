import React from 'react';
import { CheckCircle, Download, ArrowRight, Package, Mail, AlertTriangle } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

function OrderSuccess() {
  const location = useLocation();
  const { 
    orderNumber, 
    total, 
    email, 
    items = [], 
    orderData, 
    emailSent = false 
  } = location.state || {};

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          
          <h1 className="text-3xl font-bold text-text-primary mb-4">
            Commande Confirmée!
          </h1>
          
          <p className="text-text-secondary mb-8">
            Merci pour votre commande. Nous avons reçu votre paiement et traiterons votre commande sous peu.
          </p>

          {/* Email Status */}
          {emailSent ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  ✅ Notification envoyée à notre équipe - Votre commande sera traitée rapidement
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800 font-medium">
                  ⚠️ Commande enregistrée - Notification en cours d'envoi
                </span>
              </div>
            </div>
          )}

          {/* Order Details */}
          {orderNumber && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-500">Numéro de Commande</p>
                  <p className="font-semibold text-text-primary">{orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold text-text-primary">{email || 'N/A'}</p>
                </div>
                {total && (
                  <div>
                    <p className="text-sm text-gray-500">Montant Total</p>
                    <p className="font-semibold text-text-primary">€{total.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          {items && items.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Articles Commandés ({items.length})
              </h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-3 bg-white rounded-lg">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=60'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 text-left">
                      <h4 className="font-medium text-text-primary">{item.name}</h4>
                      <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">Quantité: {item.quantity}</span>
                        <span className="font-semibold text-primary">€{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shipping Info */}
          {orderData?.shippingInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <div className="flex items-center justify-center mb-2">
                <Package className="w-5 h-5 text-blue-600 mr-2" />
                <h4 className="font-semibold text-blue-800">Informations de Livraison</h4>
              </div>
              <div className="text-sm text-blue-700">
                <p>Livraison vers: {orderData.shipping?.country} ({orderData.shippingInfo.weightRange})</p>
                <p>Poids total: {(orderData.shippingInfo.debug?.totalWeightGrams / 1000 || 0).toFixed(2)}kg</p>
                <p>Délai estimé: {orderData.shippingInfo.estimatedDays?.min}-{orderData.shippingInfo.estimatedDays?.max} jours ouvrés</p>
              </div>
            </div>
          )}

          {/* VAT Information */}
          {orderData?.vatInfo && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
              <h4 className="font-semibold text-gray-800 mb-2">Informations TVA</h4>
              <div className="text-sm text-gray-700">
                <p>Type client: {orderData.vatInfo.customerType === 'company' ? 'Entreprise' : 'Particulier'}</p>
                <p>Taux TVA: {orderData.vatInfo.vatRate}% ({orderData.vatInfo.vatCountry})</p>
                <p>Règle appliquée: {orderData.vatInfo.taxRuleApplied}</p>
                {orderData.vatInfo.displayNote && <p>Note: {orderData.vatInfo.displayNote}</p>}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Que se passe-t-il ensuite ?</strong><br />
                Vous recevrez un email de confirmation de commande sous peu. 
                Nous vous notifierons lorsque votre commande sera expédiée avec les informations de suivi.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors">
                <Download className="w-5 h-5" />
                Télécharger la Facture
              </button>
              
              <Link
                to="/products"
                className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Continuer les Achats
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Besoin d'aide ? Contactez-nous à{' '}
                <a href="mailto:contact@pipesan.eu" className="text-primary hover:text-primary-dark">
                  contact@pipesan.eu
                </a>{' '}
                ou{' '}
                <a href="/contact" className="text-primary hover:text-primary-dark">
                  visitez notre page contact
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;
