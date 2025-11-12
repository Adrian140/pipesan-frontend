import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AccountTypeSelector from './forms/AccountTypeSelector';
import IndividualFields from './forms/IndividualFields';
import CompanyFields from './forms/CompanyFields';
import CommonFields from './forms/CommonFields';
import TermsCheckboxes from './forms/TermsCheckboxes';
import { AlertTriangle, CheckCircle, Info, Mail } from 'lucide-react';

function RegisterForm() {
  const [formData, setFormData] = useState({
    accountType: 'individual', // 'individual' or 'company'
    firstName: '',
    lastName: '',
    companyName: '',
    cui: '',
    vatNumber: '',
    companyAddress: '',
    companyCity: '',
    companyPostalCode: '',
    email: '',
    deliveryCountry: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptMarketing: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register, user, sessionChecked } = useAuth();
  const navigate = useNavigate();

  // Redirection si déjà connecté
  React.useEffect(() => {
    if (user && sessionChecked) {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectPath = urlParams.get('redirect');
      if (redirectPath) {
        navigate(redirectPath);
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, sessionChecked, navigate]);

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return minLength && hasUpperCase && hasNumber;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation selon le type de compte
    if (formData.accountType === 'individual') {
      if (!formData.firstName || !formData.lastName) {
        setError('Le prénom et le nom sont obligatoires pour les particuliers.');
        setLoading(false);
        return;
      }
    } else if (formData.accountType === 'company') {
      if (!formData.companyName || !formData.cui || !formData.companyAddress || !formData.companyCity || !formData.companyPostalCode) {
        setError('Tous les champs marqués d’un * sont obligatoires pour les entreprises.');
        setLoading(false);
        return;
      }
    }

    // Validation e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Veuillez saisir une adresse e-mail valide.');
      setLoading(false);
      return;
    }

    // Validation mot de passe
    if (!validatePassword(formData.password)) {
      setError('Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    if (!formData.acceptTerms) {
      setError('Vous devez accepter les Termes et Conditions.');
      setLoading(false);
      return;
    }

    if (!formData.deliveryCountry) {
      setError('Le pays de livraison est obligatoire.');
      setLoading(false);
      return;
    }

    setError('');
    try {
      const result = await register(formData);

      if (result.success) {
        setSuccess(result.message);
        // Reset form
        setFormData({
          accountType: 'individual',
          firstName: '',
          lastName: '',
          companyName: '',
          cui: '',
          vatNumber: '',
          companyAddress: '',
          companyCity: '',
          companyPostalCode: '',
          email: '',
          deliveryCountry: '',
          password: '',
          confirmPassword: '',
          acceptTerms: false,
          acceptMarketing: false
        });
        console.log('✅ Inscription réussie, affichage du message de succès');
      } else {
        setError(result.error);

        // Suggestion de connexion si le compte existe déjà
        if (String(result.error || '').toLowerCase().includes('existe déjà')) {
          setTimeout(() => {
            if (confirm('Voulez-vous aller à la page de connexion ?')) {
              navigate('/login');
            }
          }, 2000);
        }
      }
    } catch (err) {
      console.error('💥 Registration form error:', err);
      setError('Une erreur inattendue est survenue. Veuillez réessayer.');
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    if (error) setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-text-primary">
            Créer un compte
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            Ou{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
              connectez-vous ici
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800 mb-1">
                    Erreur à l’inscription
                  </h3>
                  <p className="text-sm text-red-700">{error}</p>

                  {String(error).toLowerCase().includes('existe déjà') && (
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <p className="text-xs text-red-600">
                        💡 Conseil : essayez de vous connecter ou utilisez « Mot de passe oublié ».
                      </p>
                    </div>
                  )}

                  {String(error).toLowerCase().includes('mot de passe') && (
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <p className="text-xs text-red-600">
                        💡 Le mot de passe doit contenir : 8+ caractères, une majuscule, un chiffre.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Succès */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-green-800 mb-1">
                    Compte créé avec succès !
                  </h3>
                  <p className="text-sm text-green-700 mb-3">{success}</p>

                  <div className="bg-white border border-green-300 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <Mail className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-800">
                        Prochaines étapes :
                      </span>
                    </div>
                    <ul className="text-xs text-green-700 space-y-1">
                      <li>1. 📧 Vérifiez votre boîte de réception</li>
                      <li>2. 🗂️ Regardez aussi le dossier Spam/Indésirables</li>
                      <li>3. 🔗 Cliquez sur le lien de vérification</li>
                      <li>4. ✅ Vous serez redirigé automatiquement vers le site</li>
                    </ul>
                  </div>

                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link
                        to="/login"
                        className="flex-1 text-center bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Aller à la connexion
                      </Link>
                      <Link
                        to="/"
                        className="flex-1 text-center border border-green-300 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors"
                      >
                        Retour à l’accueil
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <AccountTypeSelector accountType={formData.accountType} onChange={handleChange} />

            {formData.accountType === 'individual' && (
              <IndividualFields formData={formData} onChange={handleChange} />
            )}

            {formData.accountType === 'company' && (
              <CompanyFields formData={formData} onChange={handleChange} />
            )}

            <CommonFields
              formData={formData}
              onChange={handleChange}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
            />
          </div>

          <TermsCheckboxes formData={formData} onChange={handleChange} />

          {/* Infos vérification e-mail */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">
                  Informations importantes concernant la vérification de l’e-mail
                </h3>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• 📧 Un e-mail de confirmation vous sera envoyé</li>
                  <li>• 🔗 Cliquez sur le lien pour activer votre compte</li>
                  <li>• ⏰ Le lien expire dans 24 heures</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                Création du compte…
              </>
            ) : (
              'Créer un compte'
            )}
          </button>

          {/* Aide */}
          <div className="text-center">
            <p className="text-sm text-text-secondary">
              Vous rencontrez un problème ?{' '}
              <Link to="/contact" className="text-primary hover:text-primary-dark">
                Contactez le support
              </Link>{' '}
              ou{' '}
              <a
                href="https://wa.me/33675111618"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-dark"
              >
                écrivez-nous sur WhatsApp
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterForm;
