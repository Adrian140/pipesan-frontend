// src/components/admin/OrderDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from "../../../config/api";

export default function OrderDetail() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient.admin.getOrderById(id);
        setOrder(data);
        setStatus(data?.status ?? '');
        setCarrierName(data?.carrier ?? '');
        setTrackingNumber(data?.tracking_number ?? '');
        setTrackingUrl(data?.tracking_url ?? '');
      } catch (e) {
        console.error(e);
        setMessage('❌ Eroare la încărcarea comenzii');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleUpdate = async () => {
    if (!order?.id) return;

    try {
      setSaving(true);
      setMessage('');

      const prevStatus = order?.status; // capturat înainte de patch
      const patch = { status, admin_comment: adminComment };

      // câmpuri tracking pentru shipped/completed
      if (status === 'shipped' || status === 'completed') {
        if (carrierName)    patch.carrier = carrierName;
        if (trackingNumber) patch.tracking_number = trackingNumber;
        if (trackingUrl)    patch.tracking_url = trackingUrl;
      }

      // upload factură la completed (dacă ai user.id în payloadul comenzii)
      if (status === 'completed' && invoiceFile && order?.users?.id) {
        const formData = new FormData();
        formData.append('invoice', invoiceFile);
        formData.append('invoiceNumber', `INV-${order.order_number}`);
        const uploaded = await apiClient.admin.uploadUserInvoice(order.users.id, formData);
        if (uploaded?.id) {
          patch.invoice_id = uploaded.id;
        }
      }

      const updated = await apiClient.admin.updateOrder(order.id, patch);
      setOrder(updated);
      setStatus(updated.status);

      setMessage('✅ Commande mise à jour avec succès');
    } catch (e) {
      console.error(e);
      setMessage('❌ Échec de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Chargement…</div>;
  if (!order)   return <div className="p-6">Commande inexistante.</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Commande #{order.order_number}</h1>
        <Link to="/admin" className="text-primary underline">← Retour à l’Admin</Link>
      </div>

      {/* Résumé commande */}
      <div className="bg-white border rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-500">Statut</div>
            <div className="font-semibold">{order.status}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Total</div>
            <div className="font-semibold">
              {Number(order.total_amount).toFixed(2)} {order.currency}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Créée le</div>
            <div className="font-semibold">
              {new Date(order.created_at).toLocaleString('fr-FR')}
            </div>
          </div>
        </div>
      </div>

      {/* Produits */}
      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Produits</h2>
        <div className="divide-y">
          {(order.items || []).map(it => (
            <div key={it.id} className="py-2 flex items-center justify-between">
              <div>
                <div className="font-medium">{it.name}</div>
                <div className="text-sm text-gray-500">SKU : {it.sku}</div>
              </div>
              <div className="text-sm text-gray-600">x{it.quantity}</div>
              <div className="font-semibold">
                {Number(it.price ?? it.unit_price).toFixed(2)} {order.currency}
              </div>
            </div>
          ))}
          {(!order.items || order.items.length === 0) && (
            <div className="text-gray-500">Aucun article dans cette commande.</div>
          )}
        </div>
      </div>

      {/* Adresses */}
      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Adresses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">📦 Adresse de livraison</h3>
            <p>{order.shipping_first_name} {order.shipping_last_name}</p>
            <p>{order.shipping_address}</p>
            <p>{order.shipping_postal_code} {order.shipping_city}</p>
            <p>{order.shipping_country}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">🧾 Adresse de facturation</h3>
            <p>{order.billing_first_name} {order.billing_last_name}</p>
            <p>{order.billing_address}</p>
            <p>{order.billing_postal_code} {order.billing_city}</p>
            <p>{order.billing_country}</p>
          </div>
        </div>
      </div>

      {/* ✅ NEW: Gestion du statut */}
      <div className="bg-white border rounded-xl p-4 space-y-4">
        <h2 className="font-semibold mb-3">Mettre à jour le statut</h2>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.includes('✅')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nouveau statut</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              {['pending', 'paid', 'shipped', 'delivered', 'completed', 'canceled'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {['shipped', 'completed'].includes(status) && (
            <>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Transporteur</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Ex: Colissimo, UPS..."
                  value={carrierName}
                  onChange={e => setCarrierName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Numéro de suivi</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Tracking ID"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Lien de suivi</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="https://..."
                  value={trackingUrl}
                  onChange={e => setTrackingUrl(e.target.value)}
                />
              </div>
            </>
          )}

          {status === 'canceled' && (
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Raison de l’annulation</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2"
                rows={3}
                value={adminComment}
                onChange={e => setAdminComment(e.target.value)}
                placeholder="Expliquez la raison..."
              />
            </div>
          )}

          {status === 'completed' && (
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Téléverser la facture (PDF)</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={e => setInvoiceFile(e.target.files[0])}
              />
            </div>
          )}
        </div>

        <button
          onClick={handleUpdate}
          disabled={saving}
          className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition disabled:opacity-50"
        >
          {saving ? 'Mise à jour…' : 'Mettre à jour la commande'}
        </button>
      </div>
    </div>
  );
}
