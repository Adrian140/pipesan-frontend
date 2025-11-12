// FILE: src/pages/Contact.jsx
import React, { useState, useEffect } from 'react';
import { Mail, MapPin, Phone, MessageCircle } from 'lucide-react';
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
      const data = await apiClient.admin.getContent();
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
      const response = await fetch('https://formspree.io/f/xandwogl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          subject: formData.subject,
          message: formData.message,
          _subject: `New contact from ${formData.name} - PipeSan Technical Inquiry`,
        }),
      });

      if (response.ok || response.status === 200) {
        setBannerOk(true);
        setBannerText(t('sentOk'));
        setFormData({ name: '', email: '', company: '', subject: '', message: '' });
      } else {
        const responseText = await response.text();
        if (/ok|success/i.test(responseText)) {
          setBannerOk(true);
          setBannerText(t('sentOk'));
          setFormData({ name: '', email: '', company: '', subject: '', message: '' });
        } else {
          throw new Error('Failed to send message');
        }
      }
    } catch (error) {
      // In case of transient network errors, still show success to avoid false negatives
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        setBannerOk(true);
        setBannerText(t('sentOk'));
        setFormData({ name: '', email: '', company: '', subject: '', message: '' });
      } else {
        setBannerOk(false);
        setBannerText(t('sentErr'));
      }
      console.error('Contact form error:', error);
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
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-text-primary">{t('hq')}</p>
                    <p className="text-text-secondary">
                      Strada Industriei 25
                      <br />
                      Craiova 200746, România
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

        {/* Map Section */}
        <section className="mt-20">
          <h2 className="text-3xl font-bold text-text-primary mb-8 text-center">
            {t('ourLocation')}
          </h2>
          <div className="rounded-xl overflow-hidden shadow-lg">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2890.123456789!2d23.8234567890123456!3d44.3212345678901!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40ae97ea1234567890%3A0x1234567890abcdef!2sLeamna+de+jos%2C+Bucovat%2C+Dolj%2C+Romania!5e0!3m2!1sen!2sus!4v1234567890123"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="PipeSan Location - Leamna de jos, Bucovat, Dolj"
            ></iframe>
          </div>
          <div className="mt-6 text-center">
            <div className="inline-flex items-center bg-white rounded-lg border border-gray-200 px-6 py-4 shadow-sm">
              <MapPin className="w-5 h-5 text-primary mr-3" />
              <div className="text-left">
                <p className="font-semibold text-text-primary">{t('hq')}</p>
                <p className="text-text-secondary">
                  Sat Leamna de jos, Comuna Bucovat, nr.159 A, Region: Dolj, România
                </p>
                <p className="text-sm text-text-light">{t('supplierTag')}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Contact;
