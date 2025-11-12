import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Edit, Trash2, Save, X, Star, Calendar, User, CheckCircle, AlertTriangle, Package, Search, Filter } from 'lucide-react';
import { apiClient } from '../../../config/api';

function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    productId: '',
    customerName: '',
    customerEmail: '',
    rating: 5,
    title: '',
    comment: '',
    isVerifiedPurchase: false,
    purchaseDate: '',
    adminNotes: '',
    isApproved: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reviewsData, productsData] = await Promise.all([
        apiClient.admin.getReviews(),
        apiClient.admin.getProducts()
      ]);
      
      setReviews(reviewsData || []);
      setProducts(productsData || []);
      console.log('📝 Loaded reviews:', reviewsData?.length || 0);
    } catch (error) {
      console.error('Error fetching reviews data:', error);
      setMessage('Erreur lors du chargement des avis');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      customerName: '',
      customerEmail: '',
      rating: 5,
      title: '',
      comment: '',
      isVerifiedPurchase: false,
      purchaseDate: '',
      adminNotes: '',
      isApproved: true
    });
    setShowForm(false);
    setEditingReview(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.customerName || !formData.title || !formData.comment) {
      setMessage('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      if (editingReview) {
        await apiClient.admin.updateReview(editingReview.id, formData);
        setMessage('Avis mis à jour avec succès');
      } else {
        await apiClient.admin.createReview(formData);
        setMessage('Avis créé avec succès');
      }
      
      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Error saving review:', error);
      setMessage('Erreur lors de la sauvegarde de l\'avis');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setFormData({
      productId: review.product_id,
      customerName: review.customer_name,
      customerEmail: review.customer_email,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerifiedPurchase: review.is_verified_purchase,
      purchaseDate: review.purchase_date || '',
      adminNotes: review.admin_notes || '',
      isApproved: review.is_approved
    });
    setShowForm(true);
  };

  const handleDelete = async (reviewId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis?')) return;

    setLoading(true);
    try {
      await apiClient.admin.deleteReview(reviewId);
      setMessage('Avis supprimé avec succès');
      await fetchData();
    } catch (error) {
      console.error('Error deleting review:', error);
      setMessage('Erreur lors de la suppression de l\'avis');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const renderStars = (rating, interactive = false, onChange = null) => {
    return [...Array(5)].map((_, i) => (
      <button
        key={i}
        type={interactive ? "button" : undefined}
        onClick={interactive ? () => onChange?.(i + 1) : undefined}
        className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
        disabled={!interactive}
      >
        <Star
          className={`w-5 h-5 ${
            i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
        />
      </button>
    ));
  };

  const getProductInfo = (productId) => {
    const product = products.find(p => p.id === productId);
    return {
      name: product?.name || 'Produit inconnu',
      sku: product?.sku || 'N/A',
      image: Array.isArray(product?.images) && product.images.length > 0 
        ? product.images[0] 
        : 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=60'
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };

  const filteredReviews = reviews.filter(review => {
    const productInfo = getProductInfo(review.product_id);
    const matchesSearch = 
      review.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      productInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      productInfo.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'approved' && review.is_approved) ||
      (statusFilter === 'pending' && !review.is_approved) ||
      (statusFilter === 'verified' && review.is_verified_purchase);
    
    const matchesRating = ratingFilter === 'all' || review.rating === parseInt(ratingFilter);
    
    return matchesSearch && matchesStatus && matchesRating;
  });

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-text-primary">Gestion des Avis</h2>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Gestion des Avis</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter Avis
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('succès') || message.includes('success')
            ? 'bg-green-50 border border-green-200 text-green-600'
            : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {message}
        </div>
      )}

      {/* Add/Edit Review Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-text-primary">
              {editingReview ? 'Modifier l\'Avis' : 'Nouvel Avis Client'}
            </h3>
            <button
              onClick={resetForm}
              className="text-text-secondary hover:text-text-primary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Produit *
                </label>
                <select
                  name="productId"
                  value={formData.productId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Sélectionner un produit</option>
                  {products
                    .filter(p => p.is_active || p.id === formData.productId)
                    .map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Nom du Client *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  placeholder="Jean-Pierre Dubois"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email Client (optionnel)
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  placeholder="client@email.fr"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Note (étoiles) *
                </label>
                <div className="flex items-center gap-2">
                  {renderStars(formData.rating, true, (rating) => 
                    setFormData(prev => ({ ...prev, rating }))
                  )}
                  <span className="text-sm text-gray-600 ml-2">
                    {formData.rating} étoile{formData.rating > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Titre de l'Avis *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Excellent produit"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Commentaire *
                </label>
                <textarea
                  name="comment"
                  value={formData.comment}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Très bonne qualité, installation facile..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Date d'Achat (optionnel)
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Notes Admin (optionnel)
                </label>
                <input
                  type="text"
                  name="adminNotes"
                  value={formData.adminNotes}
                  onChange={handleChange}
                  placeholder="Notes internes..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center gap-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isVerifiedPurchase"
                      checked={formData.isVerifiedPurchase}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span className="text-sm text-text-secondary">Achat vérifié</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isApproved"
                      checked={formData.isApproved}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span className="text-sm text-text-secondary">Avis approuvé</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 text-text-secondary rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Sauvegarde...' : (editingReview ? 'Mettre à jour' : 'Créer l\'avis')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-light w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nom, produit, SKU..."
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Tous</option>
              <option value="approved">Approuvés</option>
              <option value="pending">En attente</option>
              <option value="verified">Achats vérifiés</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Note</label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Toutes</option>
              <option value="5">5 étoiles</option>
              <option value="4">4 étoiles</option>
              <option value="3">3 étoiles</option>
              <option value="2">2 étoiles</option>
              <option value="1">1 étoile</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <div className="text-sm text-text-secondary">
              {filteredReviews.length} avis trouvé{filteredReviews.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => {
          const productInfo = getProductInfo(review.product_id);
          
          return (
            <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <img
                    src={productInfo.image}
                    alt={productInfo.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-text-primary">{productInfo.name}</span>
                      <span className="text-sm text-gray-500">({productInfo.sku})</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-text-primary">{review.customer_name}</span>
                      {review.is_verified_purchase && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Achat vérifié
                        </span>
                      )}
                      {!review.is_approved && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                          En attente
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-600 ml-2">
                        {review.rating}/5 étoiles
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(review)}
                    className="text-blue-600 hover:text-blue-800 p-2 border border-blue-300 rounded-lg hover:bg-blue-50"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="text-red-600 hover:text-red-800 p-2 border border-red-300 rounded-lg hover:bg-red-50"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-text-primary mb-2">{review.title}</h4>
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {review.purchase_date ? 
                      `Acheté le ${formatDate(review.purchase_date)}` : 
                      `Créé le ${formatDate(review.created_at)}`
                    }
                  </span>
                </div>
                {review.customer_email && (
                  <div>
                    <span className="font-medium">Email:</span> {review.customer_email}
                  </div>
                )}
                {review.admin_notes && (
                  <div>
                    <span className="font-medium">Note admin:</span> {review.admin_notes}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredReviews.length === 0 && !loading && (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-secondary mb-2">
            {searchTerm || statusFilter !== 'all' || ratingFilter !== 'all' 
              ? 'Aucun avis trouvé' 
              : 'Aucun avis pour le moment'
            }
          </h3>
          <p className="text-text-light mb-6">
            {searchTerm || statusFilter !== 'all' || ratingFilter !== 'all'
              ? 'Essayez de modifier les critères de recherche.'
              : 'Les avis des clients apparaîtront ici. Vous pouvez ajouter des avis manuellement.'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && ratingFilter === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              Ajouter le premier avis
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ReviewsTab;
