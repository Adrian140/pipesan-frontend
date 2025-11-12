import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import { apiClient } from '../../config/api';

function ContactInfo() {
  const [content, setContent] = useState({});

  useEffect(() => {
    fetchContactContent();
  }, []);

  const fetchContactContent = async () => {
    try {
      const data = await apiClient.admin.getContent();
      setContent(data);
    } catch (error) {
      console.error('Error fetching contact content:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-8">
        <h3 className="text-xl font-bold text-text-primary mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="https://wa.me/33675111618"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full bg-accent text-white py-4 px-6 rounded-lg font-semibold hover:bg-accent-dark transition-colors"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Chat WhatsApp
          </a>
          <a
            href="tel:+33675111618"
            className="flex items-center justify-center w-full bg-primary text-white py-4 px-6 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            <Phone className="w-5 h-5 mr-2" />
            Call Now
          </a>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h3 className="text-xl font-bold text-text-primary mb-6">Contact Information</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <p className="text-text-secondary">
                {content.contact_address || "Sat Leamna de jos, Comuna Bucovat, nr.159 A"}<br />
                Region: Dolj, România<br />
                VAT Number: RO39535603
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium text-text-primary">Technical Support</p>
              <span className="text-text-secondary">{content.contact_email || "contact@pipesan.eu"}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Phone className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium text-text-primary">Phone</p>
              <span className="text-text-secondary">{content.contact_phone || "+33 675 11 62 18"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Business Hours */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h3 className="text-xl font-bold text-text-primary mb-6">Business Hours</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-text-secondary">Monday - Friday</span>
            <span className="text-text-primary font-medium">8:00 AM - 6:00 PM CET</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Saturday</span>
            <span className="text-text-primary font-medium">9:00 AM - 1:00 PM CET</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Sunday</span>
            <span className="text-text-primary font-medium">Closed</span>
          </div>
        </div>
        <div className="pt-4 border-t border-gray-200 mt-4">
          <div className="flex justify-between">
            <span className="text-text-secondary">Technical Support</span>
            <span className="text-text-primary font-medium">Mon-Fri: 8:00 AM - 6:00 PM CET</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Emergency Support</span>
            <span className="text-text-primary font-medium">24/7 for critical issues</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactInfo;
