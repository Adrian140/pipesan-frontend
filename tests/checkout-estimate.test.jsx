vi.mock('../src/contexts/LanguageContext',()=>({useLanguage:()=>({currentLanguage:'fr'})}));
vi.mock('../src/config/api',()=>({apiClient:{shippingRates:{quoteCheckout:vi.fn(async(items,country)=>({weightGrams:600,shippingCost:country==='DE'?10.15:8.83}))}}}));
import React from 'react';
import { it,expect,vi } from 'vitest';
import { render,screen,fireEvent,waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ShoppingCart from '../src/components/cart/ShoppingCart';
const items=[{id:'a',productId:'a',name:'Bouchon',sku:'X',price:3.82,quantity:5}];
it('shows the cart in French with shipping and the VAT included for the chosen country',async()=>{localStorage.clear();render(<MemoryRouter><ShoppingCart isOpen items={items} onClose={()=>{}} onUpdateQuantity={()=>{}} onRemoveItem={()=>{}}/></MemoryRouter>);expect(screen.getByText('Panier')).toBeTruthy();await waitFor(()=>expect(screen.getByTestId('estimate-shipping').textContent).toBe('€8.83'));expect(screen.getByTestId('estimate-vat').textContent).toBe('€4.65');expect(screen.getByTestId('estimate-total').textContent).toBe('€27.93');fireEvent.change(screen.getByLabelText('Livraison en'),{target:{value:'DE'}});await waitFor(()=>expect(screen.getByTestId('estimate-shipping').textContent).toBe('€10.15'));expect(screen.getByTestId('estimate-vat').textContent).toBe('€4.67');expect(localStorage.getItem('pipesan-ship-country')).toBe('DE');});
