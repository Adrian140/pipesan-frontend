import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

function CartIcon() {
  const { getItemCount, openCart } = useCart();
  const itemCount = getItemCount();

  return (
    <button
      onClick={openCart}
      className="relative p-2 text-text-secondary hover:text-primary transition-colors"
      title="Shopping Cart"
    >
      <ShoppingCart className="w-6 h-6" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}

export default CartIcon;
