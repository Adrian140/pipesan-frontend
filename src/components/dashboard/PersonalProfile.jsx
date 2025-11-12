import React, { useState, useEffect } from 'react';
import { Save, Edit } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardTranslation } from '../../hooks/useDashboardTranslation';
import { apiClient } from '../../config/api';

function PersonalProfile() {
  const { user } = useAuth();
  const { dt } = useDashboardTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    country: 'RO',
    language: 'ro'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      console.log('👤 Loading user data:', user);
      
      // ✅ FIXED: Handle both camelCase and snake_case field names
      setFormData({
        firstName: user.firstName || user.first_name || '',
        lastName: user.lastName || user.last_name || '',
        phone: user.phone || '',
        country: user.country || 'RO',
        language: user.language || 'ro'
      });
    }
  }, [user]);

  const countries = [
    { code: 'RO', name: dt('romania') },
    { code: 'FR', name: dt('france') },
    { code: 'DE', name: dt('germany') },
    { code: 'IT', name: dt('italy') },
    { code: 'ES', name: dt('spain') },
    { code: 'PL', name: dt('poland') },
    { code: 'NL', name: dt('netherlands') }
  ];

  const languages = [
    { code: 'ro', name: dt('romanian') },
    { code: 'en', name: dt('english') },
    { code: 'fr', name: dt('french') },
    { code: 'de', name: dt('german') },
    { code: 'it', name: dt('italian') },
    { code: 'es', name: dt('spanish') }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log('�� Updating profile with data:', formData);
      
      // ✅ API expects camelCase for profile updates
      const profileData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        country: formData.country,
        language: formData.language
      };

      console.log('📤 Sending profile update:', profileData);
      
      await apiClient.user.updateProfile(profileData);
      setMessage(dt('profileUpdatedSuccess'));
      setIsEditing(false);
      
      // ✅ Update local user state would require auth context refresh
      console.log('✅ Profile updated successfully');
      
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      setMessage(error.message || 'Eroare la actualizarea profilului');
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-text-primary">{dt('personalData')}</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center px-4 py-2 text-primary hover:text-primary-dark transition-colors"
        >
          <Edit className="w-4 h-4 mr-2" />
          {isEditing ? dt('cancel') : dt('edit')}
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-text-primary mb-2">
              {dt('firstName')}
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-text-primary mb-2">
              {dt('lastName')}
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
            {dt('email')}
          </label>
          <input
            type="email"
            id="email"
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
          />
          <p className="text-sm text-text-light mt-1">
            {dt('emailCannotBeChanged')}
          </p>
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
            disabled={!isEditing}
            placeholder="+40 123 456 789"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-text-primary mb-2">
              {dt('country')}
            </label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-text-primary mb-2">
              {dt('preferredLanguage')}
            </label>
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50"
            >
              {languages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? dt('saving') : dt('saveChanges')}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default PersonalProfile;
