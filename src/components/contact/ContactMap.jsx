import React from 'react';
import { MapPin } from 'lucide-react';

function ContactMap() {
  return (
    <section className="mt-20">
      <h2 className="text-3xl font-bold text-text-primary mb-8 text-center">Our Location</h2>
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
            <p className="font-semibold text-text-primary">PipeSan</p>
            <p className="text-text-secondary">Sat Leamna de jos, Comuna Bucovat, nr.159 A, Region: Dolj, România</p>
            <p className="text-sm text-text-light">Professional plumbing parts supplier for Europe</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactMap;
