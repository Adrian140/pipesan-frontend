import React, { useState } from 'react';
import { X, User, Building, MapPin, FileText, Upload, Download, Eye, Trash2, Plus, Calendar, Mail, Phone, Truck, ExternalLink, Package } from 'lucide-react';
import { apiClient } from '../../config/api';

function UserDetailModal({ user, isOpen, onClose, onRefresh }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [invoiceFile, setInvoiceFile] = useState(null);
  
  // Tracking form states
  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [editingTracking, setEditingTracking] = useState(null);
  const [trackingForm, setTrackingForm] = useState({
    carrierName: 'UPS',
    carrierUrl: '',
    trackingNumber: '',
    trackingUrl: '',
    shippingStatus: 'pending',
    estimatedDelivery: '',
    notes: '',
    invoiceId: null
  });

  const carriers = [
    { name: 'UPS', url: 'https://www.ups.com' },
    { name: 'DHL', url: 'https://www.dhl.com' },
    { name: 'DPD', url: 'https://www.dpd.com' },
    { name: 'Chronopost', url: 'https://www.chronopost.fr' },
    { name: 'La Poste', url: 'https://www.laposte.fr' },
    { name: 'GLS', url: 'https://gls-group.eu' },
    { name: 'FedEx', url: 'https://www.fedex.com' },
    { name: 'TNT', url: 'https://www.tnt.com' },
    { name: 'Hermes', url: 'https://www.hermes-europe.co.uk' },
    { name: 'SEUR', url: 'https://www.seur.com' }
  ];

  const shippingStatuses = [
    { value: 'pending', label: 'În pregătire', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'picked_up', label: 'Ridicat de curier', color: 'bg-blue-100 text-blue-800' },
    { value: 'in_transit', label: 'În transport', color: 'bg-purple-100 text-purple-800' },
    { value: 'out_for_delivery', label: 'În curs de livrare', color: 'bg-orange-100 text-orange-800' },
    { value: 'delivered', label: 'Livrat', color: 'bg-green-100 text-green-800' },
    { value: 'exception', label: 'Problemă transport', color: 'bg-red-100 text-red-800' }
  ];

  if (!isOpen || !user) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data invalidă';
    }
  };

  const getDisplayName = () => {
    if (user.billingProfiles && user.billingProfiles.length > 0) {
      const companyProfile = user.billingProfiles.find(p => p.type === 'company' && p.company_name);
      if (companyProfile) {
        return companyProfile.company_name;
      }
    }
    
    const firstName = user.first_name || user.firstName || '';
    const lastName = user.last_name || user.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    return user.email || 'Utilizator';
  };

  const getUserType = () => {
    if (user.billingProfiles && user.billingProfiles.length > 0) {
      const hasCompany = user.billingProfiles.some(p => p.type === 'company');
      return hasCompany ? 'company' : 'individual';
    }
    return 'individual';
  };

  const handleInvoiceUpload = async () => {
    if (!invoiceFile) {
      setMessage('Selectează un fișier PDF pentru încărcare');
      return;
    }

    if (invoiceFile.type !== 'application/pdf') {
      setMessage('Te rugăm să selectezi doar fișiere PDF');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('invoice', invoiceFile);
      formData.append('userId', user.id);
      formData.append('invoiceNumber', `INV-${Date.now()}`);

      await apiClient.admin.uploadUserInvoice(user.id, formData);
      setMessage('Factura a fost încărcată cu succes! Email trimis automat către client.');
      setInvoiceFile(null);
      
      // Refresh user data to show new invoice
      onRefresh();
    } catch (error) {
      console.error('Error uploading invoice:', error);
      setMessage(`Eroare la încărcarea facturii: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleTrackingSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage('');

    try {
      if (editingTracking) {
        await apiClient.admin.updateTrackingInfo(editingTracking.id, trackingForm);
        setMessage('Informațiile de urmărire au fost actualizate! Email trimis automat către client.');
      } else {
        await apiClient.admin.addTrackingInfo(user.id, trackingForm);
        setMessage('Informațiile de urmărire au fost adăugate! Email trimis automat către client.');
      }
      
      setShowTrackingForm(false);
      setEditingTracking(null);
      setTrackingForm({
        carrierName: 'UPS',
        carrierUrl: '',
        trackingNumber: '',
        trackingUrl: '',
        shippingStatus: 'pending',
        estimatedDelivery: '',
        notes: '',
        invoiceId: null
      });
      
      onRefresh();
    } catch (error) {
      console.error('Error saving tracking info:', error);
      setMessage(`Eroare la salvarea informațiilor: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCarrierChange = (carrierName) => {
    const carrier = carriers.find(c => c.name === carrierName);
    setTrackingForm(prev => ({
      ...prev,
      carrierName,
      carrierUrl: carrier?.url || ''
    }));
  };

  const editTrackingInfo = (tracking) => {
    setEditingTracking(tracking);
    setTrackingForm({
      carrierName: tracking.carrier_name || 'UPS',
      carrierUrl: tracking.carrier_url || '',
      trackingNumber: tracking.tracking_number || '',
      trackingUrl: tracking.tracking_url || '',
      shippingStatus: tracking.shipping_status || 'pending',
      estimatedDelivery: tracking.estimated_delivery || '',
      notes: tracking.notes || '',
      invoiceId: tracking.invoice_id || null
    });
    setShowTrackingForm(true);
  };

  const downloadInvoice = async (invoiceId) => {
    try {
      const blob = await apiClient.admin.downloadUserInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      setMessage('Eroare la descărcarea facturii');
    }
  };

  const deleteInvoice = async (invoiceId) => {
    if (!confirm('Ești sigur că vrei să ștergi această factură?')) return;

    try {
      await apiClient.admin.deleteUserInvoice(invoiceId);
      setMessage('Factura a fost ștearsă cu succes');
      onRefresh();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      setMessage('Eroare la ștergerea facturii');
    }
  };

  const deleteTrackingInfo = async (trackingId) => {
    if (!confirm('Ești sigur că vrei să ștergi aceste informații de urmărire?')) return;

    try {
      await apiClient.admin.deleteTrackingInfo(trackingId);
      setMessage('Informațiile de urmărire au fost șterse cu succes');
      onRefresh();
    } catch (error) {
      console.error('Error deleting tracking:', error);
      setMessage('Eroare la ștergerea informațiilor');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'addresses', label: 'Adrese', icon: MapPin },
    { id: 'invoices', label: 'Facturi', icon: FileText },
    { id: 'tracking', label: 'Transport', icon: Truck },
    { id: 'orders', label: 'Comenzi', icon: Calendar }
  ];

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Informații Personale
          </h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Nume complet:</label>
              <p className="text-text-primary">
                {user.first_name || ''} {user.last_name || ''}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Email:</label>
              <p className="text-text-primary">{user.email || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Telefon:</label>
              <p className="text-text-primary">{user.phone || 'Nu este specificat'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Țară:</label>
              <p className="text-text-primary">{user.country || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Limbă preferată:</label>
              <p className="text-text-primary">{user.language || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-text-primary mb-4">Informații Cont</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Rol:</label>
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {user.role === 'admin' ? 'Administrator' : 'Utilizator'}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Email verificat:</label>
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                user.email_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {user.email_verified ? 'Da' : 'Nu'}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">2FA activat:</label>
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                user.two_factor_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {user.two_factor_enabled ? 'Da' : 'Nu'}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Data înregistrării:</label>
              <p className="text-text-primary">{formatDate(user.created_at)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Ultima actualizare:</label>
              <p className="text-text-primary">{formatDate(user.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Profiles */}
      {user.billingProfiles && user.billingProfiles.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Profile de Facturare
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.billingProfiles.map((profile, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center mb-2">
                  {profile.type === 'company' ? (
                    <Building className="w-4 h-4 text-blue-600 mr-2" />
                  ) : (
                    <User className="w-4 h-4 text-gray-600 mr-2" />
                  )}
                  <span className="font-medium">
                    {profile.type === 'company' ? profile.company_name : `${profile.first_name} ${profile.last_name}`}
                  </span>
                  {profile.is_default && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Implicit
                    </span>
                  )}
                </div>
                {profile.vat_number && (
                  <p className="text-sm text-gray-600">VAT: {profile.vat_number}</p>
                )}
                <p className="text-sm text-gray-600">{profile.address}</p>
                <p className="text-sm text-gray-600">{profile.city}, {profile.postal_code}</p>
                <p className="text-sm text-gray-600">{profile.country}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAddressesTab = () => (
    <div className="space-y-4">
      {user.addresses && user.addresses.length > 0 ? (
        user.addresses.map((address, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-primary mr-2" />
                <h4 className="text-lg font-semibold text-text-primary">
                  {address.label || `Adresa ${index + 1}`}
                </h4>
                {address.is_default && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Implicit
                  </span>
                )}
              </div>
              <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                {address.type === 'shipping' ? 'Livrare' : address.type === 'billing' ? 'Facturare' : 'Ambele'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-text-primary">{address.first_name} {address.last_name}</p>
                {address.company && <p className="text-gray-600">{address.company}</p>}
                <p className="text-gray-600">{address.address}</p>
                <p className="text-gray-600">{address.city}, {address.postal_code}</p>
                <p className="text-gray-600">{address.country}</p>
              </div>
              <div>
                {address.phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">{address.phone}</span>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Creată: {formatDate(address.created_at)}
                </p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-secondary mb-2">
            Nicio adresă salvată
          </h3>
          <p className="text-text-light">
            Utilizatorul nu a adăugat încă adrese de livrare sau facturare.
          </p>
        </div>
      )}
    </div>
  );

  const renderInvoicesTab = () => (
    <div className="space-y-6">
      {/* Upload Invoice Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <Upload className="w-5 h-5 mr-2" />
          Încarcă Factură Nouă
        </h4>
        
        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.includes('succes') 
              ? 'bg-green-50 border border-green-200 text-green-600'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">
              Selectează factura (PDF)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setInvoiceFile(e.target.files[0])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleInvoiceUpload}
              disabled={!invoiceFile || uploading}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Se încarcă...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Încarcă Factura
                </>
              )}
            </button>
            
            {invoiceFile && (
              <button
                onClick={() => setInvoiceFile(null)}
                className="text-gray-600 hover:text-gray-800 px-4 py-2 border border-gray-300 rounded-lg"
              >
                Anulează
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div>
        <h4 className="text-lg font-semibold text-text-primary mb-4">Facturile utilizatorului</h4>
        {user.invoices && user.invoices.length > 0 ? (
          <div className="space-y-3">
            {user.invoices.map((invoice, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-primary mr-3" />
                    <div>
                      <h5 className="font-medium text-text-primary">
                        Factura #{invoice.invoice_number || `INV-${index + 1}`}
                      </h5>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Data: {formatDate(invoice.date || invoice.created_at)}</p>
                        {invoice.total_amount && (
                          <p>Sumă: €{Number(invoice.total_amount).toFixed(2)}</p>
                        )}
                        <p className="flex items-center">
                          Status: 
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                            invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {invoice.status === 'paid' ? 'Plătită' :
                             invoice.status === 'pending' ? 'În așteptare' : 'Restantă'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadInvoice(invoice.id)}
                      className="text-primary hover:text-primary-dark p-2 border border-primary rounded-lg hover:bg-blue-50"
                      title="Descarcă factura"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteInvoice(invoice.id)}
                      className="text-red-600 hover:text-red-800 p-2 border border-red-300 rounded-lg hover:bg-red-50"
                      title="Șterge factura"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nicio factură încărcată pentru acest utilizator</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderTrackingTab = () => (
    <div className="space-y-6">
      {/* Add Tracking Form */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-green-900 flex items-center">
            <Truck className="w-5 h-5 mr-2" />
            {editingTracking ? 'Editează Informații Transport' : 'Adaugă Informații Transport'}
          </h4>
          <button
            onClick={() => setShowTrackingForm(!showTrackingForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showTrackingForm ? 'Ascunde' : 'Adaugă'}
          </button>
        </div>

        {showTrackingForm && (
          <form onSubmit={handleTrackingSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-green-900 mb-2">Firmă transport:</label>
                <select
                  value={trackingForm.carrierName}
                  onChange={(e) => handleCarrierChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  required
                >
                  {carriers.map(carrier => (
                    <option key={carrier.name} value={carrier.name}>{carrier.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-900 mb-2">Site curier:</label>
                <input
                  type="url"
                  value={trackingForm.carrierUrl}
                  onChange={(e) => setTrackingForm(prev => ({ ...prev, carrierUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="https://www.ups.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-900 mb-2">Cod urmărire:</label>
                <input
                  type="text"
                  value={trackingForm.trackingNumber}
                  onChange={(e) => setTrackingForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="1Z123ABC456789"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-900 mb-2">Link urmărire:</label>
                <input
                  type="url"
                  value={trackingForm.trackingUrl}
                  onChange={(e) => setTrackingForm(prev => ({ ...prev, trackingUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="https://www.ups.com/track?tracknum=..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-900 mb-2">Status:</label>
                <select
                  value={trackingForm.shippingStatus}
                  onChange={(e) => setTrackingForm(prev => ({ ...prev, shippingStatus: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                >
                  {shippingStatuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-900 mb-2">Livrare estimată:</label>
                <input
                  type="date"
                  value={trackingForm.estimatedDelivery}
                  onChange={(e) => setTrackingForm(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-green-900 mb-2">Note (opțional):</label>
              <textarea
                value={trackingForm.notes}
                onChange={(e) => setTrackingForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Note suplimentare despre transport..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-green-900 mb-2">Factură asociată (opțional):</label>
              <select
                value={trackingForm.invoiceId || ''}
                onChange={(e) => setTrackingForm(prev => ({ ...prev, invoiceId: e.target.value || null }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">Nicio factură selectată</option>
                {user.invoices && user.invoices.map(invoice => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoice_number} - €{Number(invoice.total_amount || 0).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={uploading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                    Se salvează...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 mr-2" />
                    {editingTracking ? 'Actualizează' : 'Adaugă'} & Trimite Email
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowTrackingForm(false);
                  setEditingTracking(null);
                  setTrackingForm({
                    carrierName: 'UPS',
                    carrierUrl: '',
                    trackingNumber: '',
                    trackingUrl: '',
                    shippingStatus: 'pending',
                    estimatedDelivery: '',
                    notes: '',
                    invoiceId: null
                  });
                }}
                className="text-gray-600 hover:text-gray-800 px-6 py-2 border border-gray-300 rounded-lg"
              >
                Anulează
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Tracking List */}
      <div>
        <h4 className="text-lg font-semibold text-text-primary mb-4">Informații Transport</h4>
        {user.tracking && user.tracking.length > 0 ? (
          <div className="space-y-4">
            {user.tracking.map((tracking, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Truck className="w-5 h-5 text-primary mr-3" />
                    <div>
                      <h5 className="font-medium text-text-primary">
                        {tracking.carrier_name} - {tracking.tracking_number}
                      </h5>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          shippingStatuses.find(s => s.value === tracking.shipping_status)?.color || 'bg-gray-100 text-gray-800'
                        }`}>
                          {shippingStatuses.find(s => s.value === tracking.shipping_status)?.label || tracking.shipping_status}
                        </span>
                        {tracking.estimated_delivery && (
                          <span className="text-xs text-gray-500">
                            Est: {formatDate(tracking.estimated_delivery)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {tracking.tracking_url && (
                      <a
                        href={tracking.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 p-2 border border-blue-300 rounded-lg hover:bg-blue-50"
                        title="Urmărește coletul"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => editTrackingInfo(tracking)}
                      className="text-primary hover:text-primary-dark p-2 border border-primary rounded-lg hover:bg-blue-50"
                      title="Editează informațiile"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTrackingInfo(tracking.id)}
                      className="text-red-600 hover:text-red-800 p-2 border border-red-300 rounded-lg hover:bg-red-50"
                      title="Șterge informațiile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {tracking.notes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> {tracking.notes}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-3">
                  Creat: {formatDate(tracking.created_at)} | Actualizat: {formatDate(tracking.updated_at)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nicio informație de urmărire adăugată pentru acest utilizator</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderOrdersTab = () => (
    <div className="space-y-4">
      {user.orders && user.orders.length > 0 ? (
        user.orders.map((order, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-primary mr-3" />
                <div>
                  <h5 className="font-medium text-text-primary">
                    Comanda #{order.order_number || `ORD-${index + 1}`}
                  </h5>
                  <p className="text-sm text-gray-600">
                    Data: {formatDate(order.created_at)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-text-primary">
                  €{Number(order.total_amount || 0).toFixed(2)}
                </p>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status === 'delivered' ? 'Livrată' :
                   order.status === 'shipped' ? 'Expediată' :
                   order.status === 'processing' ? 'În procesare' :
                   order.status === 'pending' ? 'În așteptare' : order.status}
                </span>
              </div>
            </div>
            
            {order.items && order.items.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h6 className="font-medium text-text-primary mb-2">Produse comandate:</h6>
                <div className="space-y-2">
                  {order.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span>€{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-secondary mb-2">
            Nicio comandă
          </h3>
          <p className="text-text-light">
            Utilizatorul nu a plasat încă nicio comandă.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center mr-4 ${
              getUserType() === 'company' ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              {getUserType() === 'company' ? (
                <Building className="h-6 w-6 text-blue-600" />
              ) : (
                <User className="h-6 w-6 text-gray-600" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">
                {getDisplayName()}
              </h2>
              <p className="text-text-secondary">
                {getUserType() === 'company' ? 'Cont firmă' : 'Cont personal'} • {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'addresses' && renderAddressesTab()}
          {activeTab === 'invoices' && renderInvoicesTab()}
          {activeTab === 'tracking' && renderTrackingTab()}
          {activeTab === 'orders' && renderOrdersTab()}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserDetailModal;
