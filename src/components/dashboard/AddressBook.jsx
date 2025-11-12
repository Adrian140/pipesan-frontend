import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin, Home, Building } from 'lucide-react';
import { useDashboardTranslation } from '../../hooks/useDashboardTranslation';
import { apiClient } from '../../config/api';

function AddressBook() {
  const { dt } = useDashboardTranslation();
  const [addresses, setAddresses] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    type: 'shipping', // shipping, billing, both
    label: '',
    firstName: '',
    lastName: '',
    company: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'FR',
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

  const addressTypes = [
    { value: 'shipping', label: dt('shippingAddress'), icon: Home },
    { value: 'billing', label: dt('billingAddress'), icon: Building },
    { value: 'both', label: dt('bothAddresses'), icon: MapPin }
  ];

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const data = await apiClient.addresses.getAll();
      console.log('📍 Loaded addresses from API:', data);
      setAddresses(data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setMessage('Eroare la încărcarea adreselor');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log('💾 Saving address data:', formData);
      
      // Prepare data with correct field mapping for backend
      const addressData = {
        type: formData.type,
        label: formData.label.trim(),
        firstName: formData.firstName.trim(), // ✅ Frontend uses firstName
        lastName: formData.lastName.trim(),   // ✅ Frontend uses lastName  
        company: formData.company.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country,
        phone: formData.phone.trim(),
        isDefault: formData.isDefault
      };

      console.log('📤 Sending to backend:', addressData);

      if (editingAddress) {
        const result = await apiClient.addresses.update(editingAddress.id, addressData);
        console.log('✅ Address updated:', result);
        setMessage(dt('addressUpdatedSuccess'));
      } else {
        const result = await apiClient.addresses.create(addressData);
        console.log('✅ Address created:', result);
        setMessage(dt('addressSavedSuccess'));
      }
      
      // Reset form and refresh data
      resetForm();
      await fetchAddresses(); // ✅ Refresh addresses list
      
    } catch (error) {
      console.error('❌ Error saving address:', error);
      setMessage(error.message || 'Eroare la salvarea adresei');
    }

    setLoading(false);
  };

  const handleEdit = (address) => {
    console.log('✏️ Editing address:', address);
    setEditingAddress(address);
    
    // ✅ FIXED: Map backend fields to frontend correctly
    setFormData({
      type: address.type,
      label: address.label || '',
      firstName: address.first_name || address.firstName || '', // ✅ Handle both field names
      lastName: address.last_name || address.lastName || '',    // ✅ Handle both field names
      company: address.company || '',
      address: address.address || '',
      city: address.city || '',
      postalCode: address.postal_code || address.postalCode || '', // ✅ Handle both field names
      country: address.country || 'FR',
      phone: address.phone || '',
      isDefault: address.is_default || address.isDefault || false // ✅ Handle both field names
    });
    setIsCreating(true);
  };

  const handleDelete = async (addressId) => {
    if (!confirm(dt('confirmDeleteAddress'))) return;

    try {
      await apiClient.addresses.delete(addressId);
      setMessage(dt('addressDeletedSuccess'));
      await fetchAddresses(); // ✅ Refresh addresses list
    } catch (error) {
      console.error('❌ Error deleting address:', error);
      setMessage(error.message || 'Eroare la ștergerea adresei');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'shipping',
      label: '',
      firstName: '',
      lastName: '',
      company: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'FR',
      phone: '',
      isDefault: false
    });
    setIsCreating(false);
    setEditingAddress(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const getTypeIcon = (type) => {
    const typeConfig = addressTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.icon : MapPin;
  };

  const getTypeLabel = (type) => {
    const typeConfig = addressTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.label : type;
  };

  // ✅ FIXED: Display function that handles both field name formats
  const getDisplayName = (address) => {
    const firstName = address.first_name || address.firstName || '';
    const lastName = address.last_name || address.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Nume incomplet';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-text-primary">{dt('addresses')}</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          {dt('addAddress')}
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
              {editingAddress ? dt('editAddress') : dt('newAddress')}
            </h3>
            <button
              onClick={resetForm}
              className="text-text-secondary hover:text-text-primary"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Address Type */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                {dt('addressType')}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {addressTypes.map((type) => (
                  <label key={type.value} className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <type.icon className="w-5 h-5 mr-2 text-text-secondary" />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Label */}
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-text-primary mb-2">
                {dt('label')} ({dt('optional')})
              </label>
              <input
                type="text"
                id="label"
                name="label"
                value={formData.label}
                onChange={handleChange}
                placeholder="Ex: Acasă, Birou, Depozit..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Name Fields */}
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

            {/* Company */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-text-primary mb-2">
                {dt('company')} ({dt('optional')})
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Address */}
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

            {/* City, Postal Code, Country */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            </div>

            {/* Phone */}
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

            {/* Default Address */}
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
                {dt('setAsDefault')}
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
                {loading ? dt('saving') : (editingAddress ? dt('update') : dt('save'))}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Addresses List */}
      <div className="space-y-4">
        {addresses.map((address) => {
          const TypeIcon = getTypeIcon(address.type);
          return (
            <div key={address.id} className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <TypeIcon className="w-5 h-5 text-text-secondary mr-2" />
                    <h3 className="text-lg font-semibold text-text-primary">
                      {address.label || getDisplayName(address)}
                    </h3>
                    {(address.is_default || address.isDefault) && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {dt('default')}
                      </span>
                    )}
                  </div>
                  <div className="text-text-secondary space-y-1">
                    <p className="font-medium">{getTypeLabel(address.type)}</p>
                    <p>{getDisplayName(address)}</p>
                    {address.company && <p>{address.company}</p>}
                    <p>{address.address}</p>
                    <p>{address.city}, {address.postal_code || address.postalCode}</p>
                    <p>{countries.find(c => c.code === address.country)?.name}</p>
                    {address.phone && <p>Tel: {address.phone}</p>}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(address)}
                    className="p-2 text-text-secondary hover:text-primary transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="p-2 text-text-secondary hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {addresses.length === 0 && !isCreating && (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-secondary mb-2">
            {dt('noAddressesSaved')}
          </h3>
          <p className="text-text-light mb-6">
            {dt('addAddressesMessage')}
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            {dt('addFirstAddress')}
          </button>
        </div>
      )}
    </div>
  );
}

export default AddressBook;
