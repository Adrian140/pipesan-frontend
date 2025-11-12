import React, { useEffect, useState } from 'react';
import { Search, Eye, Truck, Package } from 'lucide-react';
import { apiClient } from '../../../config/api';
import { Link } from "react-router-dom";

const STATUS_BADGE = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  packed: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  completed: 'bg-emerald-100 text-emerald-800', // ✅ nou
  canceled: 'bg-red-100 text-red-800',
};

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiClient.admin.getOrders({ q, status, limit: 100 });
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // initial

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Comenzi</h2>
        <div className="text-sm text-gray-500">Total: {orders.length}</div>
      </div>

      <div className="bg-white border rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="pl-9 pr-3 py-2 border rounded-lg"
            placeholder="Caută #comandă sau email"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border rounded-lg"
          value={status}
          onChange={(e)=>setStatus(e.target.value)}
        >
          <option value="all">Toate statusurile</option>
          {['pending','paid','packed','shipped','delivered','completed','canceled'].map(s =>
            <option key={s} value={s}>{s}</option>
          )}
        </select>
        <button onClick={load} className="px-4 py-2 bg-primary text-white rounded-lg">
          Filtrează
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Conținut</th>
              <th className="px-4 py-3 text-left">Livrare</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map(o => (
              <tr key={o.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {o.users?.company_name ||
                      `${o.users?.first_name ?? ''} ${o.users?.last_name ?? ''}`.trim() ||
                      o.customer_email}
                  </div>
                  <div className="text-gray-500">{o.customer_email}</div>
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span>#{o.order_number}</span>
                  </div>
                  <div className="text-gray-500 text-xs">
                    {new Date(o.created_at).toLocaleString()}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-400" />
                    <span>{o.shipping_method || '—'}</span>
                  </div>
                  {o.tracking_number && (
                    <div className="text-xs text-gray-500">AWB: {o.tracking_number}</div>
                  )}
                </td>

                <td className="px-4 py-3 font-semibold">
                  {Number(o.total_amount).toFixed(2)} {o.currency}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      STATUS_BADGE[o.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {o.status}
                  </span>
                </td>

                <td className="px-4 py-3 text-right">
                  <Link
                    className="inline-flex items-center gap-1 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                    to={`/admin/orders/${o.id}`}
                  >
                    <Eye className="w-4 h-4" /> Detalii
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Nicio comandă.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
