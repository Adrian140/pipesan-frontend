import React, { useState, useEffect } from 'react';
import { Truck, Plus, Edit, Save, Trash2, Scale, Globe, ChevronDown } from 'lucide-react';
import { apiClient } from '../../../config/api';
import FlagEmoji from '../../common/FlagEmoji';
import { SHIPPING_COUNTRIES } from '../../../data/chronopostRates';

// Lista țărilor – aceleași ca în tarifele Chronopost publice, plus OTHER ca rezervă
const AVAILABLE_COUNTRIES = [
  ...SHIPPING_COUNTRIES.map(({ code, name }) => ({ code, name })),
  { code: 'OTHER', name: 'Other Countries' }
];

// Generează steag din cod ISO-2 (fără a depinde de emoji din listă)
const flagText = (code) => {
  const cc = (code || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return '🌍';
  return String.fromCodePoint(...[...cc].map(ch => 0x1f1e6 + (ch.charCodeAt(0) - 65)));
};

function WeightBasedShippingTab() {
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('FR');
  const [openCountry, setOpenCountry] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [editingRate, setEditingRate] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newRate, setNewRate] = useState({
    countryCode: 'FR',
    countryName: 'France',
    weightMinGrams: 0,
    weightMaxGrams: 1000,
    shippingCost: 9.99,
    currency: 'EUR'
  });

  // --- Calculator preview state ---
  const [calcWeight, setCalcWeight] = useState(750);
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // 🔧 readuce funcția lipsă – încarcă toate tarifele
  const fetchShippingRates = async () => {
    setLoading(true);
    try {
      const data = await apiClient.shippingRates.getAll();
      setShippingRates(data || []);
      setMessage('');
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      setMessage('Eroare la încărcarea tarifelor de livrare');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShippingRates();
  }, []);

  // --- Calculator ---
  const handleCalculate = async () => {
    setCalcLoading(true);
    setCalcResult(null);
    try {
      const res = await apiClient.shippingRates.calculateShippingByWeight(
        Number(calcWeight) || 0,
        selectedCountry
      );
      setCalcResult(res);
    } catch (e) {
      console.error('Calc error:', e);
      setMessage('Eroare la calculul costului de livrare');
    } finally {
      setCalcLoading(false);
    }
  };

  // --- CRUD ---
  const handleSaveRate = async (rateData) => {
    setLoading(true);
    try {
      if (editingRate) {
        await apiClient.shippingRates.update(editingRate.id, rateData);
        setMessage('Tarif actualizat cu succes');
        setEditingRate(null);
      } else {
        await apiClient.shippingRates.create(rateData);
        setMessage('Tarif adăugat cu succes');
        setShowAddForm(false);
        setNewRate({
          countryCode: 'FR',
          countryName: 'France',
          weightMinGrams: 0,
          weightMaxGrams: 1000,
          shippingCost: 9.99,
          currency: 'EUR'
        });
      }
      await fetchShippingRates();
    } catch (error) {
      console.error('Error saving shipping rate:', error);
      setMessage('Eroare la salvarea tarifului');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRate = async (rateId) => {
    if (!confirm('Ești sigur că vrei să ștergi acest tarif?')) return;

    setLoading(true);
    try {
      await apiClient.shippingRates.delete(rateId);
      setMessage('Tarif șters cu succes');
      await fetchShippingRates();
    } catch (error) {
      console.error('Error deleting shipping rate:', error);
      setMessage('Eroare la ștergerea tarifului');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (rate) => {
    setEditingRate({
      ...rate,
      weightMinGrams: rate.weight_min_grams,
      weightMaxGrams: rate.weight_max_grams,
      shippingCost: rate.shipping_cost,
      countryCode: rate.country_code,
      countryName: rate.country_name
    });
  };

  const cancelEdit = () => {
    setEditingRate(null);
    setShowAddForm(false);
  };

  // --- Utils UI ---
  const getCountryRates = (countryCode) => {
    return shippingRates
      .filter(rate => rate.country_code === countryCode)
      .sort((a, b) => a.weight_min_grams - b.weight_min_grams);
  };

  const getDisplayWeightRange = (rate) => {
    const minKg = (rate.weight_min_grams / 1000).toFixed(1);
    const maxKg = rate.weight_max_grams ? (rate.weight_max_grams / 1000).toFixed(1) : '∞';
    return `${minKg}kg - ${maxKg}kg`;
  };

  const renderRateForm = (rate, isNew = false) => {
    const formData = isNew ? newRate : editingRate;
    const setFormData = isNew ? setNewRate : setEditingRate;

    return (
      <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-blue-900 mb-4">
          {isNew ? 'Adaugă Tarif Nou' : 'Editează Tarif'}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Țară */}
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">Țară</label>
            <select
              value={formData.countryCode}
              onChange={(e) => {
                const country = AVAILABLE_COUNTRIES.find(c => c.code === e.target.value);
                setFormData({
                  ...formData,
                  countryCode: e.target.value,
                  countryName: country?.name || e.target.value
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              {AVAILABLE_COUNTRIES.map(country => (
                <option key={country.code} value={country.code}>
                  {flagText(country.code)} {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* Monedă */}
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">Monedă</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CHF">CHF</option>
            </select>
          </div>

          {/* Greutăți */}
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">Greutate Minimă (grame)</label>
            <input
              type="number"
              min="0"
              value={formData.weightMinGrams}
              onChange={(e) => setFormData({ ...formData, weightMinGrams: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">Greutate Maximă (grame)</label>
            <input
              type="number"
              min="0"
              value={formData.weightMaxGrams || ''}
              onChange={(e) => setFormData({
                ...formData,
                weightMaxGrams: e.target.value ? parseInt(e.target.value) : null
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="Lasă gol pentru nelimitat"
            />
          </div>

          {/* Cost */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-blue-900 mb-2">Cost Livrare</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.shippingCost}
                onChange={(e) => setFormData({ ...formData, shippingCost: parseFloat(e.target.value) || 0 })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="9.99"
              />
              <span className="text-blue-900 font-medium">{formData.currency}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => handleSaveRate(formData)}
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Se salvează...' : 'Salvează'}
          </button>
          <button
            onClick={cancelEdit}
            className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Anulează
          </button>
        </div>
      </div>
    );
  };

  const groupedRates = AVAILABLE_COUNTRIES.reduce((acc, country) => {
    acc[country.code] = getCountryRates(country.code);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Tarife Livrare pe Greutate</h2>
          <p className="text-text-secondary">Gestionează tarifele de livrare pe intervale de greutate și țară</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adaugă Tarif
        </button>
      </div>

      {/* Mesaj */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes('succes')
              ? 'bg-green-50 border border-green-200 text-green-600'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}
        >
          {message}
        </div>
      )}

      {/* Formular Adăugare */}
      {showAddForm && renderRateForm(newRate, true)}

      {/* Lista țărilor: un rând pe țară, la click se deschid intervalele */}
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
        {AVAILABLE_COUNTRIES.map(country => {
          const countryRates = groupedRates[country.code] || [];
          const isOpen = openCountry === country.code || editingRate?.countryCode === country.code;
          const cheapest = countryRates.length ? Math.min(...countryRates.map(r => Number(r.shipping_cost))) : null;

          return (
            <div key={country.code}>
              <button
                type="button"
                onClick={() => setOpenCountry(isOpen ? null : country.code)}
                aria-expanded={isOpen}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 transition-colors ${isOpen ? 'bg-gray-50' : ''}`}
              >
                <span className="text-xl"><FlagEmoji code={country.code} /></span>
                <span className="flex-1 font-semibold text-text-primary">{country.name}</span>
                <span className="text-sm text-text-secondary">{countryRates.length} intervale</span>
                <span className="w-28 text-right text-sm font-semibold text-primary">
                  {cheapest === null ? '—' : `de la ${cheapest.toFixed(2)} €`}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-2 bg-gray-50">
                  {editingRate && editingRate.countryCode === country.code && (
                    <div className="mb-4">{renderRateForm(editingRate)}</div>
                  )}

                  {countryRates.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <Truck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>Niciun tarif configurat</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {countryRates.map(rate => (
                        <div key={rate.id} className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <Scale className="w-4 h-4 text-gray-400" />
                            <span className="text-text-primary">{getDisplayWeightRange(rate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-primary mr-1">{Number(rate.shipping_cost).toFixed(2)} {rate.currency}</span>
                            <button onClick={() => startEdit(rate)} className="text-blue-600 hover:text-blue-800 p-1" aria-label="Editează">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteRate(rate.id)} className="text-red-600 hover:text-red-800 p-1" aria-label="Șterge">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Calculator Preview */}
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2" />
          Calculator Livrare (Preview)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Țară</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {AVAILABLE_COUNTRIES.map(country => (
                <option key={country.code} value={country.code}>
                  {flagText(country.code)} {country.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Greutate Totală (grame)</label>
            <input
              type="number"
              min="0"
              value={calcWeight}
              onChange={(e) => setCalcWeight(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="750"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Cost Calculat</label>
            <button
              onClick={handleCalculate}
              disabled={calcLoading}
              className="px-3 py-2 bg-primary text-white rounded-lg text-center font-bold disabled:opacity-50"
            >
              {calcLoading ? 'Se calculează…' : 'Calculează →'}
            </button>
          </div>
        </div>

        {calcResult && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <div className="text-sm text-green-800">Cost</div>
                <div className="text-lg font-bold text-green-900">
                  {Number(calcResult.shippingCost).toFixed(2)} {calcResult.currency}
                </div>
              </div>
              <div>
                <div className="text-sm text-green-800">Interval greutate</div>
                <div className="font-medium text-green-900">{calcResult.weightRange}</div>
              </div>
              <div>
                <div className="text-sm text-green-800">Livrare estimată</div>
                <div className="font-medium text-green-900">
                  {calcResult.estimatedDays.min}–{calcResult.estimatedDays.max} zile
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Cum funcționează:</strong> Clientul adaugă produse în coș → se calculează greutatea totală → se aplică
            tariful corespunzător intervalului de greutate pentru țara selectată.
          </p>
        </div>
      </div>
    </div>
  );
}

export default WeightBasedShippingTab;
