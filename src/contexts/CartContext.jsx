import {readCart,addCartItem,changeQuantity} from '../domain/cart';
import {normalizeProduct} from '../domain/catalog';
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '../config/api';
import { supabase } from '../config/supabase';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Helpers
const pickPrimaryImage = (product) =>
  product?.images?.[0] || product?.image || '';

const computeUnitPrice = (product, variant) => {
  if (variant?.price != null) return Number(variant.price) || 0;
  const sale = product?.sale_price ?? product?.salePrice;
  if (typeof sale === 'number' && sale > 0) return sale;
  return Number(product?.price) || 0;
};

const makeLocalItemId = (productId, variantId) =>
  variantId ? `${productId}-${variantId}` : String(productId);

const CartProviderComponent = ({ children }) => {
  const [items, setItems] = useState(()=>{try{return readCart(localStorage);}catch{return [];}});
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addingItems, setAddingItems] = useState(new Set());
  const [initialized, setInitialized] = useState(false);
  const { user } = useAuth();
  const syncedAuthIdRef = useRef(null);

  // ✅ FIXED: Initialize cart when provider mounts
  useEffect(() => {
    const initializeCart = async () => {
      try {
        if (user) {
          await loadCartFromDatabase();
        } else {
          loadCartFromLocalStorage();
        }
      } catch (error) {
        console.error('Error initializing cart:', error);
        loadCartFromLocalStorage(); // Fallback to localStorage
      } finally {
        setInitialized(true);
      }
    };

    initializeCart();
  }, [user]);

  // Persist guest cart in localStorage
  useEffect(() => {
    if (!user && initialized) {
      try{localStorage.setItem('cart', JSON.stringify(items));}catch{}
    }
  }, [items, user, initialized]);

  const syncCartToDatabase = async (localItems) => {
    if (!user || !Array.isArray(localItems) || localItems.length === 0) return;
    
    try {
      console.log('🔄 Reconciling guest cart with database:', localItems.length, 'items');
      
      const remoteItems = await apiClient.cart.getItems();
      const remoteMap = new Map(
        remoteItems.map((item) => [makeLocalItemId(item.productId, item.variant?.id), item])
      );

      for (const item of localItems) {
        const key = makeLocalItemId(item.productId, item.variant?.id);
        const remoteItem = remoteMap.get(key);
        const targetQty = Math.max(1, Number(item.quantity) || 1);

        if (remoteItem) {
          const currentQty = Math.max(1, Number(remoteItem.quantity) || 1);
          if (currentQty !== targetQty) {
            await apiClient.cart.updateQuantity(remoteItem.id, targetQty);
          }
          remoteMap.delete(key);
        } else {
          await apiClient.cart.addItem(
            item.productId,
            item.variant?.id || null,
            targetQty
          );
        }
      }
      
      await loadCartFromDatabase();
      localStorage.removeItem('cart');
      console.log('✅ Guest cart reconciled with database');
    } catch (error) {
      console.error('Error syncing cart to database:', error);
    }
  };

  const loadCartFromDatabase = async () => {
    try {
      setLoading(true);
      console.log('🛒 Loading cart from database for user:', user?.email);
      
      const cartItems = await apiClient.cart.getItems();
      console.log('🛒 Loaded cart items from database:', cartItems.length, 'items');
      
      // Enrich cart items with actual product weights from database
      const enrichedItems = await Promise.all(
        cartItems.map(async (item) => {
          try {
            // Get current product data to ensure weight is up-to-date
            const { data: product, error } = await supabase
              .from('products')
              .select('weight_grams, name, images, price, sale_price')
              .eq('id', item.productId)
              .single();
            
            if (!error && product) {
              return {
                ...item,
                weightGrams: product.weight_grams || 500,
                weight_grams: product.weight_grams || 500,
                // Update price if it changed
                price: product.sale_price || product.price || item.price,
                // Update images if they changed
                image: Array.isArray(product.images) && product.images.length > 0 
                  ? product.images[0] 
                  : item.image
              };
            }
          } catch (err) {
            console.warn(`Could not enrich cart item ${item.id}:`, err);
          }
          return item;
        })
      );
      
      setItems(enrichedItems);
      console.log('🛒 Cart loaded with enriched data:', enrichedItems.map(i => ({
        name: i.name,
        quantity: i.quantity,
        weight: i.weightGrams
      })));
    } catch (error) {
      console.error('Error loading cart from database:', error);
      loadCartFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadCartFromLocalStorage=()=>{try{setItems(readCart(localStorage));}catch{setItems([]);}};

  // ✅ IMPROVED: Sync guest cart to database after login
  useEffect(() => {
    if (!user) {
      syncedAuthIdRef.current = null;
      return;
    }
    if (!initialized || loading) return;

    const authId = user.auth_id || user.id;
    if (!authId) return;
    if (syncedAuthIdRef.current === authId) return;

    const reconcile = async () => {
      const localCart = localStorage.getItem('cart');
      if (!localCart) {
        syncedAuthIdRef.current = authId;
        return;
      }

      try {
        const localItems = JSON.parse(localCart);
        if (Array.isArray(localItems) && localItems.length > 0) {
          console.log('🔄 User logged in, syncing guest cart:', localItems.length, 'items');
          await syncCartToDatabase(localItems);
        } else {
          localStorage.removeItem('cart');
        }
      } catch (error) {
        console.error('Error parsing local cart:', error);
        localStorage.removeItem('cart');
      } finally {
        syncedAuthIdRef.current = authId;
      }
    };

    reconcile();
  }, [user, initialized, loading]);

  const addItem = async (product, quantity = 1, variant = null) => {
    if(!Number.isInteger(quantity)||quantity<1)return;
    const safeQty=Math.min(quantity,99);
    const itemKey = makeLocalItemId(product.id, variant?.id);
    
    // Prevent multiple simultaneous additions of the same item
    if (addingItems.has(itemKey)) {
      console.log('⚠️ Item already being added, skipping duplicate request');
      return;
    }

    setAddingItems(prev => new Set(prev).add(itemKey));

    try {
      console.log('🛒 Adding item to cart:', {
        productId: product.id,
        productName: product.name,
        variantId: variant?.id,
        quantity: safeQty,
        sku: variant?.sku || product.sku
      });

      // Get fresh product data to ensure we have current weight and price
      let enrichedProduct = { ...product };
      
      try {
        const { data: freshProduct, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', product.id)
          .single();
        
        if (!error && freshProduct) {
          enrichedProduct = {
            ...product,...normalizeProduct(freshProduct),
            weight_grams: freshProduct.weight_grams || 500,
            weightGrams: freshProduct.weight_grams || 500,
            price: freshProduct.sale_price || freshProduct.price || product.price,
            images: freshProduct.images || product.images,
            name: freshProduct.name || product.name,
            sku: freshProduct.sku || product.sku
          };
          console.log('🔄 Enriched product with fresh data:', {
            name: enrichedProduct.name,
            weight: enrichedProduct.weight_grams,
            price: enrichedProduct.price
          });
        }
      } catch (err) {
        console.warn('Could not fetch fresh product data, using provided data:', err);
      }

      if(!enrichedProduct.inStock)throw new Error('Product is unavailable.');
      const existingQuantity=items.find(i=>i.productId===product.id)?.quantity||0;
      const max=enrichedProduct.manage_stock===false?99:Math.min(99,enrichedProduct.stockCount??0);
      if(existingQuantity+safeQty>max)throw new Error('Requested quantity exceeds available stock.');
      if (user) {
        // Database flow with improved duplicate handling
        try {
          console.log('💾 Adding to database cart for user:', user.email);
          await apiClient.cart.addItem(enrichedProduct.id, variant?.id || null, safeQty);
          await loadCartFromDatabase(); // Reload to get updated cart
          setIsOpen(true);
          console.log('✅ Successfully added to database cart');
        } catch (error) {
          console.error('❌ Error adding to database cart:', error);
          // Fallback to localStorage for immediate user feedback
          console.log('⚠️ Falling back to localStorage');
          addItemToLocalStorage(enrichedProduct, safeQty, variant);
          setIsOpen(true);
        }
      } else {
        // Guest flow with duplicate handling
        console.log('👤 Adding to guest cart (localStorage)');
        addItemToLocalStorage(enrichedProduct, safeQty, variant);
        setIsOpen(true);
      }
    } finally {
      // Always remove from adding set
      setAddingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  // ✅ FIXED: Proper duplicate handling in localStorage
  const addItemToLocalStorage=(product,quantity,variant)=>setItems(prev=>addCartItem(prev,product,quantity,variant));

  const updateQuantity = async (itemId, newQuantity) => {
    if(!Number.isInteger(newQuantity)||newQuantity<1)return;
    const item=items.find(i=>i.id===itemId);
    const qty=Math.min(99,newQuantity,item?.maxQuantity??99);
    
    console.log('🔄 Updating quantity:', { itemId, newQuantity: qty });

    if (user) {
      try {
        await apiClient.cart.updateQuantity(itemId, qty);
        await loadCartFromDatabase(); // Reload to get fresh data
        console.log('✅ Successfully updated quantity in database');
      } catch (error) {
        console.error('❌ Error updating quantity in database:', error);
        // Fallback to local update
        updateQuantityInLocalStorage(itemId, qty);
      }
    } else {
      updateQuantityInLocalStorage(itemId, qty);
    }
  };

  const updateQuantityInLocalStorage = (itemId, qty) => {
    setItems(prev =>
      changeQuantity(prev,itemId,qty)
    );
    console.log('🔄 Updated quantity in localStorage for item:', itemId);
  };

  const removeItem = async (itemId) => {
    console.log('🗑️ Removing item:', itemId);

    if (user) {
      try {
        await apiClient.cart.removeItem(itemId);
        await loadCartFromDatabase();
        console.log('✅ Successfully removed item from database');
      } catch (error) {
        console.error('❌ Error removing item from database:', error);
        removeItemFromLocalStorage(itemId);
      }
    } else {
      removeItemFromLocalStorage(itemId);
    }
  };

  const removeItemFromLocalStorage = (itemId) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    console.log('🗑️ Removed item from localStorage:', itemId);
  };

  const clearCart = async () => {
    console.log('🧹 Clearing entire cart');

    if (user) {
      try {
        await apiClient.cart.clearCart();
        setItems([]);
        console.log('✅ Successfully cleared database cart');
      } catch (error) {
        console.error('❌ Error clearing database cart:', error);
        setItems([]);
      }
    } else {
      setItems([]);
      localStorage.removeItem('cart');
      console.log('🧹 Cleared guest cart');
    }
  };

  const getItemCount = () =>
    items.reduce((total, item) => total + (Number(item.quantity) || 0), 0);

  const getSubtotal = () =>
    items.reduce((total, item) => total + (Number(item.price) * (Number(item.quantity) || 0)), 0);

  const getTax = () => null; // Stripe Tax determines tax at checkout.
  const getShipping = (subtotal = getSubtotal()) => (subtotal >= 100 ? 0 : 9.99);
  const getTotal = () => {
    const subtotal = getSubtotal();
    return subtotal + getTax(subtotal) + getShipping(subtotal);
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  // Check if specific item is being added (for UI loading states)
  const isAddingItem = (productId, variantId = null) => {
    const itemKey = makeLocalItemId(productId, variantId);
    return addingItems.has(itemKey);
  };

  const consumePurchasedItems=useCallback(async purchased=>{
    const quantities=new Map(purchased.map(i=>[i.id,i.quantity]));
    if(user){
      const remote=await apiClient.cart.getItems();
      for(const item of remote){const quantity=quantities.get(item.id);if(!quantity)continue;
        if(item.quantity>quantity)await apiClient.cart.updateQuantity(item.id,item.quantity-quantity);else await apiClient.cart.removeItem(item.id);
      }
    }
    setItems(prev=>prev.map(i=>({...i,quantity:i.quantity-(quantities.get(i.id)||0)})).filter(i=>i.quantity>0));
  },[user?.id]);

  // ✅ MEMOIZED VALUE: Prevent unnecessary re-renders
  const value = React.useMemo(() => ({
    items,
    isOpen,
    loading,
    addingItems,
    initialized,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getItemCount,
    getSubtotal,
    getTax,
    getShipping,
    getTotal,
    openCart,
    closeCart,
    isAddingItem,consumePurchasedItems,
  }), [
    items,
    isOpen,
    loading,
    addingItems,
    initialized,
    user // Include user in dependencies
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// ✅ FIXED: Export without React.memo to avoid context issues
export const CartProvider = CartProviderComponent;
