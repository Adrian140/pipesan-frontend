vi.mock('../src/contexts/LanguageContext',()=>({useLanguage:()=>({currentLanguage:'en'})}));
vi.mock('../src/contexts/AuthContext',()=>({useAuth:()=>({user:null,loading:false})}));
import React, { StrictMode } from 'react';
import { describe,it,expect,vi } from 'vitest';
import { render,screen,fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { normalizeProduct,filterProducts,safeUrl } from '../src/domain/catalog';
import { readCart,addCartItem,changeQuantity } from '../src/domain/cart';
import { CartProvider,useCart } from '../src/contexts/CartContext';
import Checkout from '../src/pages/Checkout';
import OrderSuccess from '../src/pages/OrderSuccess';
const row={id:'uuid-1',name:'Valve',sku:null,price:'10.50',sale_price:'8.25',stock_quantity:3,is_active:true,is_draft:false,categories:{name:'Vannes',slug:'vannes'}};
describe('real database catalog',()=>{
 it('normalizes prices, null fields and stock',()=>{const p=normalizeProduct(row);expect(p.price).toBe(10.5);expect(p.salePrice).toBe(8.25);expect(p.sku).toBe('');expect(p.inStock).toBe(true);});
 it('does not make unavailable or invalid-priced products purchasable',()=>{for(const extra of [{stock_quantity:0},{in_stock:false},{is_draft:true},{is_active:false},{price:'bad'},{stock_status:'out_of_stock'}])expect(normalizeProduct({...row,...extra}).inStock).toBe(false);});
 it('rejects executable URLs',()=>{expect(safeUrl('javascript:alert(1)')).toBe('');expect(normalizeProduct({...row,amazon_links:{DE:'javascript:alert(1)'}}).amazonLinks).toEqual({});});
 it('filters category slugs and effective sale price, handles null SKU',()=>{expect(filterProducts([normalizeProduct(row)],{category:'vannes',search:'valve',priceRange:[8,9]})).toHaveLength(1);expect(filterProducts([normalizeProduct(row)],{category:'missing'})).toEqual([]);});
 it('sorts UUID products by creation date',()=>{const a=normalizeProduct({...row,created_at:'2025-01-01'}),b=normalizeProduct({...row,id:'uuid-2',created_at:'2026-01-01'});expect(filterProducts([a,b],{sortBy:'newest'})[0].id).toBe('uuid-2');});
});
describe('persistent cart',()=>{
 it('survives invalid persisted JSON and wrong shapes',()=>{for(const value of ['bad','null','{}','[null,{"id":"x","price":-1}]'])expect(readCart({getItem:()=>value})).toEqual([]);});
 it('rejects invalid quantities and caps repeat additions to stock',()=>{const p=normalizeProduct(row);expect(addCartItem([],p,-1)).toEqual([]);expect(addCartItem([],p,1.5)).toEqual([]);const items=addCartItem(addCartItem([],p,2),p,2);expect(items[0].quantity).toBe(3);expect(changeQuantity(items,p.id,NaN)).toEqual(items);expect(changeQuantity(items,p.id,999)[0].quantity).toBe(3);});
 it('does not erase saved cart under StrictMode or reload',()=>{const item=addCartItem([],normalizeProduct(row),2)[0];localStorage.setItem('cart',JSON.stringify([item]));function Probe(){const {items}=useCart();return <p>{items.length}:{items[0]?.quantity}</p>;}const r=render(<StrictMode><CartProvider><Probe/></CartProvider></StrictMode>);expect(screen.getByText('1:2')).toBeTruthy();r.unmount();render(<CartProvider><Probe/></CartProvider>);expect(screen.getByText('1:2')).toBeTruthy();});
 it('checkout never clears the cart or confirms an unprocessed payment',()=>{localStorage.setItem('cart',JSON.stringify(addCartItem([],normalizeProduct(row),1)));render(<MemoryRouter><CartProvider><Checkout/></CartProvider></MemoryRouter>);expect(screen.getByRole('status').textContent).toContain('No order has been placed');expect(JSON.parse(localStorage.getItem('cart'))).toHaveLength(1);expect(screen.queryByRole('button',{name:'Place Order'})).toBeNull();});
 it('cannot confirm an order by visiting success URL',()=>{render(<MemoryRouter><CartProvider><OrderSuccess/></CartProvider></MemoryRouter>);expect(screen.queryByText('Order Confirmed!')).toBeNull();});
});

it('normalizes database Amazon country keys for the product card',()=>{
 const product=normalizeProduct({id:'p',price:10,stock_quantity:2,amazon_links:{de:'https://www.amazon.de/dp/example'}});
 expect(product.amazonLinks.DE).toBe('https://www.amazon.de/dp/example');
});
it('does not allow purchase when the database price is missing',()=>{
 expect(normalizeProduct({id:'p',price:null,stock_quantity:2}).inStock).toBe(false);
});

it('keeps cart quantities within the server checkout limit',()=>{
 const p=normalizeProduct({...row,stock_quantity:1000});const items=addCartItem([],p,1000);expect(items[0].quantity).toBe(99);expect(changeQuantity([{...items[0],maxQuantity:1000}],p.id,1000)[0].quantity).toBe(99);
});
