// FILE: src/pages/Contact.jsx
import React, { useState, useEffect } from 'react';
import { Mail, Phone, MessageCircle, Warehouse } from 'lucide-react';
import { useTranslation } from '../translations';
import { apiClient } from '../config/api';

function Contact() {
  // use the "contact" namespace
  const { t } = useTranslation('contact');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [bannerText, setBannerText] = useState('');
  const [bannerOk, setBannerOk] = useState(false);

  const [content, setContent] = useState({});
  const [loadingContent, setLoadingContent] = useState(true);

  useEffect(() => {
    fetchContactData();
  }, []);

  const fetchContactData = async () => {
    try {
      const data = await apiClient.content.getPublic();
      setContent(data || {});
    } catch (error) {
      console.error('Error fetching contact data:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setBannerText('');

    try {
      await apiClient.contact.send(formData);
      setBannerOk(true);setBannerText(t('sentOk'));
      setFormData({name:'',email:'',company:'',subject:'',message:''});
    } catch(error){
      setBannerOk(false);setBannerText(error.message || t('sentErr'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            {content.contactTitle || t('title')}
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            {content.contactSubtitle || t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                {t('formTitle')}
              </h2>

              {bannerText && (
                <div
                  className={`mb-6 px-4 py-3 rounded-lg ${
                    bannerOk
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {bannerText}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                    {t('name')} *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={t('name')}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                    {t('email')} *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={t('email')}
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-text-primary mb-2">
                    {t('company')}
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={t('company')}
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-text-primary mb-2">
                    {t('subject')} *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">{t('selectType')}</option>
                    <option value="product-selection">{t('subject_product')}</option>
                    <option value="technical-specs">{t('subject_specs')}</option>
                    <option value="installation-help">{t('subject_install')}</option>
                    <option value="bulk-pricing">{t('subject_bulk')}</option>
                    <option value="other">{t('subject_other')}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-text-primary mb-2">
                    {t('message')} *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={t('message')}
                  />
                </div>

                {/* Honeypot field for spam protection */}
                <input
                  type="text"
                  name="_gotcha"
                  style={{ display: 'none' }}
                  tabIndex="-1"
                  autoComplete="off"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '...' : t('sendMessage')}
                </button>
              </form>
            </div>
          </div>

          {/* Contact Info & Quick Actions */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-8">
              <h3 className="text-xl font-bold text-text-primary mb-6">
                {t('quickActions')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                  href="https://wa.me/33675111618"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full bg-accent text-white py-4 px-6 rounded-lg font-semibold hover:bg-accent-dark transition-colors"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  {t('chatWhatsApp')}
                </a>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h3 className="text-xl font-bold text-text-primary mb-6">
                {t('infoTitle')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Warehouse className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-text-primary">{t('warehouse')}</p>
                    <p className="text-sm text-text-secondary mb-1">{t('warehouseNote')}</p>
                    <p className="text-text-secondary">
                      EcomPrep Hub
                      <br />
                      5 Rue des Enclos, Cellule 2
                      <br />
                      35350 La Gouesnière, France
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-text-primary">{t('techSupport')}</p>
                    <p className="text-text-secondary">contact@pipesan.eu</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-text-primary">{t('phone')}</p>
                    <p className="text-text-secondary">+33 675 11 62 18</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-text-primary">{t('email')}</p>
                    <p className="text-text-secondary">contact@pipesan.eu</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h3 className="text-xl font-bold text-text-primary mb-6">
                {t('businessHours')}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-secondary">{t('monFri')}</span>
                  <span className="text-text-primary font-medium">8:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">{t('saturday')}</span>
                  <span className="text-text-primary font-medium">9:00 AM - 1:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">{t('sunday')}</span>
                  <span className="text-text-primary font-medium">{t('closed')}</span>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200 mt-4">
                <div className="flex justify-between">
                  <span className="text-text-secondary">{t('techSupport')}</span>
                  <span className="text-text-primary font-medium">
                    {t('techSupportHours')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">{t('emergencySupport')}</span>
                  <span className="text-text-primary font-medium">
                    {t('emergencySupportHours')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Contact;
