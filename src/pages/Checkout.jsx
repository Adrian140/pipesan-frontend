// FILE: src/pages/Checkout.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useCart } from "../contexts/CartContext";
import { useVAT } from "../contexts/VATContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Info, Building, User, AlertTriangle } from "lucide-react";
import { apiClient } from "../config/api";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const COUNTRY_OPTIONS = [
  { code: "FR", name: "France", isEU: true },
  { code: "DE", name: "Allemagne", isEU: true },
  { code: "IT", name: "Italie", isEU: true },
  { code: "ES", name: "Espagne", isEU: true },
  { code: "NL", name: "Pays-Bas", isEU: true },
  { code: "BE", name: "Belgique", isEU: true },
  { code: "RO", name: "Roumanie", isEU: true },
  { code: "PL", name: "Pologne", isEU: true },
  { code: "PT", name: "Portugal", isEU: true },
  { code: "IE", name: "Irlande", isEU: true },
  { code: "SE", name: "Suède", isEU: true },
  { code: "DK", name: "Danemark", isEU: true },
  { code: "FI", name: "Finlande", isEU: true },
  { code: "AT", name: "Autriche", isEU: true },
  { code: "CZ", name: "Tchéquie", isEU: true },
  { code: "HU", name: "Hongrie", isEU: true },
  { code: "SK", name: "Slovaquie", isEU: true },
  { code: "SI", name: "Slovénie", isEU: true },
  { code: "BG", name: "Bulgarie", isEU: true },
  { code: "HR", name: "Croatie", isEU: true },
  { code: "GR", name: "Grèce", isEU: true },
  { code: "LT", name: "Lituanie", isEU: true },
  { code: "LV", name: "Lettonie", isEU: true },
  { code: "EE", name: "Estonie", isEU: true },
  { code: "LU", name: "Luxembourg", isEU: true },
  { code: "MT", name: "Malte", isEU: true },
  { code: "GB", name: "Royaume-Uni", isEU: false },
  { code: "CH", name: "Suisse", isEU: false },
  { code: "NO", name: "Norvège", isEU: false },
  { code: "US", name: "États-Unis", isEU: false },
  { code: "OTHER", name: "Autre", isEU: false }
];

function CardBox({ title, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
      {title ? <h2 className="text-lg font-semibold mb-4">{title}</h2> : null}
      {children}
    </div>
  );
}
export default function Checkout() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutInner />
    </Elements>
  );
}

function CheckoutInner() {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { items, clearCart } = useCart();
  const {
    vatInfo = {},
    calculateVAT,
    updateCustomerInfo,
    updateShippingCountry,
    validVATFormat,
    loading: vatLoading
  } = useVAT();
  const { user } = useAuth();

  // Flow
  const [step, setStep] = useState(1);
  const [uiMsg, setUiMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Tip client
  const [customerType, setCustomerType] = useState("individual"); // 'individual' | 'company'

  // Facturare (un singur card)
  const [bill, setBill] = useState({
    first: "", last: "", email: "", phone: "",
    company: "", vat: "", line1: "", line2: "",
    city: "", postal: ""
  });

  // Livrare (un singur card + țară)
  const [ship, setShip] = useState({
    first: "", last: "", company: "", vat: "",
    country: "FR", line1: "", line2: "",
    city: "", postal: ""
  });

  // Tarife de livrare din admin
  const [shippingInfo, setShippingInfo] = useState(null);
  const [calculatingShip, setCalculatingShip] = useState(false);

  // Adrese/profiluri salvate (Dashboard)
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [savedBillingProfiles, setSavedBillingProfiles] = useState([]);
  const [selectedBillingId, setSelectedBillingId] = useState("");
  const [selectedShippingId, setSelectedShippingId] = useState("");

  const selectedBillingProfile = useMemo(
    () => savedBillingProfiles.find((p) => String(p.id) === String(selectedBillingId)),
    [savedBillingProfiles, selectedBillingId]
  );
  const selectedShippingAddress = useMemo(
    () => savedAddresses.find((a) => String(a.id) === String(selectedShippingId)),
    [savedAddresses, selectedShippingId]
  );

  // Stabilizare afișaj TVA (fără flicker „Calcul…”)
  const lastVatAmountRef = useRef(0);
  const lastVatRateRef = useRef(0);
  const lastVatCountryRef = useRef("FR");
  const lastTaxRuleRef = useRef("");

  // Subtotal & greutate totală
  const subtotal = useMemo(
    () => items.reduce((s, it) => s + Number(it.price) * Number(it.quantity || 0), 0),
    [items]
  );
  const totalWeightGrams = useMemo(
    () => items.reduce((s, it) => s + (Number(it.weightGrams || it.weight_grams || 500) * Number(it.quantity || 0)), 0),
    [items]
  );

  // 1) memorăm ultima valoare de TVA bună
  useEffect(() => {
    if (typeof vatInfo.vatAmount === "number") lastVatAmountRef.current = vatInfo.vatAmount;
    if (typeof vatInfo.vatRate === "number") lastVatRateRef.current = vatInfo.vatRate;
    if (vatInfo.vatCountry) lastVatCountryRef.current = vatInfo.vatCountry;
    if (vatInfo.taxRuleApplied) lastTaxRuleRef.current = vatInfo.taxRuleApplied;
  }, [vatInfo.vatAmount, vatInfo.vatRate, vatInfo.vatCountry, vatInfo.taxRuleApplied]);

  // 2) Afișaj TVA stabil + regulă FR (20% mereu când livrarea este în FR)
  const displayedVat = useMemo(() => {
    if (ship.country === "FR") {
      const amount = subtotal * 0.20;
      return { amount, rate: 20, country: "FR", rule: "FR_DOMESTIC" };
    }
    return {
      amount: typeof vatInfo.vatAmount === "number" ? vatInfo.vatAmount : lastVatAmountRef.current,
      rate: typeof vatInfo.vatRate === "number" ? vatInfo.vatRate : lastVatRateRef.current,
      country: vatInfo.vatCountry || lastVatCountryRef.current || "FR",
      rule: vatInfo.taxRuleApplied || lastTaxRuleRef.current || ""
    };
  }, [ship.country, subtotal, vatInfo]);

  const tax = Number(displayedVat.amount || 0);
  const shippingCost = Number(shippingInfo?.shippingCost || 9.99);
  const total = subtotal + tax + shippingCost;

  // 3) Încărcăm adresele/profilurile salvate + preselectăm implicitele
  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const [addresses, profiles] = await Promise.all([
          apiClient.addresses.getAll(),
          apiClient.billingProfiles.getAll()
        ]);

        setSavedAddresses(addresses || []);
        setSavedBillingProfiles(profiles || []);

        const defShip =
          addresses?.find(a => (a.type === "shipping" || a.type === "both") && a.isDefault) ||
          addresses?.find(a => a.type === "shipping" || a.type === "both");
        const defBill = profiles?.find(p => p.isDefault) || profiles?.[0];

        if (defShip) {
          setSelectedShippingId(defShip.id);
          setShip(s => ({
            ...s,
            first: defShip.firstName || s.first,
            last: defShip.lastName || s.last,
            company: defShip.company || s.company,
            country: defShip.country || s.country,
            line1: defShip.address || s.line1,
            city: defShip.city || s.city,
            postal: defShip.postalCode || s.postal
          }));
          updateShippingCountry(defShip.country || "FR");
        }

      if (defBill) {
        setSelectedBillingId(defBill.id);
        const isCo = defBill.type === "company";

        // doar dacă utilizatorul nu a schimbat deja manual tipul
        setCustomerType(prev => (prev === "individual" && isCo) ? prev : (isCo ? "company" : "individual"));

        setBill(b => ({
          ...b,
          first: defBill.firstName || b.first,
          last: defBill.lastName || b.last,
          company: isCo ? (defBill.companyName || b.company || "") : b.company,
          vat: isCo ? (defBill.vatNumber || b.vat || "") : b.vat,
          line1: defBill.address || b.line1,
          city: defBill.city || b.city,
          postal: defBill.postalCode || b.postal,
          phone: defBill.phone || b.phone,
          email: user.email || b.email
        }));
        } else {
          // tot punem email
          setBill(b => ({ ...b, email: user.email || b.email }));
        }
      } catch (e) {
        console.warn("Could not load saved addresses/billing", e);
        setBill(b => ({ ...b, email: user.email || b.email }));
      }
    })();
  }, [user, updateShippingCountry]);

  // 4) Selectoare „apply” pentru adrese salvate
  const onSelectBillingProfile = (id) => {
    setSelectedBillingId(id);
    const p = savedBillingProfiles.find(x => String(x.id) === String(id));
    if (!p) return;
    const isCo = p.type === "company";
    setCustomerType(isCo ? "company" : "individual");
    setBill(b => ({
      ...b,
      first: p.firstName || "",
      last: p.lastName || "",
      company: isCo ? (p.companyName || "") : "",
      vat: isCo ? (p.vatNumber || "") : "",
      line1: p.address || "",
      line2: "",
      city: p.city || "",
      postal: p.postalCode || "",
      phone: p.phone || b.phone,
      email: user?.email || b.email
    }));
  };

  const onSelectShippingAddress = (id) => {
    setSelectedShippingId(id);
    const a = savedAddresses.find(x => String(x.id) === String(id));
    if (!a) return;
    setShip(s => ({
      ...s,
      first: a.firstName || "",
      last: a.lastName || "",
      company: a.company || "",
      country: a.country || "FR",
      line1: a.address || "",
      line2: "",
      city: a.city || "",
      postal: a.postalCode || ""
    }));
    updateShippingCountry(a.country || "FR");
  };

  // 5) Recalcul TVA + livrare (debounced)
  const calcTimerRef = useRef(null);
  useEffect(() => {
    if (!items.length) return;
    if (calcTimerRef.current) clearTimeout(calcTimerRef.current);
    calcTimerRef.current = setTimeout(async () => {
      setCalculatingShip(true);
      try {
        // livrare din tarifele din admin (fallback OTHER)
        const shipRes = await apiClient.shippingRates.calculateShippingByWeight(
          totalWeightGrams,
          ship.country
        );
        setShippingInfo(shipRes);

        const buyer = {
          type: customerType,
          vatNumber: customerType === "company" ? (bill.vat || ship.vat) : null,
          companyName: customerType === "company" ? (bill.company || ship.company) : null
        };
        updateCustomerInfo(buyer);

        // TVA de pe backend (ține cont de B2B/B2C + țară livrare)
        await calculateVAT(items, ship.country, buyer);
      } catch {
        setShippingInfo({
          shippingCost: 9.99,
          currency: "EUR",
          weightRange: "Standard",
          estimatedDays: { min: 3, max: 7 }
        });
      } finally {
        setCalculatingShip(false);
      }
    }, 350);
    return () => clearTimeout(calcTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    items,
    ship.country,
    customerType,
    bill.vat,
    bill.company,
    ship.vat,
    ship.company,
    totalWeightGrams
  ]);

  // 6) Validări
  const requireText = (v) => String(v || "").trim().length > 0;
  const validateBilling = () => {
    if (!requireText(bill.first) || !requireText(bill.last)) return "Veuillez saisir prénom et nom (facturation).";
    if (!requireText(bill.email)) return "Veuillez saisir l’email (facturation).";
    if (!requireText(bill.line1) || !requireText(bill.city) || !requireText(bill.postal))
      return "Veuillez compléter l’adresse de facturation.";
    if (customerType === "company" && !requireText(bill.company))
      return "Veuillez saisir la raison sociale (entreprise).";
    return null;
  };
  const validateShipping = () => {
    if (!requireText(ship.first) || !requireText(ship.last)) return "Veuillez saisir prénom et nom (livraison).";
    if (!requireText(ship.country)) return "Veuillez choisir le pays de livraison.";
    if (!requireText(ship.line1) || !requireText(ship.city) || !requireText(ship.postal))
      return "Veuillez compléter l’adresse de livraison.";
    return null;
  };

  // 7) Navigare pași
  const nextFromBilling = (e) => {
    e.preventDefault();
    setUiMsg("");
    if (!items.length) return setUiMsg("Votre panier est vide.");
    const err = validateBilling();
    if (err) return setUiMsg(err);
    setStep(2);
  };

  const nextFromShipping = async (e) => {
    e.preventDefault();
    setUiMsg("");
    if (!items.length) return setUiMsg("Votre panier est vide.");
    const err = validateShipping();
    if (err) return setUiMsg(err);
    // recalcul final TVA înainte de plată
    const buyer = {
      type: customerType,
      vatNumber: customerType === "company" ? (bill.vat || ship.vat) : null,
      companyName: customerType === "company" ? (bill.company || ship.company) : null
    };
    await calculateVAT(items, ship.country, buyer);
    setStep(3);
  };

  // 8) Plată
  const pay = async (e) => {
    e.preventDefault();
    setUiMsg("");
    if (!stripe || !elements) return;
    if (total < 0.5) return setUiMsg("Montant minimum 0,50 €.");

    setLoading(true);
    try {
      const orderNumber = `ORD-${Date.now()}`;
      const shippingCountryForStripe = ship.country === "OTHER" ? "DE" : ship.country;

      const orderData = {
        orderNumber,
        items: items.map(i => ({
          productId: i.productId, name: i.name, sku: i.sku,
          price: i.price, quantity: i.quantity,
          weight: i.weightGrams || i.weight_grams || 500
        })),
        subtotal, tax, shipping: shippingCost, total,
        vatInfo: { ...vatInfo, customerType, calculatedAt: new Date().toISOString() },
        billing: {
          firstName: bill.first, lastName: bill.last, company: bill.company, vat: bill.vat,
          email: bill.email, phone: bill.phone, address: bill.line1, addressLine2: bill.line2,
          city: bill.city, postalCode: bill.postal, customerType
        },
        shipping: {
          firstName: ship.first, lastName: ship.last, company: ship.company, vat: ship.vat,
          country: ship.country, address: ship.line1, addressLine2: ship.line2,
          city: ship.city, postalCode: ship.postal
        },
        shippingInfo
      };

      const res = await fetch(
        "https://baazcwosfkaageltesbc.functions.supabase.co/create-payment-intent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            currency: "eur",
            orderData,
            vatInfo,
            metadata: {
              customer_type: customerType,
              vat_rate: displayedVat.rate,
              vat_amount: displayedVat.amount,
              vat_country: displayedVat.country,
              tax_rule: displayedVat.rule || vatInfo.taxRuleApplied,
              items_count: items.length,
              total_weight_grams: totalWeightGrams,
              order_number: orderNumber,
              ship_country_choice: ship.country,
              ship_country_mapped: shippingCountryForStripe
            }
          })
        }
      );
      const data = await res.json();
      if (!data?.clientSecret) {
        setLoading(false);
        return setUiMsg("Erreur Stripe: client secret manquant.");
      }

      const card = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: `${bill.first} ${bill.last}`,
            email: bill.email,
            phone: bill.phone || undefined,
            address: {
              line1: bill.line1,
              line2: bill.line2 || undefined,
              city: bill.city,
              postal_code: bill.postal
            }
          }
        },
        shipping: {
          name: `${ship.first} ${ship.last}`,
          address: {
            line1: ship.line1,
            line2: ship.line2 || undefined,
            city: ship.city,
            postal_code: ship.postal,
            country: shippingCountryForStripe
          }
        }
      });

      if (result.error) {
        setLoading(false);
        return setUiMsg(`Paiement refusé: ${result.error.message}`);
      }
        if (result.paymentIntent?.status === "succeeded") {
          try {
            const orderRecord = {
              email: bill.email,
              phone: bill.phone,
              billingAddress: {
                firstName: bill.first,
                lastName: bill.last,
                street: bill.line1,
                city: bill.city,
                postalCode: bill.postal,
                country: ship.country,
              },
              shippingAddress: {
                firstName: ship.first,
                lastName: ship.last,
                street: ship.line1,
                city: ship.city,
                postalCode: ship.postal,
                country: ship.country,
              },
              subtotal,
              tax,
              shipping: shippingCost,
              total,
              currency: "EUR",
              shippingMethod: shippingInfo?.shippingType || "standard",
              items: items.map(i => ({
                productId: i.productId,
                sku: i.sku,
                name: i.name,
                quantity: i.quantity,
                price: i.price,
                totalPrice: i.price * i.quantity
              }))
            };

            // Creează comanda în baza de date (guest sau user)
            if (user) {
              await apiClient.orders.create(orderRecord);
            } else {
              await apiClient.orders.createGuest(orderRecord);
            }

            await clearCart();
            navigate("/order-success", {
              state: { orderNumber, total, email: bill.email, items, orderData, vatInfo }
            });
          } catch (dbErr) {
            console.error("Eroare salvare comandă:", dbErr);
            setUiMsg("Plata a fost efectuată, dar comanda nu a fost salvată în baza de date.");
          }
        }


    } catch (err) {
      setUiMsg(`Erreur inattendue: ${err.message || "inconnue"}`);
    } finally {
      setLoading(false);
    }
  };

  // Fără produse -> redirect simplu vizual
  if (!items.length) {
    return (
      <div className="min-h-screen py-20 text-center">
        <h1 className="text-2xl font-semibold mb-2">Votre panier est vide</h1>
        <p className="text-gray-600">Ajoutez des produits avant de passer au paiement.</p>
      </div>
    );
  }

  const formatCountry = (code) => COUNTRY_OPTIONS.find(c => c.code === code)?.name || code;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Paiement</h1>

      {/* Banner TVA stabil */}
      <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-800">
            <Info className="w-5 h-5 text-blue-600" />
            <div className="text-sm">
              TVA: {displayedVat.rate}% ({displayedVat.country}) – {displayedVat.rule || "—"}
              {customerType === "company" && ship.country !== "FR" && vatInfo.shouldApplyVAT === false && (
                <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Autoliquidation (B2B intra-UE) – TVA due dans votre pays.
                </div>
              )}
            </div>
          </div>
          {(calculatingShip || vatLoading) && (
            <div className="text-xs text-blue-700">Mise à jour des montants…</div>
          )}
        </div>
      </div>

      {uiMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{uiMsg}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Stepper */}
          <div className="flex items-center gap-2 text-sm">
            <span className={`px-2 py-0.5 rounded ${step===1?"bg-blue-600 text-white":"bg-gray-200"}`}>1. Facturation</span>
            <span>›</span>
            <span className={`px-2 py-0.5 rounded ${step===2?"bg-blue-600 text-white":"bg-gray-200"}`}>2. Livraison</span>
            <span>›</span>
            <span className={`px-2 py-0.5 rounded ${step===3?"bg-blue-600 text-white":"bg-gray-200"}`}>3. Paiement</span>
          </div>

          {/* STEP 1: BILLING */}
          {step === 1 && (
            <form onSubmit={nextFromBilling} className="space-y-5">
              <CardBox title="Informations de facturation">
                {/* Profil de facturation salvat */}
                {user && savedBillingProfiles.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-sm mb-1">Profil de facturation enregistré</label>
                    <select
                      className="w-full border rounded px-3 py-2 bg-white"
                      value={selectedBillingId}
                      onChange={(e) => onSelectBillingProfile(e.target.value)}
                    >
                      <option value="">— Sélectionner —</option>
                      {savedBillingProfiles.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.type === "company"
                            ? `${p.companyName || "Entreprise"} (${p.vatNumber || "TVA ?"})`
                            : `${p.firstName || ""} ${p.lastName || ""}`}
                          {p.isDefault ? " • (par défaut)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Tip client */}
                <div className="mb-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCustomerType("individual")}
                    className={`px-3 py-2 rounded border ${customerType==="individual"?"border-blue-600 bg-blue-50":"border-gray-300"}`}
                  >
                    <User className="inline w-4 h-4 mr-1" /> Particulier
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerType("company")}
                    className={`px-3 py-2 rounded border ${customerType==="company"?"border-blue-600 bg-blue-50":"border-gray-300"}`}
                  >
                    <Building className="inline w-4 h-4 mr-1" /> Entreprise
                  </button>
                </div>

                {/* Câmpuri dinamice */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Prénom *</label>
                    <input className="w-full border rounded px-3 py-2"
                      value={bill.first} onChange={(e)=>setBill({...bill,first:e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Nom *</label>
                    <input className="w-full border rounded px-3 py-2"
                      value={bill.last} onChange={(e)=>setBill({...bill,last:e.target.value})} required />
                  </div>

                  {customerType === "company" && (
                    <>
                      <div className="md:col-span-2">
                        <label className="block text-sm mb-1">Raison sociale *</label>
                        <input className="w-full border rounded px-3 py-2"
                          value={bill.company} onChange={(e)=>setBill({...bill,company:e.target.value})} required />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm mb-1">Numéro de TVA (UE)</label>
                        <input className="w-full border rounded px-3 py-2"
                          value={bill.vat} onChange={(e)=>setBill({...bill,vat:e.target.value})}
                          placeholder="FRXX999999999" />
                        {!!bill.vat && (
                          <p className="text-xs mt-1">
                            {validVATFormat(bill.vat, ship.country) ? "Format TVA valide" : "Format TVA invalide pour ce pays"}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">E-mail *</label>
                    <input type="email" className="w-full border rounded px-3 py-2"
                      value={bill.email} onChange={(e)=>setBill({...bill,email:e.target.value})} required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Téléphone (optionnel)</label>
                    <input className="w-full border rounded px-3 py-2"
                      value={bill.phone} onChange={(e)=>setBill({...bill,phone:e.target.value})} />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Adresse *</label>
                    <input className="w-full border rounded px-3 py-2"
                      value={bill.line1} onChange={(e)=>setBill({...bill,line1:e.target.value})} required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Complément d’adresse (optionnel)</label>
                    <input className="w-full border rounded px-3 py-2"
                      value={bill.line2} onChange={(e)=>setBill({...bill,line2:e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Ville *</label>
                    <input className="w-full border rounded px-3 py-2"
                      value={bill.city} onChange={(e)=>setBill({...bill,city:e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Code postal *</label>
                    <input className="w-full border rounded px-3 py-2"
                      value={bill.postal} onChange={(e)=>setBill({...bill,postal:e.target.value})} required />
                  </div>
                </div>

                <div className="pt-3">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded">Suivant : Livraison</button>
                </div>
              </CardBox>
            </form>
          )}

          {/* STEP 2: SHIPPING */}
          {step === 2 && (
            <form onSubmit={nextFromShipping} className="space-y-5">
              <CardBox title="Adresse de livraison">
                {/* Adresă salvată */}
                {user && savedAddresses.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-sm mb-1">Adresse enregistrée</label>
                    <select
                      className="w-full border rounded px-3 py-2 bg-white"
                      value={selectedShippingId}
                      onChange={(e) => onSelectShippingAddress(e.target.value)}
                    >
                      <option value="">— Sélectionner —</option>
                      {savedAddresses
                        .filter(a => a.type === "shipping" || a.type === "both")
                        .map(a => (
                          <option key={a.id} value={a.id}>
                            {`${a.firstName || ""} ${a.lastName || ""} — ${a.city || ""}, ${a.country || ""}`}
                            {a.isDefault ? " • (par défaut)" : ""}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Pays *</label>
                    <select
                      className="w-full border rounded px-3 py-2 bg-white"
                      value={ship.country}
                      onChange={(e)=>setShip({...ship,country:e.target.value})}
                      required
                    >
                      {COUNTRY_OPTIONS.map(c => (
                        <option key={c.code} value={c.code}>{c.name}{!c.isEU ? " (hors-UE)" : ""}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Les taux de TVA se mettent à jour automatiquement selon le pays de livraison.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Prénom *</label>
                    <input className="w-full border rounded px-3 py-2"
                      value={ship.first} onChange={(e)=>setShip({...ship,first:e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Nom *</label>
                    <input className="w-full border rounded px-3 py-2"
                      value={ship.last} onChange={(e)=>setShip({...ship,last:e.target.value})} required />
                  </div>

                  {customerType === "company" && (
                    <>
                      <div className="md:col-span-2">
                        <label className="block text-sm mb-1">Société (optionnel)</label>
                        <input className="w-full border rounded px-3 py-2"
                          value={ship.company} onChange={(e)=>setShip({...ship,company:e.target.value})} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm mb-1">TVA (optionnel)</label>
                        <input className="w-full border rounded px-3 py-2"
                          value={ship.vat} onChange={(e)=>setShip({...ship,vat:e.target.value})}
                          placeholder="FRXX999999999" />
                      </div>
                    </>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Adresse *</label>
                    <input className="w-full border rounded px-3 py-2"
                      value={ship.line1} onChange={(e)=>setShip({...ship,line1:e.target.value})} required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Complément (optionnel)</label>
                    <input className="w-full border rounded px-3 py-2"
                      value={ship.line2} onChange={(e)=>setShip({...ship,line2:e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Ville *</label>
                    <input className="w-full border rounded px-3 py-2"
                      value={ship.city} onChange={(e)=>setShip({...ship,city:e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Code postal *</label>
                    <input className="w-full border rounded px-3 py-2"
                      value={ship.postal} onChange={(e)=>setShip({...ship,postal:e.target.value})} required />
                  </div>
                </div>

                <div className="pt-3 flex gap-3">
                  <button type="button" className="px-4 py-2 border rounded" onClick={()=>setStep(1)}>Retour</button>
                  <button className="bg-blue-600 text-white px-6 py-2 rounded">
                    Suivant : Paiement
                  </button>
                </div>
              </CardBox>
            </form>
          )}

          {/* STEP 3: PAYMENT */}
          {step === 3 && (
            <form onSubmit={pay} className="space-y-5">
              <CardBox title="Paiement">
                <div className="mb-3 text-sm text-gray-700">
                  Vérifiez les informations puis saisissez votre carte.
                </div>
                <div className="border rounded p-3 bg-white">
                  <CardElement />
                </div>
                <div className="pt-3 flex gap-3">
                  <button type="button" className="px-4 py-2 border rounded" onClick={()=>setStep(2)}>
                    Retour
                  </button>
                  <button type="submit" disabled={!stripe || loading || vatLoading}
                    className="bg-green-600 text-white px-6 py-2 rounded disabled:opacity-50">
                    {loading ? "Traitement..." : `Payer €${total.toFixed(2)}`}
                  </button>
                </div>
              </CardBox>
            </form>
          )}
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-xl p-6 h-fit lg:sticky lg:top-10">
          <h3 className="text-lg font-semibold mb-4">Récapitulatif</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Sous-total ({items.length} articles)</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
            <div className="flex justify-between items-center">
              <span>TVA</span>
              <span>€{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Livraison vers {formatCountry(ship.country)}</span>
              <span>{calculatingShip ? "Calcul..." : `€${shippingCost.toFixed(2)}`}</span>
            </div>
            {shippingInfo?.estimatedDays && (
              <div className="text-xs text-gray-600">
                Délai estimé : {shippingInfo.estimatedDays.min}-{shippingInfo.estimatedDays.max} jours ouvrés
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold text-base">
              <span>Total TTC</span>
              <span>€{total.toFixed(2)}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              TVA: {displayedVat.rate}% ({displayedVat.country}) – {displayedVat.rule || '—'}
            </div>
            {selectedBillingProfile && (
              <div className="text-xs text-gray-500">
                Profil de facturation: {selectedBillingProfile.firstName || ''} {selectedBillingProfile.lastName || ''}
              </div>
            )}
            {selectedShippingAddress && (
              <div className="text-xs text-gray-500">
                Adresse de livraison: {selectedShippingAddress.line1 || selectedShippingAddress.address || ''} {selectedShippingAddress.city ? `• ${selectedShippingAddress.city}` : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
