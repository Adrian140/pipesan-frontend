import React from 'react';
import { MapPin } from 'lucide-react';

function ContactMap() {
  return (
    <section className="mt-20">
      <h2 className="text-3xl font-bold text-text-primary mb-8 text-center">Our Location</h2>
      <div className="rounded-xl overflow-hidden shadow-lg">
        <iframe
          src="https://www.google.com/maps?q=Lemna+de+Jos+159A,+Bucov%C4%83%C8%9B,+Dolj,+Romania&output=embed"
          width="100%"
          height="400"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="PipeSan - Lemna de Jos, Bucovăț, Dolj"
        ></iframe>
      </div>
      <div className="mt-6 text-center">
        <div className="inline-flex items-center bg-white rounded-lg border border-gray-200 px-6 py-4 shadow-sm">
          <MapPin className="w-5 h-5 text-primary mr-3" />
          <div className="text-left">
            <p className="font-semibold text-text-primary">PipeSan</p>
            <p className="text-text-secondary">FISH VALLEY S.R.L., Sat Lemna de Jos, Com. Bucovăț, Nr. 159A, 207128, Jud. Dolj, România</p>
            <p className="text-sm text-text-light">Professional plumbing parts supplier for Europe</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactMap;
