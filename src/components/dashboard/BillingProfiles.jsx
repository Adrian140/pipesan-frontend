import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building, User, Check, X } from 'lucide-react';
import { useDashboardTranslation } from '../../hooks/useDashboardTranslation';
import { apiClient } from '../../config/api';

function BillingProfiles() {
  const { dt } = useDashboardTranslation();
  const [profiles, setProfiles] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    type: 'individual', // individual or company
    firstName: '',
    lastName: '',
    companyName: '',
    vatNumber: '',
    sirenSiret: '',
    country: 'FR',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    isDefault: false
  });

  const countries = [
    { code: 'FR', name: dt('france') },
    { code: 'DE', name: dt('germany') },
    { code: 'IT', name: dt('italy') },
    { code: 'ES', name: dt('spain') },
    { code: 'NL', name: dt('netherlands') },
    { code: 'BE', name: 'Belgium' },
    { code: 'PL', name: dt('poland') },
    { code: 'RO', name: dt('romania') }
  ];

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const data = await apiClient.billingProfiles.getAll();
      console.log('💳 Loaded billing profiles from API:', data);
      setProfiles(data);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setMessage('Eroare la încărcarea profilelor de facturare');
    }
  };

  const validateVAT = async (vatNumber, country) => {
    if (!vatNumber) return { valid: true };
    
    try {
      return await apiClient.billingProfiles.validateVAT(vatNumber, country);
    } catch (error) {
      return { valid: false, error: 'VAT validation service unavailable' };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // VAT validation for companies
    if (formData.type === 'company' && formData.vatNumber) {
      const vatValidation = await validateVAT(formData.vatNumber, formData.country);
      if (!vatValidation.valid) {
        setMessage(`VAT validation failed: ${vatValidation.error || 'Invalid VAT number'}`);
        setLoading(false);
        return;
      }
    }

    try {
      console.log('💾 Saving billing profile data:', formData);
      
      // Prepare data with correct field mapping for backend
      const profileData = {
        type: formData.type,
        firstName: formData.firstName.trim(),     // ✅ Frontend uses firstName
        lastName: formData.lastName.trim(),       // ✅ Frontend uses lastName
        companyName: formData.companyName.trim(), // ✅ Frontend uses companyName
        vatNumber: formData.vatNumber.trim(),     // ✅ Frontend uses vatNumber
        sirenSiret: formData.sirenSiret.trim(),   // ✅ Frontend uses sirenSiret
        country: formData.country,
        address: formData.address.trim(),
        city: formData.city.trim(),
        postalCode: formData.postalCode.trim(),   // ✅ Frontend uses postalCode
        phone: formData.phone.trim(),
        isDefault: formData.isDefault             // ✅ Frontend uses isDefault
      };

      console.log('📤 Sending to backend:', profileData);

      if (editingProfile) {
        const result = await apiClient.billingProfiles.update(editingProfile.id, profileData);
        console.log('✅ Profile updated:', result);
        setMessage(dt('profileUpdatedSuccess'));
      } else {
        const result = await apiClient.billingProfiles.create(profileData);
        console.log('✅ Profile created:', result);
        setMessage(dt('profileSavedSuccess'));
      }
      
      // Reset form and refresh data
      resetForm();
      await fetchProfiles(); // ✅ Refresh profiles list
      
    } catch (error) {
      console.error('❌ Error saving billing profile:', error);
      setMessage(error.message || 'Eroare la salvarea profilului');
    }

    setLoading(false);
  };

  const handleEdit = (profile) => {
    console.log('✏️ Editing billing profile:', profile);
    setEditingProfile(profile);
    
    // ✅ FIXED: Map backend fields to frontend correctly
    setFormData({
      type: profile.type,
      firstName: profile.first_name || profile.firstName || '',         // ✅ Handle both field names
      lastName: profile.last_name || profile.lastName || '',             // ✅ Handle both field names
      companyName: profile.company_name || profile.companyName || '',     // ✅ Handle both field names
      vatNumber: profile.vat_number || profile.vatNumber || '',           // ✅ Handle both field names
      sirenSiret: profile.siren_siret || profile.sirenSiret || '',        // ✅ Handle both field names
      country: profile.country || 'FR',
      address: profile.address || '',
      city: profile.city || '',
      postalCode: profile.postal_code || profile.postalCode || '',        // ✅ Handle both field names
      phone: profile.phone || '',
      isDefault: profile.is_default || profile.isDefault || false        // ✅ Handle both field names
    });
    setIsCreating(true);
  };

  const handleDelete = async (profileId) => {
    if (!confirm(dt('confirmDeleteProfile'))) return;

    try {
      await apiClient.billingProfiles.delete(profileId);
      setMessage(dt('profileDeletedSuccess'));
      await fetchProfiles(); // ✅ Refresh profiles list
    } catch (error) {
      console.error('❌ Error deleting billing profile:', error);
      setMessage(error.message || 'Eroare la ștergerea profilului');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'individual',
      firstName: '',
      lastName: '',
      companyName: '',
      vatNumber: '',
      sirenSiret: '',
      country: 'FR',
      address: '',
      city: '',
      postalCode: '',
      phone: '',
      isDefault: false
    });
    setIsCreating(false);
    setEditingProfile(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // ✅ FIXED: Display function that handles both field name formats
  const getDisplayName = (profile) => {
    if (profile.type === 'company') {
      return profile.company_name || profile.companyName || 'Companie fără nume';
    }
    const firstName = profile.first_name || profile.firstName || '';
    const lastName = profile.last_name || profile.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Nume incomplet';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-text-primary">{dt('billingData')}</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          {dt('addProfile')}
        </button>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg ${
          message.includes('succes') 
            ? 'bg-green-50 border border-green-200 text-green-600'
            : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {message}
        </div>
      )}

      {isCreating && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-text-primary">
              {editingProfile ? dt('editProfile') : dt('newBillingProfile')}
            </h3>
            <button
              onClick={resetForm}
              className="text-text-secondary hover:text-text-primary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Type */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                {dt('profileType')}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="type"
                    value="individual"
                    checked={formData.type === 'individual'}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <User className="w-5 h-5 mr-2 text-text-secondary" />
                  <span>{dt('individual')}</span>
                </label>
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="type"
                    value="company"
                    checked={formData.type === 'company'}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <Building className="w-5 h-5 mr-2 text-text-secondary" />
                  <span>Firmă</span>
                </label>
              </div>
            </div>

            {/* Individual Fields */}
            {formData.type === 'individual' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-text-primary mb-2">
                    {dt('firstName')} *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-text-primary mb-2">
                    {dt('lastName')} *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Company Fields */}
            {formData.type === 'company' && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-text-primary mb-2">
                    {dt('companyName')} *
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="vatNumber" className="block text-sm font-medium text-text-primary mb-2">
                      {dt('vatNumber')}
                    </label>
                    <input
                      type="text"
                      id="vatNumber"
                      name="vatNumber"
                      value={formData.vatNumber}
                      onChange={handleChange}
                      placeholder="Ex: FR12345678901"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  {formData.country === 'FR' && (
                    <div>
                      <label htmlFor="sirenSiret" className="block text-sm font-medium text-text-primary mb-2">
                        {dt('sirenSiret')}
                      </label>
                      <input
                        type="text"
                        id="sirenSiret"
                        name="sirenSiret"
                        value={formData.sirenSiret}
                        onChange={handleChange}
                        placeholder="Ex: 12345678901234"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Address Fields */}
            <div className="space-y-6">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-text-primary mb-2">
                  {dt('country')} *
                </label>
                <select
                  id="country"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-text-primary mb-2">
                  {dt('address')} *
                </label>
                <textarea
                  id="address"
                  name="address"
                  required
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-text-primary mb-2">
                    {dt('city')} *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-text-primary mb-2">
                    {dt('postalCode')} *
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    required
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-2">
                  {dt('phone')}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Default Profile */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="isDefault" className="ml-2 block text-sm text-text-secondary">
                {dt('setAsDefaultProfile')}
              </label>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 text-text-secondary rounded-lg hover:bg-gray-50 transition-colors"
              >
                {dt('cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? dt('saving') : (editingProfile ? dt('update') : dt('save'))}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profiles List */}
      <div className="space-y-4">
        {profiles.map((profile) => (
          <div key={profile.id} className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  {profile.type === 'company' ? (
                    <Building className="w-5 h-5 text-text-secondary mr-2" />
                  ) : (
                    <User className="w-5 h-5 text-text-secondary mr-2" />
                  )}
                  <h3 className="text-lg font-semibold text-text-primary">
                    {getDisplayName(profile)}
                  </h3>
                  {(profile.is_default || profile.isDefault) && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {dt('default')}
                    </span>
                  )}
                </div>
                <div className="text-text-secondary space-y-1">
                  {profile.type === 'company' && (profile.vat_number || profile.vatNumber) && (
                    <p>VAT: {profile.vat_number || profile.vatNumber}</p>
                  )}
                  {profile.type === 'company' && (profile.siren_siret || profile.sirenSiret) && (
                    <p>SIREN/SIRET: {profile.siren_siret || profile.sirenSiret}</p>
                  )}
                  <p>{profile.address}</p>
                  <p>{profile.city}, {profile.postal_code || profile.postalCode}</p>
                  <p>{countries.find(c => c.code === profile.country)?.name}</p>
                  {profile.phone && <p>Tel: {profile.phone}</p>}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(profile)}
                  className="p-2 text-text-secondary hover:text-primary transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(profile.id)}
                  className="p-2 text-text-secondary hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {profiles.length === 0 && !isCreating && (
        <div className="text-center py-12">
          <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-secondary mb-2">
            {dt('noBillingProfiles')}
          </h3>
          <p className="text-text-light mb-6">
            {dt('addFirstProfile')}
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            {dt('addFirstBillingProfile')}
          </button>
        </div>
      )}
    </div>
  );
}

export default BillingProfiles;
