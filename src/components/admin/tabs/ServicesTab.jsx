import React from 'react';
import { Plus, Edit, Trash2, Save, X, AlertCircle, CheckCircle, Package } from 'lucide-react';
function ServicesTab({ 
  services = [], 
  isEditing, 
  editForm, 
  setEditForm, 
  startEdit, 
  cancelEdit, 
  handleSave, 
  handleDelete,
  loading = false,
  message = ''
}) {

  // Ensure editForm is always an object
  const safeEditForm = editForm || {};
  const safeServices = services || [];

  const defaultService = {
    title: '',
    description: '',
    features: [''],
    price: '',
    unit: '',
    category: 'plumbing'
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-text-primary">Gestionare Servicii</h2>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Gestionare Servicii</h2>
        <button
          onClick={() => {
            console.log('Adding new service...');
            startEdit(defaultService, 'services');
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adaugă Serviciu
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center ${
          message.includes('succes') || message.includes('success')
            ? 'bg-green-50 border border-green-200 text-green-600'
            : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {message.includes('succes') || message.includes('success') ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          {message}
        </div>
      )}

      {/* Services Grid */}
      {safeServices.length === 0 && !isEditing ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-secondary mb-2">
            Niciun serviciu disponibil
          </h3>
          <p className="text-text-light mb-6">
            Adaugă primul serviciu pentru a începe.
          </p>
          <button
            onClick={() => startEdit(defaultService, 'services')}
            className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            Adaugă primul serviciu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* New Service Form */}
          {isEditing === 'services-new' && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Serviciu Nou</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={safeEditForm.title || ''}
                  onChange={(e) => setEditForm({ ...safeEditForm, title: e.target.value })}
                  placeholder="Titlu serviciu"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  required
                />
                <textarea
                  value={safeEditForm.description || ''}
                  onChange={(e) => setEditForm({ ...safeEditForm, description: e.target.value })}
                  placeholder="Descriere serviciu"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
                
                {/* Category Selection */}
                <select
                  value={safeEditForm.category || 'plumbing'}
                  onChange={(e) => setEditForm({ ...safeEditForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                >
                  <option value="plumbing">Plumbing</option>
                  <option value="valves">Valves</option>
                  <option value="fittings">Fittings</option>
                  <option value="installation">Installation</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                
                {/* Features */}
                <div>
                  <label className="block text-sm font-medium mb-2">Caracteristici:</label>
                  {(safeEditForm.features || ['']).map((feature, index) => (
                    <div key={index} className="flex mb-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...(safeEditForm.features || [''])];
                          newFeatures[index] = e.target.value;
                          setEditForm({ ...safeEditForm, features: newFeatures });
                        }}
                        placeholder={`Caracteristică ${index + 1}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg mr-2 focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newFeatures = (safeEditForm.features || ['']).filter((_, i) => i !== index);
                          setEditForm({ ...safeEditForm, features: newFeatures });
                        }}
                        className="text-red-600 hover:text-red-800 p-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditForm({ 
                      ...safeEditForm, 
                      features: [...(safeEditForm.features || ['']), ''] 
                    })}
                    className="text-primary hover:text-primary-dark text-sm"
                  >
                    + Adaugă caracteristică
                  </button>
                </div>
                
                {/* Price and Unit */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Preț:</label>
                    <input
                      type="text"
                      value={safeEditForm.price || ''}
                      onChange={(e) => setEditForm({ ...safeEditForm, price: e.target.value })}
                      placeholder="€25.99"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Unitate:</label>
                    <input
                      type="text"
                      value={safeEditForm.unit || ''}
                      onChange={(e) => setEditForm({ ...safeEditForm, unit: e.target.value })}
                      placeholder="per piece"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleSave(safeEditForm, 'services')}
                    disabled={!safeEditForm.title || !safeEditForm.price}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvează
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Anulează
                  </button>
                </div>
              </div>
            </div>
          )}

          {safeServices.map((service) => (
            <div key={service.id} className="bg-white border border-gray-200 rounded-xl p-6">
              {isEditing === `services-${service.id}` ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={safeEditForm.title || ''}
                    onChange={(e) => setEditForm({ ...safeEditForm, title: e.target.value })}
                    placeholder="Titlu serviciu"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    required
                  />
                  <textarea
                    value={safeEditForm.description || ''}
                    onChange={(e) => setEditForm({ ...safeEditForm, description: e.target.value })}
                    placeholder="Descriere serviciu"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                  
                  {/* Category Selection */}
                  <select
                    value={safeEditForm.category || 'plumbing'}
                    onChange={(e) => setEditForm({ ...safeEditForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="plumbing">Plumbing</option>
                    <option value="valves">Valves</option>
                    <option value="fittings">Fittings</option>
                    <option value="installation">Installation</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                  
                  {/* Features */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Caracteristici:</label>
                    {(safeEditForm.features || ['']).map((feature, index) => (
                      <div key={index} className="flex mb-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => {
                            const newFeatures = [...(safeEditForm.features || [''])];
                            newFeatures[index] = e.target.value;
                            setEditForm({ ...safeEditForm, features: newFeatures });
                          }}
                          placeholder={`Caracteristică ${index + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg mr-2 focus:ring-2 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newFeatures = (safeEditForm.features || ['']).filter((_, i) => i !== index);
                            setEditForm({ ...safeEditForm, features: newFeatures });
                          }}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEditForm({ 
                        ...safeEditForm, 
                        features: [...(safeEditForm.features || ['']), ''] 
                      })}
                      className="text-primary hover:text-primary-dark text-sm"
                    >
                      + Adaugă caracteristică
                    </button>
                  </div>
                  
                  {/* Price and Unit */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Preț:</label>
                      <input
                        type="text"
                        value={safeEditForm.price || ''}
                        onChange={(e) => setEditForm({ ...safeEditForm, price: e.target.value })}
                        placeholder="€25.99"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Unitate:</label>
                      <input
                        type="text"
                        value={safeEditForm.unit || ''}
                        onChange={(e) => setEditForm({ ...safeEditForm, unit: e.target.value })}
                        placeholder="per piece"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleSave(safeEditForm, 'services')}
                      disabled={!safeEditForm.title || !safeEditForm.price}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvează
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Anulează
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {service?.title || 'Untitled Service'}
                  </h3>
                  <p className="text-text-secondary mb-4">
                    {service?.description || 'No description available'}
                  </p>
                  
                  {/* Features List */}
                  {service?.features && Array.isArray(service.features) && service.features.length > 0 && (
                    <ul className="text-sm text-text-secondary mb-4 space-y-1">
                      {service.features.map((feature, index) => (
                        <li key={`feature-${index}`} className="flex items-center">
                          <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                          <span>{feature || 'No feature description'}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {/* Price Display */}
                  <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
                    <span className="text-lg font-bold text-primary">
                      {service?.price || 'No price set'}
                    </span>
                    <span className="text-sm text-text-secondary">
                      {service?.unit || 'per unit'}
                    </span>
                  </div>
                  
                  {/* Category Badge */}
                  {service?.category && (
                    <div className="mb-4">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                        {service.category}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEdit(service || {}, 'services')}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editează
                    </button>
                    <button
                      onClick={() => handleDelete(service?.id, 'services')}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Șterge
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Add New Service Card */}
          {!isEditing && (
            <div 
              className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-blue-50 transition-colors"
              onClick={() => {
                console.log('Clicking add new service card...');
                startEdit(defaultService, 'services');
              }}
            >
              <div className="text-center">
                <Plus className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-text-secondary font-medium">Adaugă Serviciu Nou</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ServicesTab;