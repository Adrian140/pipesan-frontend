import React from 'react';
import { Building } from 'lucide-react';

function CompanyFields({ formData, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-text-primary mb-2">
          Nume companie *
        </label>
        <div className="relative">
          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-light w-5 h-5" />
          <input
            id="companyName"
            name="companyName"
            type="text"
            required
            value={formData.companyName}
            onChange={onChange}
            className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Denumirea companiei"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="cui" className="block text-sm font-medium text-text-primary mb-2">
            CUI *
          </label>
          <input
            id="cui"
            name="cui"
            type="text"
            required
            value={formData.cui}
            onChange={onChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="RO12345678"
          />
        </div>
        <div>
          <label htmlFor="vatNumber" className="block text-sm font-medium text-text-primary mb-2">
            Cod TVA (opțional)
          </label>
          <input
            id="vatNumber"
            name="vatNumber"
            type="text"
            value={formData.vatNumber}
            onChange={onChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="RO12345678"
          />
        </div>
      </div>

      <div>
        <label htmlFor="companyAddress" className="block text-sm font-medium text-text-primary mb-2">
          Adresa companiei *
        </label>
        <input
          id="companyAddress"
          name="companyAddress"
          type="text"
          required
          value={formData.companyAddress}
          onChange={onChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Strada, numărul"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="companyCity" className="block text-sm font-medium text-text-primary mb-2">
            Oraș *
          </label>
          <input
            id="companyCity"
            name="companyCity"
            type="text"
            required
            value={formData.companyCity}
            onChange={onChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="București"
          />
        </div>
        <div>
          <label htmlFor="companyPostalCode" className="block text-sm font-medium text-text-primary mb-2">
            Cod poștal *
          </label>
          <input
            id="companyPostalCode"
            name="companyPostalCode"
            type="text"
            required
            value={formData.companyPostalCode}
            onChange={onChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="010101"
          />
        </div>
      </div>
    </div>
  );
}

export default CompanyFields;
