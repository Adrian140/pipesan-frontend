import React from 'react';
import LogoUpload from '../LogoUpload';  

function SettingsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-text-primary">Setări Generale</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <LogoUpload />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Nume Companie</label>
            <input
              type="text"
              defaultValue="PipeSan"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Setări Site</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Limba Implicită</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="ro">Română</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Moneda</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="RON">RON (lei)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Mod Mentenanță</label>
              <div className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-text-secondary">Activează modul mentenanță</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsTab;
