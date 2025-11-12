import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../config/supabase';
import CardBox from '../components/layout/Section';

const Status = {
  idle: 'idle',
  error: 'error',
  success: 'success',
  saving: 'saving',
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState(Status.idle);
  const [message, setMessage] = useState('');

  const token = useMemo(() => new URLSearchParams(location.search).get('access_token'), [location.search]);

  useEffect(() => {
    if (!token) {
      setStatus(Status.error);
      setMessage('Link invalid sau expirat.');
      return;
    }
    supabase.auth
      .getSessionFromUrl({ storeSession: true })
      .then(({ error }) => {
        if (error) {
          setStatus(Status.error);
          setMessage('Link invalid sau expirat.');
        }
      })
      .catch(() => {
        setStatus(Status.error);
        setMessage('Link invalid sau expirat.');
      });
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setStatus(Status.error);
      setMessage('Parolele nu coincid.');
      return;
    }
    setStatus(Status.saving);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setStatus(Status.error);
      setMessage('Link invalid sau expirat.');
      return;
    }
    setStatus(Status.success);
    setMessage('Parola a fost schimbată cu succes.');
    setTimeout(() => navigate('/login'), 2500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-md rounded-2xl p-6 space-y-4">
          <h1 className="text-2xl font-semibold">Resetare parolă</h1>
          <p className="text-sm text-gray-500">
            Introdu noua parolă pentru contul tău. Link-ul expiră după o perioadă scurtă.
          </p>
          {message && (
            <div
              className={`p-3 rounded text-sm ${
                status === Status.success ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
              }`}
            >
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Noua parolă</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Confirmă parola</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <button
              type="submit"
              disabled={status === Status.saving}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {status === Status.saving ? 'Se încarcă...' : 'Actualizează parola'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
