import React, { useState } from 'react';
import { Mail, RefreshCw, CheckCircle, AlertTriangle, Info, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function EmailVerificationPrompt({ user }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const { resendEmailVerification } = useAuth();

  const handleResendVerification = async () => {
    setLoading(true);
    setMessage('');
    setSuccess(false);

    try {
      const result = await resendEmailVerification();
      
      if (result.success) {
        setMessage(result.message);
        setSuccess(true);
      } else {
        setMessage(result.error);
        setSuccess(false);
      }
    } catch (error) {
      console.error('Error resending verification:', error);
      setMessage('Eroare la trimiterea email-ului de verificare. Te rugăm să încerci din nou.');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (user?.email_verified || user?.emailVerified) {
    return null; // Don't show if already verified
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
      <div className="flex items-start">
        <Mail className="w-6 h-6 text-yellow-600 mr-3 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Verifică-ți adresa de email
          </h3>
          <p className="text-yellow-700 mb-4">
            Pentru a-ți proteja contul și a accesa toate funcționalitățile, 
            te rugăm să verifici adresa de email: <strong>{user?.email}</strong>
          </p>
          
          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              success 
                ? 'bg-green-50 border border-green-200 text-green-600'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              <div className="flex items-center">
                {success ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mr-2" />
                )}
                {message}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleResendVerification}
              disabled={loading}
              className="flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Se trimite...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retrimite email de verificare
                </>
              )}
            </button>
            
            <Link
              to="/"
              className="flex items-center justify-center px-4 py-2 border border-yellow-300 text-yellow-800 rounded-lg font-medium hover:bg-yellow-100 transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Înapoi la pagina principală
            </Link>
          </div>

          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
            <div className="flex items-start">
              <Info className="w-4 h-4 text-yellow-700 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium mb-1">Sfaturi pentru verificarea email-ului:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Verifică folderul Spam/Junk în căsuța ta poștală</li>
                  <li>• Caută email-uri de la "noreply@" și domeniul nostru</li>
                  <li>• Adaugă adresa noastră la contacte pentru viitor</li>
                  <li>• Link-ul de verificare expiră în 24 ore</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailVerificationPrompt;
