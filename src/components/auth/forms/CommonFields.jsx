import React from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

function CommonFields({ formData, onChange, showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword }) {
  return (
    <>
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
          Email *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-light w-5 h-5" />
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={onChange}
            className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="your.email@example.com"
          />
        </div>
      </div>
      
      {/* Delivery Country Field */}
      <div>
        <label htmlFor="deliveryCountry" className="block text-sm font-medium text-text-primary mb-2">
          Țară de livrare *
        </label>
        <select
          id="deliveryCountry"
          name="deliveryCountry"
          required
          value={formData.deliveryCountry}
          onChange={onChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Selectează țara de livrare</option>
          <option value="IT">Italia</option>
          <option value="FR">Franța</option>
          <option value="DE">Germania</option>
          <option value="ES">Spania</option>
          <option value="NL">Olanda</option>
          <option value="BE">Belgia</option>
          <option value="PL">Polonia</option>
          <option value="SE">Suedia</option>
          <option value="OTHER">Altă țară</option>
        </select>
      </div>
      
      {/* Password Fields */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
          Parolă *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-light w-5 h-5" />
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            value={formData.password}
            onChange={onChange}
            className="pl-10 pr-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Minim 8 caractere, 1 majusculă, 1 cifră"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-light hover:text-text-secondary"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>
      
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
          Confirmă parola *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-light w-5 h-5" />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            required
            value={formData.confirmPassword}
            onChange={onChange}
            className="pl-10 pr-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Confirmă parola"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-light hover:text-text-secondary"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </>
  );
}

export default CommonFields;
