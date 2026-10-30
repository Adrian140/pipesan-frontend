import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

function CartIcon() {
  const { getItemCount, openCart } = useCart();
  const itemCount = getItemCount();

  return (
    <button
      onClick={openCart}
      className="relative p-2 text-text-primary hover:text-primary transition-colors"
      title="Shopping Cart"
    >
      <ShoppingCart className="w-6 h-6" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-brass text-graphite-950 text-[11px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}

export default CartIcon;
