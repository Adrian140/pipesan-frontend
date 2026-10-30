import React, {useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {useCart} from '../contexts/CartContext';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {apiClient} from '../config/api';
import {checkoutText,countryName} from '../translations/checkout';
import {useShippingCountry} from '../domain/shippingCountry';
import OrderEstimate from '../components/cart/OrderEstimate';
const FIELDS=['firstName','lastName','company','address','city','postalCode','phone'];
const OPTIONAL=['company','phone'];
export default function Checkout(){
 const {items}=useCart();const {user,loading}=useAuth();
 const {currentLanguage}=useLanguage();const t=checkoutText(currentLanguage);
 const [params]=useSearchParams();
 const [country,setCountry]=useShippingCountry();
 const [address,setAddress]=useState({firstName:'',lastName:'',company:'',address:'',city:'',postalCode:'',phone:''});
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const enabled=import.meta.env.VITE_CHECKOUT_ENABLED==='true';
 const submit=async e=>{
  e.preventDefault();if(busy)return;setBusy(true);setError('');
  try{
   const payload={items:items.map(i=>({productId:i.productId,quantity:i.quantity})),address:{...address,country},locale:currentLanguage};
   const fingerprint=JSON.stringify(payload);
   let saved;try{saved=JSON.parse(sessionStorage.getItem('pipesan-checkout')||'null');}catch{/* Invalid saved request is replaced. */}
   if(!saved || saved.fingerprint!==fingerprint){saved={requestId:crypto.randomUUID(),fingerprint};sessionStorage.setItem('pipesan-checkout',JSON.stringify(saved));}
   const response=await apiClient.orders.create({...payload,requestId:saved.requestId});
   const url=new URL(response.url);
   if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com')throw new Error(t.unexpected);
   sessionStorage.setItem(`pipesan-order-cart:${response.orderId}`,JSON.stringify(items.map(i=>({id:i.id,quantity:i.quantity}))));
   window.location.assign(url.href);
  }catch(e){setError(e.message);setBusy(false);}
 };
 return <section className="max-w-3xl mx-auto p-6 my-12 border rounded-xl">
  <h1 className="text-3xl font-bold mb-4">{t.title}</h1>
  {params.get('canceled')&&<p role="status" className="mb-4 p-3 rounded bg-amber-50 text-amber-800">{t.canceled}</p>}
  {!items.length?<p>{t.empty}</p>:<>
   <ul className="space-y-2 mb-6">{items.map(i=><li key={i.id}>{i.name} × {i.quantity}</li>)}</ul>
   <div className="mb-6"><OrderEstimate items={items} country={country} onCountryChange={setCountry} t={t} language={currentLanguage}/></div>
   {!enabled?<p role="status">{t.disabled} <a href="mailto:contact@pipesan.eu" className="text-primary underline">contact@pipesan.eu</a> {t.disabledEnd}</p>:loading?<p>{t.loadingAccount}</p>:!user?<p><Link to="/login" state={{from:'/checkout'}} className="text-primary underline">{t.signIn}</Link>. {t.signInEnd}</p>:<form onSubmit={submit} className="space-y-4">
    <p className="text-sm text-gray-600">{t.accountNote(user.email)}</p>
    <h2 className="text-xl font-semibold">{t.addressTitle}</h2>
    <p className="text-sm">{t.addressNote}</p>
    <div className="grid sm:grid-cols-2 gap-4">{FIELDS.map(name=><label key={name} className="block">{t.fields[name]}<input name={name} required={!OPTIONAL.includes(name)} maxLength={250} value={address[name]} onChange={e=>setAddress({...address,[name]:e.target.value})} className="block w-full border rounded p-3"/></label>)}
    <p className="block">{t.country}<span className="block w-full border rounded p-3 bg-gray-50">{countryName(country,currentLanguage)}</span></p></div>
    {error&&<p role="alert" className="text-red-700">{error}</p>}
    <p className="text-sm">{t.stripeNote}</p>
    <button disabled={busy} className="bg-primary text-white rounded px-6 py-3 disabled:opacity-50">{busy?t.preparing:t.pay}</button>
   </form>}
  </>}
  <Link className="block mt-6 text-primary underline" to="/products">{t.continueShopping}</Link>
 </section>;
}
