import React, { useState, useMemo } from 'react';
import { CreditCard, Truck, Shield, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { vatApi } from '../../config/api/vat';
import { useVAT } from '../../contexts/VATContext';
import { apiClient } from '../../config/api';
import { supabase } from '../../config/supabase';

function CheckoutForm({ cartItems = [] }) {
  const navigate = useNavigate();
  const { calculateCheckoutVAT } = useVAT();

  const [step, setStep] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [validatingVAT, setValidatingVAT] = useState(false);
  const [vatStatus, setVatStatus] = useState({ valid: null, message: '' });
  const [allowProceedWithoutValidation, setAllowProceedWithoutValidation] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    customerType: 'individual', // individual | company
    companyName: '',
    vatNumber: '',
    billingAddress: { street: '', city: '', postalCode: '', country: 'FR' },
    shippingAddress: { street: '', city: '', postalCode: '', country: 'FR' },
    sameAsShipping: true,
    shippingMethod: 'standard',
    paymentMethod: 'card',
    marketingConsent: false,
  });

  const subtotal = useMemo(
    () => cartItems.reduce((s, it) => s + (Number(it.price) * Number(it.quantity)), 0),
    [cartItems]
  );

  const shippingMethods = useMemo(() => ([
    { id: 'standard', name: 'Livraison Standard', description: '5–7 jours ouvrés', price: 9.99 },
    { id: 'express',  name: 'Livraison Express',  description: '2–3 jours ouvrés', price: 19.99 },
  ]), []);

  const selectedShipping = shippingMethods.find(m => m.id === formData.shippingMethod) || shippingMethods[0];
  const shippingCost = selectedShipping.price;

  const update = (section, field, value) => {
    if (section) {
      setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateVatIfNeeded = async () => {
    if (formData.customerType !== 'company' || !formData.vatNumber) {
      setVatStatus({ valid: null, message: '' });
      return { valid: false };
    }
    setValidatingVAT(true);
    try {
      // 1) format
      const fmt = await vatApi.validateVATNumber(formData.vatNumber, formData.billingAddress.country);
      if (!fmt.valid) {
        setVatStatus({ valid: false, message: 'Numéro de TVA invalide (format).' });
        return { valid: false };
      }
      // 2) VIES (best effort)
      const vies = await vatApi.validateVIES({
        vatNumber: formData.vatNumber,
        country: formData.billingAddress.country,
        companyName: formData.companyName,
      });

      if (vies.ok && vies.valid) {
        if (vies.details?.nameMatch === false) {
          setVatStatus({
            valid: false,
            message: "Le nom légal ne correspond pas au registre VIES. Vous pouvez continuer, la facture sera émise ultérieurement.",
          });
          return { valid: false, nameMismatch: true };
        }
        setVatStatus({ valid: true, message: 'Numéro de TVA validé via VIES.' });
        return { valid: true };
      }

      // VIES indisponibil → permitem continuare cu avertisment
      setVatStatus({
        valid: null,
        message: "Validation VIES indisponible. Vous pouvez continuer, la facture sera émise ultérieurement si nécessaire.",
      });
      return { valid: null };
    } finally {
      setValidatingVAT(false);
    }
  };

  const computeVat = () => {
    const vatNumberValid = vatStatus.valid === true;
    const billingCountry = formData.billingAddress.country || formData.shippingAddress.country;
    const res = calculateCheckoutVAT({
      subtotal,
      billingCountry,
      customerType: formData.customerType,
      vatNumberValid,
    });
    return res;
  };

  const { vatRate, vatAmount, priceIncludesVAT, taxRuleApplied, displayNote } = computeVat();
  const total = +(subtotal + vatAmount + shippingCost).toFixed(2);

  const canPlaceOrder =
    step < 4 ||
    allowProceedWithoutValidation ||
    formData.customerType !== 'company' ||
    vatStatus.valid !== false;

  const placeOrder = async (e) => {
    e.preventDefault();
    setError('');
    if (cartItems.length === 0) {
      setError('Panier vide.');
      return;
    }

    if (formData.customerType === 'company') {
      const res = await validateVatIfNeeded();
      if (res.valid === false && !allowProceedWithoutValidation) return;
    }

    setPlacing(true);
    try {
      // Decide billing vs shipping copy
      const billingAddress = formData.sameAsShipping
        ? { ...formData.shippingAddress }
        : { ...formData.billingAddress };

      // Compose payload for orders API
      const orderBody = {
        email: formData.email,
        phone: formData.phone,
        billingAddress: {
          ...billingAddress,
          firstName: formData.firstName,
          lastName: formData.lastName,
          companyName: formData.customerType === 'company' ? formData.companyName : undefined,
          vatNumber: formData.customerType === 'company' ? formData.vatNumber : undefined,
        },
        shippingAddress: {
          ...formData.shippingAddress,
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
        subtotal: +subtotal.toFixed(2),
        tax: +vatAmount.toFixed(2),
        shipping: +shippingCost.toFixed(2),
        total: +total.toFixed(2),
        currency: 'EUR',
        shippingMethod: formData.shippingMethod,
      };

      // Logged-in or guest?
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user || null;

      const order = user
        ? await apiClient.orders.create(orderBody)
        : await apiClient.orders.createGuest(orderBody);

      // Insert order items in batch
      const itemsPayload = cartItems.map(it => ({
        order_id: order.id,
        product_id: it.productId,
        sku: it.sku,
        name: it.name,
        quantity: it.quantity,
        unit_price: Number(it.price),
        price: +(Number(it.price) * Number(it.quantity)).toFixed(2),
        weight_grams: it.weightGrams || 500,
      }));

      if (itemsPayload.length) {
        const { error: itemsErr } = await supabase.from('order_items').insert(itemsPayload);
        if (itemsErr) throw new Error(itemsErr.message);
      }

      // Clear cart for logged-in users
      if (user) {
        try { await apiClient.cart.clearCart(); } catch (e) { /* non-blocking */ }
      }

      // Optional: shipping info placeholder for success page
      const shippingInfo = {
        weightRange: '—',
        estimatedDays: formData.shippingMethod === 'express' ? { min: 2, max: 3 } : { min: 5, max: 7 },
        debug: {
          totalWeightGrams: cartItems.reduce((s, it) => s + (Number(it.weightGrams || 500) * Number(it.quantity)), 0),
        },
      };

      navigate('/order-success', {
        state: {
          orderNumber: order.order_number,
          total: order.total_amount,
          email: order.customer_email,
          items: cartItems,
          orderData: {
            shipping: { country: formData.shippingAddress.country },
            shippingInfo,
            vatInfo: {
              vatRate,
              vatAmount,
              vatCountry: (formData.sameAsShipping ? formData.shippingAddress.country : formData.billingAddress.country) || 'FR',
              taxRuleApplied,
              priceIncludesVAT,
              displayNote,
              customerType: formData.customerType,
            },
          },
          emailSent: true,
        },
      });
    } catch (err) {
      console.error('Place order error:', err);
      setError(err?.message || 'Une erreur est survenue lors de la commande.');
    } finally {
      setPlacing(false);
    }
  };

  const countries = [
    { code: 'FR', name: 'France' }, { code: 'DE', name: 'Germany' }, { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' }, { code: 'NL', name: 'Netherlands' }, { code: 'BE', name: 'Belgium' },
    { code: 'RO', name: 'Romania' }, { code: 'PL', name: 'Poland' }, { code: 'AT', name: 'Austria' },
    { code: 'CZ', name: 'Czech Republic' }, { code: 'PT', name: 'Portugal' }, { code: 'SE', name: 'Sweden' },
    { code: 'DK', name: 'Denmark' }, { code: 'FI', name: 'Finland' }, { code: 'IE', name: 'Ireland' },
    { code: 'LU', name: 'Luxembourg' }, { code: 'BG', name: 'Bulgaria' }, { code: 'HU', name: 'Hungary' },
    { code: 'GR', name: 'Greece' }, { code: 'SI', name: 'Slovenia' }, { code: 'SK', name: 'Slovakia' },
    { code: 'EE', name: 'Estonia' }, { code: 'LV', name: 'Latvia' }, { code: 'LT', name: 'Lithuania' },
    { code: 'CY', name: 'Cyprus' }, { code: 'MT', name: 'Malta' }, { code: 'GB', name: 'United Kingdom' },
    { code: 'CH', name: 'Switzerland' }, { code: 'NO', name: 'Norway' }, { code: 'US', name: 'United States' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          {/* Steps */}
          <div className="flex items-center mb-8">
            {[1,2,3,4].map(n => (
              <React.Fragment key={n}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= n ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>{n}</div>
                {n<4 && <div className={`flex-1 h-1 mx-2 ${step>n?'bg-primary':'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Error global */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={placeOrder} className="space-y-8">
            {/* Step 1: Contact + Customer type */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-text-primary">Coordonnées</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Prénom *</label>
                    <input className="w-full input" required value={formData.firstName} onChange={(e)=>update(null,'firstName',e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom *</label>
                    <input className="w-full input" required value={formData.lastName} onChange={(e)=>update(null,'lastName',e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">E-mail *</label>
                  <input type="email" className="w-full input" required value={formData.email} onChange={(e)=>update(null,'email',e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Téléphone</label>
                  <input className="w-full input" value={formData.phone} onChange={(e)=>update(null,'phone',e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={()=>update(null,'customerType','individual')}
                    className={`py-3 rounded-lg border ${formData.customerType==='individual'?'border-primary bg-blue-50':'border-gray-300 hover:bg-gray-50'}`}
                  >
                    Particulier
                  </button>
                  <button
                    type="button"
                    onClick={()=>update(null,'customerType','company')}
                    className={`py-3 rounded-lg border ${formData.customerType==='company'?'border-primary bg-blue-50':'border-gray-300 hover:bg-gray-50'}`}
                  >
                    Entreprise
                  </button>
                </div>

                {formData.customerType === 'company' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Raison sociale *</label>
                      <input className="w-full input" required value={formData.companyName} onChange={(e)=>update(null,'companyName',e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Numéro de TVA (UE)</label>
                      <input className="w-full input" placeholder="FRXX999999999" value={formData.vatNumber} onChange={(e)=>update(null,'vatNumber',e.target.value)} />
                      {vatStatus.message && (
                        <p className={`text-sm mt-1 ${vatStatus.valid===false?'text-red-600':vatStatus.valid===true?'text-green-600':'text-amber-600'}`}>
                          {vatStatus.message}
                        </p>
                      )}
                      {vatStatus.valid===false && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm flex gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          <div>
                            Problème de validation TVA. Vous pouvez <button type="button" className="underline" onClick={()=>setAllowProceedWithoutValidation(true)}>continuer sans validation</button>. La facture sera émise ultérieurement et vous serez contacté par le vendeur.
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={validateVatIfNeeded}
                      disabled={validatingVAT}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      {validatingVAT ? 'Vérification…' : 'Vérifier le numéro de TVA'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Shipping address */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-text-primary">Adresse de livraison</h2>
                <div>
                  <label className="block text-sm font-medium mb-2">Adresse *</label>
                  <input className="w-full input" required value={formData.shippingAddress.street} onChange={(e)=>update('shippingAddress','street',e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Ville *</label>
                    <input className="w-full input" required value={formData.shippingAddress.city} onChange={(e)=>update('shippingAddress','city',e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Code postal *</label>
                    <input className="w-full input" required value={formData.shippingAddress.postalCode} onChange={(e)=>update('shippingAddress','postalCode',e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Pays *</label>
                    <select className="w-full input" value={formData.shippingAddress.country} onChange={(e)=>update('shippingAddress','country',e.target.value)}>
                      {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Billing same as shipping */}
                <div className="mt-2">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={formData.sameAsShipping} onChange={(e)=>update(null,'sameAsShipping',e.target.checked)} />
                    <span>Adresse de facturation identique</span>
                  </label>
                </div>

                {!formData.sameAsShipping && (
                  <div className="space-y-4">
                    <h3 className="font-medium mt-4">Adresse de facturation</h3>
                    <div>
                      <label className="block text-sm font-medium mb-2">Adresse *</label>
                      <input className="w-full input" required value={formData.billingAddress.street} onChange={(e)=>update('billingAddress','street',e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Ville *</label>
                        <input className="w-full input" required value={formData.billingAddress.city} onChange={(e)=>update('billingAddress','city',e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Code postal *</label>
                        <input className="w-full input" required value={formData.billingAddress.postalCode} onChange={(e)=>update('billingAddress','postalCode',e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Pays *</label>
                        <select className="w-full input" value={formData.billingAddress.country} onChange={(e)=>update('billingAddress','country',e.target.value)}>
                          {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Shipping method */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-text-primary">Mode de livraison</h2>
                <div className="space-y-3">
                  {shippingMethods.map(m => (
                    <label key={m.id} className={`flex items-center p-4 border rounded-lg cursor-pointer ${formData.shippingMethod===m.id?'border-primary bg-blue-50':'border-gray-300 hover:bg-gray-50'}`}>
                      <input type="radio" name="shippingMethod" value={m.id} checked={formData.shippingMethod===m.id} onChange={(e)=>update(null,'shippingMethod',e.target.value)} className="mr-3" />
                      <Truck className="w-5 h-5 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <div className="font-medium">{m.name}</div>
                        <div className="text-sm text-gray-500">{m.description}</div>
                      </div>
                      <div className="font-semibold text-primary">€{m.price.toFixed(2)}</div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Payment */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-text-primary">Paiement</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm text-blue-800">Vos informations de paiement sont sécurisées et chiffrées.</span>
                  </div>
                </div>
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="paymentMethod" value="card" checked={formData.paymentMethod==='card'} onChange={(e)=>update(null,'paymentMethod',e.target.value)} className="mr-3" />
                  <CreditCard className="w-5 h-5 text-gray-400 mr-3" />
                  <span>Carte bancaire</span>
                </label>
              </div>
            )}

            {/* Nav buttons */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={()=>setStep(Math.max(1, step-1))}
                disabled={step===1 || placing}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Précédent
              </button>
              {step<4 ? (
                <button
                  type="button"
                  onClick={()=>setStep(step+1)}
                  disabled={placing}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
                >
                  Suivant
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canPlaceOrder || placing}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
                >
                  {placing ? 'Traitement…' : 'Passer la commande'}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-xl p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Récapitulatif</h3>
            <div className="space-y-3 mb-4">
              {cartItems.map(it => (
                <div key={it.id} className="flex justify-between text-sm">
                  <span>{it.name} × {it.quantity}</span>
                  <span>€{(it.price * it.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Sous-total</span><span>€{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Livraison</span><span>€{shippingCost.toFixed(2)}</span></div>
              <div className="flex justify-between">
                <span>TVA ({vatRate}%)</span>
                <span>€{vatAmount.toFixed(2)}</span>
              </div>
              <div className="text-xs text-gray-500">{displayNote}</div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span><span>€{total.toFixed(2)}</span>
              </div>
              {formData.customerType==='company' && vatStatus.valid===false && !allowProceedWithoutValidation && (
                <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs">
                  Erreur TVA: vous pouvez continuer et la facture sera envoyée ultérieurement; le vendeur vous contactera si nécessaire.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`.input{padding:.75rem;border:1px solid #d1d5db;border-radius:.5rem;outline:0} .input:focus{box-shadow:0 0 0 2px rgba(59,130,246,.5);border-color:transparent}`}</style>
    </div>
  );
}

export default CheckoutForm;
