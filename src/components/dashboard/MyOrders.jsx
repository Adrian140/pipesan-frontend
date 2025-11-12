import React, { useState, useEffect } from 'react';
import { Package, Calendar, Star, MessageSquare, Eye, X, CheckCircle } from 'lucide-react';
import { useDashboardTranslation } from '../../hooks/useDashboardTranslation';
import { apiClient } from '../../config/api';
import { supabase } from '../../config/supabase';

function ReviewModal({ isOpen, onClose, product, order, onReviewSubmitted }) {
  const { dt } = useDashboardTranslation();
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({ rating: 5, title: '', comment: '' });
      setMessage('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await apiClient.reviews.create({
        productId: product.id,
        customerName: `${order.billing_first_name} ${order.billing_last_name}`,
        customerEmail: order.customer_email,
        rating: formData.rating,
        title: formData.title,
        comment: formData.comment,
        isVerifiedPurchase: true,
        purchaseDate: order.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
      });

      setMessage(dt('reviewSubmittedSuccess'));
      setTimeout(() => {
        onClose();
        onReviewSubmitted();
      }, 1500);
    } catch (error) {
      console.error('Error submitting review:', error);
      setMessage('Error submitting review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
          className={`w-6 h-6 ${
            i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
        />
      </button>
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-text-primary">{dt('writeReview')}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Product Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <img
                src={product.image || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=60'}
                alt={product.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div>
                <h4 className="font-medium text-text-primary">{product.name}</h4>
                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
              </div>
            </div>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.includes('successfully') 
                ? 'bg-green-50 border border-green-200 text-green-600'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              {message.includes('successfully') && <CheckCircle className="w-4 h-4 inline mr-2" />}
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                {dt('rating')} *
              </label>
              <div className="flex items-center gap-2">
                {renderStars(formData.rating, true, (rating) => 
                  setFormData(prev => ({ ...prev, rating }))
                )}
                <span className="text-sm text-gray-600 ml-2">
                  {formData.rating} {formData.rating > 1 ? dt('stars') : dt('star')}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {dt('reviewTitle')} *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder={dt('reviewTitlePlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {dt('yourReview')} *
              </label>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                required
                rows={4}
                placeholder={dt('reviewPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-text-secondary rounded-lg hover:bg-gray-50 transition-colors"
              >
                {dt('cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title.trim() || !formData.comment.trim()}
                className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? dt('submitting') : dt('submitReview')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function MyOrders() {
  const { dt } = useDashboardTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

useEffect(() => {
  const setupListener = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userProfile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userProfile) return;

    const channel = supabase
      .channel(`orders-updates-${userProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userProfile.id}`,
        },
        (payload) => {
          console.log('🔄 Order update for this user:', payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  setupListener();
}, []);



  const fetchOrders = async () => {
    try {
      const data = await apiClient.orders.getAll();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'delivered':
        return dt('delivered');
      case 'shipped':
        return dt('shipped');
      case 'processing':
        return dt('processing');
      case 'pending':
        return dt('pending');
      case 'cancelled':
        return dt('cancelled');
      default:
        return status;
    }
  };

  const canLeaveReview = (order) => {
    return order.status === 'delivered' || order.status === 'shipped' || order.payment_status === 'paid';
  };

  const handleWriteReview = (product, order) => {
    setSelectedProduct({
      id: product.product_id,
      name: product.name,
      sku: product.sku,
      image: product.image || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=60'
    });
    setSelectedOrder(order);
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = () => {
    setMessage(dt('reviewSubmittedSuccess'));
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-text-primary">{dt('myOrders')}</h2>
        <div className="text-sm text-text-secondary">
          Total: {orders.length} {dt('totalOrders')}
        </div>
      </div>

      {message && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-600">
          <CheckCircle className="w-4 h-4 inline mr-2" />
          {message}
        </div>
      )}

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <div className="flex items-center mb-4 md:mb-0">
                <Package className="w-6 h-6 text-primary mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">
                    {dt('orderNumber')} {order.order_number || order.id}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(order.created_at)}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  €{Number(order.total_amount || 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  {order.payment_status === 'paid' ? dt('paid') : dt('paymentPending')}
                </p>
              </div>
            </div>

            {/* Order Items */}
            {order.items && order.items.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-text-primary mb-3">{dt('orderItems')}:</h4>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={`${order.id}-${item.sku}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            (item.product?.images?.[0]) ||
                            (Array.isArray(item.images) && item.images[0]) ||
                            item.image ||
                            'https://via.placeholder.com/60?text=No+Image'
                          }
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium text-text-primary">{item.name}</p>
                          <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                          <p className="text-sm text-gray-600">{dt('quantity')}: {item.quantity}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-primary">
                          €{(Number(item.price || item.unit_price || 0) * item.quantity).toFixed(2)}
                        </span>
                        
                        {canLeaveReview(order) && (
                          <button
                            onClick={() => handleWriteReview({
                              product_id: item.product_id,
                              name: item.name,
                              sku: item.sku,
                              image: item.image
                            }, order)}
                            className="flex items-center gap-1 bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                            {dt('writeReview')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping Information */}
            {order.shipping_first_name && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="font-medium text-text-primary mb-2">{dt('shippingAddress')}:</h4>
                <div className="text-sm text-gray-600">
                  <p>{order.shipping_first_name} {order.shipping_last_name}</p>
                  <p>{order.shipping_address}</p>
                  <p>{order.shipping_city}, {order.shipping_postal_code}</p>
                  <p>{order.shipping_country}</p>
                </div>
              </div>
            )}

            {/* Tracking Information */}
            {order.tracking_number && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="font-medium text-text-primary mb-2">{dt('trackingInfo')}:</h4>
                <div className="text-sm text-gray-600">
                  <p>{dt('trackingNumber')}: {order.tracking_number}</p>
                  <p>{dt('shippingMethod')}: {order.shipping_method || 'Standard'}</p>
                </div>
              </div>
            )}
            {/* Cancellation Reason */}
{order.status === 'canceled' && order.admin_comment && (
  <div className="border-t border-gray-200 pt-4 mt-4">
    <h4 className="font-medium text-text-primary mb-2">{dt('cancellationReason') || 'Motiv anulare'}:</h4>
    <p className="text-sm text-gray-700 whitespace-pre-line">{order.admin_comment}</p>
  </div>
)}


{order.tracking_url && (
  <div className="border-t border-gray-200 pt-4 mt-4">
    <h4 className="font-medium text-text-primary mb-2">{dt('trackingLink') || 'Link tracking'}:</h4>
    <a
      href={order.tracking_url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline break-all"
    >
      {order.tracking_url}
    </a>
  </div>
)}


{(order.invoice_pdf_url || order.invoice_url) && (
  <div className="border-t border-gray-200 pt-4 mt-4">
    <h4 className="font-medium text-text-primary mb-2">{dt('invoice')}:</h4>
    <a
      href={order.invoice_pdf_url || order.invoice_url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
    >
      {dt('viewInvoice') || 'Vezi factura'}
    </a>
  </div>
)}

          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-secondary mb-2">
            {dt('noOrdersYet')}
          </h3>
          <p className="text-text-light mb-6">
            {dt('ordersWillAppear')}
          </p>
          <a
            href="/products"
            className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            {dt('browseProducts')}
          </a>
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        product={selectedProduct}
        order={selectedOrder}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
}

export default MyOrders;
