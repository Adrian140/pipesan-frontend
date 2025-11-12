import React from 'react';
import { User } from 'lucide-react';

function IndividualFields({ formData, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-text-primary mb-2">
          Prenume *
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-light w-5 h-5" />
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            value={formData.firstName}
            onChange={onChange}
            className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Prenume"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-text-primary mb-2">
          Nume *
        </label>
        <input
          id="lastName"
          name="lastName"
          type="text"
          required
          value={formData.lastName}
          onChange={onChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Nume"
        />
      </div>
    </div>
  );
}

export default IndividualFields;
