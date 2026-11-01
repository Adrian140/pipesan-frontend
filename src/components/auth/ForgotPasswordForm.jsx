import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const T = {
  fr: { title: 'Mot de passe oublié', sub: 'Saisissez votre email pour recevoir le lien de réinitialisation', send: 'Envoyer le lien', sending: 'Envoi…', back: 'Retour à la connexion', sent: 'Si un compte existe pour cette adresse, un email avec le lien de réinitialisation vient d’être envoyé. Pensez à vérifier les spams.' },
  en: { title: 'Forgot password', sub: 'Enter your email to receive a reset link', send: 'Send reset link', sending: 'Sending…', back: 'Back to sign in', sent: 'If an account exists for this address, we have just sent an email with a reset link. Please check your spam folder too.' },
  it: { title: 'Password dimenticata', sub: 'Inserisci la tua email per ricevere il link di reimpostazione', send: 'Invia il link', sending: 'Invio…', back: 'Torna all’accesso', sent: 'Se esiste un account con questo indirizzo, ti abbiamo inviato un’email con il link. Controlla anche lo spam.' },
  de: { title: 'Passwort vergessen', sub: 'Geben Sie Ihre E-Mail ein, um einen Link zum Zurücksetzen zu erhalten', send: 'Link senden', sending: 'Wird gesendet…', back: 'Zurück zur Anmeldung', sent: 'Falls ein Konto mit dieser Adresse existiert, haben wir soeben eine E-Mail mit dem Link gesendet. Bitte prüfen Sie auch den Spam-Ordner.' },
  es: { title: 'Contraseña olvidada', sub: 'Introduce tu email para recibir el enlace de restablecimiento', send: 'Enviar enlace', sending: 'Enviando…', back: 'Volver a iniciar sesión', sent: 'Si existe una cuenta con esta dirección, acabamos de enviarte un email con el enlace. Revisa también la carpeta de spam.' },
  ro: { title: 'Recuperare parolă', sub: 'Introdu adresa de email pentru a primi linkul de resetare', send: 'Trimite link de resetare', sending: 'Se trimite…', back: 'Înapoi la autentificare', sent: 'Dacă există un cont cu această adresă, ți-am trimis un email cu linkul de resetare. Verifică și folderul spam.' },
};

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { forgotPassword } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = T[currentLanguage] || T.fr;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const result = await forgotPassword(email);
    
    if (result.success) {
      setMessage(t.sent);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-text-primary">
            {t.title}
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            {t.sub}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
              {message}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-light w-5 h-5" />
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t.sending : t.send}
          </button>
          
          <div className="text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center text-sm text-primary hover:text-primary-dark"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t.back}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordForm;