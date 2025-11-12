import React from 'react';
import { Link } from 'react-router-dom';

function TermsCheckboxes({ formData, onChange }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start">
        <input
          id="acceptTerms"
          name="acceptTerms"
          type="checkbox"
          required
          checked={formData.acceptTerms}
          onChange={onChange}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mt-1"
        />
        <label htmlFor="acceptTerms" className="ml-2 block text-sm text-text-secondary">
          Bifând această căsuță, confirm că am citit și sunt de acord cu{' '}
          <Link to="/terms" className="text-primary hover:text-primary-dark">
            Termenii și Condițiile
          </Link>{' '}
          și{' '}
          <Link to="/privacy" className="text-primary hover:text-primary-dark">
            Politica de Confidențialitate
          </Link>
          .
        </label>
      </div>
      
      <div className="flex items-start">
        <input
          id="acceptMarketing"
          name="acceptMarketing"
          type="checkbox"
          checked={formData.acceptMarketing}
          onChange={onChange}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mt-1"
        />
        <label htmlFor="acceptMarketing" className="ml-2 block text-sm text-text-secondary">
          Îmi dau acordul să primesc comunicări comerciale (newsletter).
        </label>
      </div>
    </div>
  );
}

export default TermsCheckboxes;
