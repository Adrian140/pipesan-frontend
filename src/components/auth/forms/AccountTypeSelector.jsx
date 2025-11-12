import React from 'react';
import { User, Building } from 'lucide-react';

function AccountTypeSelector({ accountType, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-3">
        Tip cont
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="accountType"
            value="individual"
            checked={accountType === 'individual'}
            onChange={onChange}
            className="mr-3"
          />
          <User className="w-5 h-5 mr-2 text-text-secondary" />
          <span>Persoană fizică</span>
        </label>
        <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="accountType"
            value="company"
            checked={accountType === 'company'}
            onChange={onChange}
            className="mr-3"
          />
          <Building className="w-5 h-5 mr-2 text-text-secondary" />
          <span>Firmă</span>
        </label>
      </div>
    </div>
  );
}

export default AccountTypeSelector;
