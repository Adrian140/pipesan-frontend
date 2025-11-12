import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../config/supabase';

const Status = {
  idle: 'idle',
  error: 'error',
  success: 'success',
  saving: 'saving',
};

const resetTranslations = {
  fr: {
    title: 'Réinitialiser le mot de passe',
    subtitle: 'Renseignez une nouvelle mot de passe pour accéder à votre compte.',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmez le mot de passe',
    mismatch: 'Les mots de passe ne correspondent pas.',
    invalid: 'Lien invalide ou expiré.',
    success: 'Le mot de passe a été mis à jour.',
    reuse: 'Veuillez choisir un mot de passe différent de l’ancien.',
    submit: 'Modifier le mot de passe',
    loading: 'En cours...',
  },
  en: {
    title: 'Reset password',
    subtitle: 'Provide a new password to restore access to your account.',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    mismatch: 'Passwords do not match.',
    invalid: 'Invalid or expired link.',
    success: 'Your password has been updated.',
    reuse: 'Please choose a password that is different from the current one.',
    submit: 'Update password',
    loading: 'Saving...',
  },
  it: {
    title: 'Reimpostazione password',
    subtitle: 'Inserisci una nuova password per accedere al tuo account.',
    newPassword: 'Nuova password',
    confirmPassword: 'Conferma password',
    mismatch: 'Le password non corrispondono.',
    invalid: 'Link non valido o scaduto.',
    success: 'La password è stata aggiornata.',
    reuse: 'Scegli una password diversa da quella attuale.',
    submit: 'Aggiorna password',
    loading: 'Salvataggio...',
  },
  de: {
    title: 'Passwort zurücksetzen',
    subtitle: 'Lege ein neues Passwort für dein Konto fest.',
    newPassword: 'Neues Passwort',
    confirmPassword: 'Passwort bestätigen',
    mismatch: 'Passwörter stimmen nicht überein.',
    invalid: 'Ungültiger oder abgelaufener Link.',
    success: 'Das Passwort wurde aktualisiert.',
    reuse: 'Bitte wähle ein anderes Passwort als das aktuelle.',
    submit: 'Passwort aktualisieren',
    loading: 'Speichern...',
  },
  es: {
    title: 'Restablecer contraseña',
    subtitle: 'Introduce una nueva contraseña para acceder a tu cuenta.',
    newPassword: 'Nueva contraseña',
    confirmPassword: 'Confirma la contraseña',
    mismatch: 'Las contraseñas no coinciden.',
    invalid: 'Enlace inválido o caducado.',
    success: 'Tu contraseña se ha actualizado.',
    reuse: 'Elige una contraseña distinta de la actual.',
    submit: 'Actualizar contraseña',
    loading: 'Guardando...',
  },
  ro: {
    title: 'Resetare parolă',
    subtitle: 'Introdu o nouă parolă pentru contul tău.',
    newPassword: 'Noua parolă',
    confirmPassword: 'Confirmă parola',
    mismatch: 'Parolele nu coincid.',
    invalid: 'Link invalid sau expirat.',
    success: 'Parola a fost actualizată.',
    reuse: 'Te rugăm să alegi o parolă diferită de cea actuală.',
    submit: 'Actualizează parola',
    loading: 'Se încarcă...',
  },
};

const getResetText = (lang) => resetTranslations[lang] || resetTranslations.fr;

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLanguage } = useLanguage();
  const text = useMemo(() => getResetText(currentLanguage), [currentLanguage]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState(Status.idle);
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);

  const recoveryParams = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(
      location.hash.startsWith('#') ? location.hash.slice(1) : location.hash
    );

    return {
      accessToken: hashParams.get('access_token') || searchParams.get('access_token'),
      code: searchParams.get('code'),
    };
  }, [location.search, location.hash]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isCancelled = false;

    const hydrateSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          if (!isCancelled) {
            setStatus(Status.idle);
            setMessage('');
            setReady(true);
          }
          return;
        }

        if (recoveryParams.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
        } else if (recoveryParams.accessToken) {
          const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
          if (error) throw error;
        } else {
          throw new Error('No recovery params');
        }

        if (!isCancelled) {
          setStatus(Status.idle);
          setMessage('');
          setReady(true);
        }
      } catch (err) {
        console.error('Failed to hydrate Supabase session from URL:', err);
        if (!isCancelled) {
          setStatus(Status.error);
          setMessage(text.invalid);
          setReady(true);
        }
      }
    };

    hydrateSession();

    return () => {
      isCancelled = true;
    };
  }, [recoveryParams.accessToken, recoveryParams.code, text.invalid, location.key]);

  const isSameAsCurrentPassword = async (password) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) return false;

      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      return !error;
    } catch (err) {
      console.warn('Could not verify password reuse:', err);
      return false;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!ready) {
      setStatus(Status.error);
      setMessage(text.invalid);
      return;
    }
    if (!newPassword || newPassword !== confirmPassword) {
      setStatus(Status.error);
      setMessage(text.mismatch);
      return;
    }

    setStatus(Status.saving);

    const reuseDetected = await isSameAsCurrentPassword(newPassword);
    if (reuseDetected) {
      setStatus(Status.error);
      setMessage(text.reuse);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setStatus(Status.error);
      setMessage(text.invalid);
      return;
    }
    await supabase.auth.signOut();
    setStatus(Status.success);
    setMessage(text.success);
    setTimeout(() => navigate('/login'), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-md rounded-2xl p-6 space-y-4">
          <h1 className="text-2xl font-semibold">{text.title}</h1>
          <p className="text-sm text-gray-500">{text.subtitle}</p>
          {message && (
            <div
              className={`p-3 rounded text-sm ${
                status === Status.success
                  ? 'bg-green-50 text-green-700 border border-green-100'
                  : 'bg-red-50 text-red-700 border border-red-100'
              }`}
            >
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">{text.newPassword}</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{text.confirmPassword}</label>
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
              disabled={status === Status.saving || !ready}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {status === Status.saving ? text.loading : text.submit}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
