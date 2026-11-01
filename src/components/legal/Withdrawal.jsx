import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RotateCcw, CheckCircle, Printer } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLegalText } from './LegalPage';
import { WITHDRAWAL_T } from '../../legal/withdrawal';
import { LEGAL_LOCALE, COMPANY } from '../../legal/company';
import { withdrawalsApi } from '../../config/api/withdrawals';

const inputClass = 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-text-primary focus:border-primary';

// Online withdrawal function (Directive (EU) 2023/2673): form, then "confirm withdrawal", then an acknowledgement.
function Withdrawal() {
  const { lang, t } = useLegalText(WITHDRAWAL_T);
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [form, setForm] = useState(() => ({
    name: [user?.firstName || user?.first_name, user?.lastName || user?.last_name].filter(Boolean).join(' '),
    email: user?.email || '',
    orderRef: params.get('order') || '',
    items: '',
    note: '',
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await withdrawalsApi.submit({ ...form, language: lang });
      setReceipt({ ...form, id: data.id, createdAt: data.created_at });
    } catch (err) {
      setError(err.code === 'limit' ? t.errLimit : err.code === 'invalid' ? t.errInvalid : t.errGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {receipt ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10">
            <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary mb-3">{t.doneTitle}</h1>
            <p className="text-text-secondary mb-6">{t.doneText}</p>
            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm border-t border-gray-100 pt-4">
              <dt className="text-text-secondary">{t.ref}</dt><dd className="font-mono text-text-primary break-all">{receipt.id}</dd>
              <dt className="text-text-secondary">{t.received}</dt><dd className="text-text-primary">{new Date(receipt.createdAt).toLocaleString(LEGAL_LOCALE[lang])}</dd>
              <dt className="text-text-secondary">{t.name}</dt><dd className="text-text-primary">{receipt.name}</dd>
              <dt className="text-text-secondary">Email</dt><dd className="text-text-primary">{receipt.email}</dd>
              <dt className="text-text-secondary">{t.order}</dt><dd className="text-text-primary">{receipt.orderRef.toUpperCase()}</dd>
              <dt className="text-text-secondary">{t.items.split(' (')[0]}</dt><dd className="text-text-primary">{receipt.items || t.all}</dd>
            </dl>
            <p className="text-xs text-text-secondary mt-6">{COMPANY.name} ({COMPANY.brand}) · {COMPANY.email}</p>
            <button type="button" onClick={() => window.print()} className="no-print mt-6 inline-flex items-center gap-2 border border-primary text-primary rounded-lg px-5 py-2.5 font-semibold">
              <Printer className="w-4 h-4" />{t.print}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10 space-y-5">
            <div>
              <RotateCcw className="w-10 h-10 text-primary mb-3" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary mb-2">{t.title}</h1>
              <p className="text-text-secondary">{t.intro}</p>
            </div>
            <label className="block text-sm font-medium text-text-primary">{t.name}
              <input required maxLength={200} autoComplete="name" value={form.name} onChange={set('name')} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-text-primary">{t.email}
              <input required type="email" maxLength={254} autoComplete="email" value={form.email} onChange={set('email')} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-text-primary">{t.order}
              <input required maxLength={60} placeholder="PS-20261101-XXXXXXXX" value={form.orderRef} onChange={set('orderRef')} className={`${inputClass} font-mono`} />
            </label>
            <label className="block text-sm font-medium text-text-primary">{t.items}
              <textarea rows={2} maxLength={2000} value={form.items} onChange={set('items')} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-text-primary">{t.note}
              <textarea rows={2} maxLength={2000} value={form.note} onChange={set('note')} className={inputClass} />
            </label>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-lg px-6 py-3 font-semibold disabled:opacity-50">
                {busy ? t.sending : t.confirm}
              </button>
              <Link to="/returns" className="text-primary underline text-sm">{t.policy}</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Withdrawal;
