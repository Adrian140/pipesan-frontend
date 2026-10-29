import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {useCart} from '../contexts/CartContext';
import {useAuth} from '../contexts/AuthContext';
import {apiClient} from '../config/api';
const countries={FR:'France',DE:'Germany',IT:'Italy',ES:'Spain',NL:'Netherlands',BE:'Belgium',PL:'Poland',RO:'Romania'};
export default function Checkout(){
 const {items}=useCart();const {user,loading}=useAuth();
 const [address,setAddress]=useState({firstName:'',lastName:'',company:'',address:'',city:'',postalCode:'',country:'FR',phone:''});
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const enabled=import.meta.env.VITE_CHECKOUT_ENABLED==='true';
 const submit=async e=>{
  e.preventDefault();if(busy)return;setBusy(true);setError('');
  try{
   const payload={items:items.map(i=>({productId:i.productId,quantity:i.quantity})),address};
   const fingerprint=JSON.stringify(payload);
   let saved;try{saved=JSON.parse(sessionStorage.getItem('pipesan-checkout')||'null');}catch{/* Invalid saved request is replaced. */}
   if(!saved || saved.fingerprint!==fingerprint){saved={requestId:crypto.randomUUID(),fingerprint};sessionStorage.setItem('pipesan-checkout',JSON.stringify(saved));}
   const response=await apiClient.orders.create({...payload,requestId:saved.requestId});
   const url=new URL(response.url);
   if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com')throw new Error('Unexpected payment destination. Please contact support.');
   sessionStorage.setItem(`pipesan-order-cart:${response.orderId}`,JSON.stringify(items.map(i=>({id:i.id,quantity:i.quantity}))));
   window.location.assign(url.href);
  }catch(e){setError(e.message);setBusy(false);}
 };
 return <section className="max-w-3xl mx-auto p-6 my-12 border rounded-xl">
  <h1 className="text-3xl font-bold mb-4">Checkout</h1>
  {!items.length?<p>Your cart is empty.</p>:<>
   <ul className="space-y-2 mb-6">{items.map(i=><li key={i.id}>{i.name} × {i.quantity}</li>)}</ul>
   <p className="mb-4">Prices exclude VAT. Delivery is €9.99, or free from €100 before VAT. Stripe calculates the applicable tax before you confirm payment.</p>
   {!enabled?<p role="status">Online payment is temporarily unavailable. Your cart has been saved. No order has been placed and no payment has been taken. Contact <a href="mailto:contact@pipesan.eu" className="text-primary underline">contact@pipesan.eu</a> for assistance.</p>:loading?<p>Loading account…</p>:!user?<p><Link to="/login" state={{from:'/checkout'}} className="text-primary underline">Sign in to pay securely</Link>. Your cart is saved.</p>:<form onSubmit={submit} className="space-y-4">
    <h2 className="text-xl font-semibold">Billing and delivery address</h2>
    <p className="text-sm">The same address will be used for billing and delivery. Check it before continuing.</p>
    <div className="grid sm:grid-cols-2 gap-4">{Object.entries({firstName:'First name',lastName:'Last name',company:'Company (optional)',address:'Street address',city:'City',postalCode:'Postal code',phone:'Phone (optional)'}).map(([name,label])=><label key={name} className="block">{label}<input name={name} required={!['company','phone'].includes(name)} maxLength={250} value={address[name]} onChange={e=>setAddress({...address,[name]:e.target.value})} className="block w-full border rounded p-3"/></label>)}
    <label>Country<select className="block w-full border rounded p-3" value={address.country} onChange={e=>setAddress({...address,country:e.target.value})}>{Object.entries(countries).map(([code,name])=><option key={code} value={code}>{name}</option>)}</select></label></div>
    {error&&<p role="alert" className="text-red-700">{error}</p>}
    <p className="text-sm">You will review the final total and enter payment details on Stripe. Continuing creates a pending order and reserves available stock.</p>
    <button disabled={busy} className="bg-primary text-white rounded px-6 py-3 disabled:opacity-50">{busy?'Preparing payment…':'Continue to Stripe'}</button>
   </form>}
  </>}
  <Link className="block mt-6 text-primary underline" to="/products">Continue shopping</Link>
 </section>;
}
