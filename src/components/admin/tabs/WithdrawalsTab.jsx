import React, { useEffect, useState } from 'react';
import { RotateCcw, RefreshCw } from 'lucide-react';
import { withdrawalsApi } from '../../../config/api/withdrawals';

const STATUSES = [['received', 'Primită'], ['return_pending', 'Așteptăm returul'], ['refunded', 'Rambursată'], ['rejected', 'Respinsă']];

// Retrageri trimise de clienți prin butonul „Renunță la contract aici” (/withdrawal).
function WithdrawalsTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await withdrawalsApi.list());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    try {
      await withdrawalsApi.update(id, { status });
      setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2"><RotateCcw className="w-5 h-5" />Retrageri din contract</h2>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 text-sm text-primary"><RefreshCw className="w-4 h-4" />Reîncarcă</button>
      </div>
      <p className="text-sm text-text-secondary">Clientul a primit deja confirmarea. Răspunde-i pe email cu adresa de retur, apoi rambursează în cel mult 14 zile de la data cererii.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? <p className="text-text-secondary">Se încarcă…</p> : rows.length === 0 ? <p className="text-text-secondary">Nicio cerere de retragere.</p> : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-text-secondary">
              <tr><th className="px-4 py-2">Data</th><th className="px-4 py-2">Comanda</th><th className="px-4 py-2">Client</th><th className="px-4 py-2">Produse / comentariu</th><th className="px-4 py-2">Termen rambursare</th><th className="px-4 py-2">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString('ro-RO')}</td>
                  <td className="px-4 py-2 font-mono">{r.order_ref}{!r.order_id && <span className="block text-xs text-amber-600 font-sans">negăsită automat</span>}</td>
                  <td className="px-4 py-2">{r.full_name}<a href={`mailto:${r.email}`} className="block text-primary">{r.email}</a></td>
                  <td className="px-4 py-2 max-w-xs">{r.items || 'toată comanda'}{r.note && <span className="block text-text-secondary">{r.note}</span>}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(new Date(r.created_at).getTime() + 14 * 864e5).toLocaleDateString('ro-RO')}</td>
                  <td className="px-4 py-2">
                    <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} className="border border-gray-300 rounded px-2 py-1">
                      {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default WithdrawalsTab;
