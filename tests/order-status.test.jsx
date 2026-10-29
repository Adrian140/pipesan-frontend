import React from 'react';
import {it,expect,vi,beforeEach} from 'vitest';
import {render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
const mocks=vi.hoisted(()=>({get:vi.fn(),consume:vi.fn(),user:{id:'account'}}));
vi.mock('../src/config/api',()=>({apiClient:{orders:{getById:mocks.get}}}));
vi.mock('../src/contexts/AuthContext',()=>({useAuth:()=>({user:mocks.user,loading:false})}));
vi.mock('../src/contexts/CartContext',()=>({useCart:()=>({consumePurchasedItems:mocks.consume})}));
import OrderSuccess from '../src/pages/OrderSuccess';
beforeEach(()=>{sessionStorage.clear();mocks.consume.mockReset();mocks.get.mockReset();});
const show=()=>render(<MemoryRouter initialEntries={['/order-success?order_id=order']}><OrderSuccess/></MemoryRouter>);
it('preserves the cart while payment confirmation is pending',async()=>{
 mocks.get.mockResolvedValue({orderNumber:'PS-1',paymentStatus:'pending'});show();
 expect(await screen.findByText(/Waiting for payment confirmation/)).toBeTruthy();expect(mocks.consume).not.toHaveBeenCalled();
});
it('consumes only the purchased snapshot once payment is confirmed',async()=>{
 const purchased=[{id:'p',quantity:2}];sessionStorage.setItem('pipesan-order-cart:order',JSON.stringify(purchased));
 mocks.get.mockResolvedValue({orderNumber:'PS-1',paymentStatus:'paid',totalAmount:12,currency:'EUR'});const view=show();
 await waitFor(()=>expect(mocks.consume).toHaveBeenCalledWith(purchased));view.unmount();show();
 expect(await screen.findByText('Payment confirmed')).toBeTruthy();expect(mocks.consume).toHaveBeenCalledTimes(1);
});
it('does not confirm a payment when the order cannot be read',async()=>{
 mocks.get.mockRejectedValue(new Error('Order unavailable'));show();expect((await screen.findByRole('alert')).textContent).toBe('Order unavailable');expect(mocks.consume).not.toHaveBeenCalled();
});
it('shows cancellation without clearing the cart',async()=>{
 mocks.get.mockResolvedValue({orderNumber:'PS-1',paymentStatus:'failed',status:'canceled'});show();expect(await screen.findByText('Payment was not completed.')).toBeTruthy();expect(mocks.consume).not.toHaveBeenCalled();
});
