import React, {useEffect, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {Lock} from 'lucide-react';
import {useCart} from '../contexts/CartContext';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {apiClient} from '../config/api';
import {checkoutText,countryName} from '../translations/checkout';
import {useShippingCountry} from '../domain/shippingCountry';
import OrderEstimate from '../components/cart/OrderEstimate';
import {SHIPPING_COUNTRIES} from '../data/chronopostRates';
const FIELDS=['firstName','lastName','company','address','city','postalCode','phone'];
const BILLING_FIELDS=['firstName','lastName','company','address','city','postalCode'];
const OPTIONAL=['company'];
const WIDE=['company','address'];
const EMPTY={firstName:'',lastName:'',company:'',address:'',city:'',postalCode:'',phone:''};
const EMPTY_BILLING={firstName:'',lastName:'',company:'',address:'',city:'',postalCode:'',country:'FR'};
const isServed=code=>SHIPPING_COUNTRIES.some(c=>c.code===code);
const fromSaved=a=>({firstName:a.first_name||'',lastName:a.last_name||'',company:a.company||'',address:a.address||'',city:a.city||'',postalCode:a.postal_code||'',phone:a.phone||''});
const AUTOCOMPLETE={firstName:'given-name',lastName:'family-name',company:'organization',address:'street-address',city:'address-level2',postalCode:'postal-code',phone:'tel'};
const inputClass='mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-primary focus:ring-primary';
function Field({name,label,value,onChange,prefix,required}){
 return <label className={`block text-sm font-medium text-text-primary ${WIDE.includes(name)?'sm:col-span-2':''}`}>{label}
  <input name={`${prefix}${name}`} type={name==='phone'?'tel':'text'} autoComplete={AUTOCOMPLETE[name]} required={required} maxLength={250} value={value} onChange={e=>onChange(e.target.value)} className={inputClass}/>
 </label>;
}
function Section({step,title,children}){
 return <section className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6">
  <h2 className="flex items-center gap-3 text-lg font-semibold text-text-primary mb-4"><span className="w-7 h-7 rounded-full bg-graphite-900 text-white text-sm flex items-center justify-center">{step}</span>{title}</h2>
  {children}
 </section>;
}
export default function Checkout(){
 const {items}=useCart();const {user,loading}=useAuth();
 const {currentLanguage}=useLanguage();const t=checkoutText(currentLanguage);
 const [params]=useSearchParams();
 const [country,setCountry]=useShippingCountry();
 const [address,setAddress]=useState(EMPTY);
 const [saved,setSaved]=useState([]),[savedId,setSavedId]=useState('');
 const [email,setEmail]=useState(''),[createAccount,setCreateAccount]=useState(true);
 const [billingDifferent,setBillingDifferent]=useState(false),[billing,setBilling]=useState(EMPTY_BILLING);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const enabled=import.meta.env.VITE_CHECKOUT_ENABLED==='true';
 const countries=SHIPPING_COUNTRIES.map(c=>({code:c.code,name:countryName(c.code,currentLanguage)})).sort((a,b)=>a.name.localeCompare(b.name,currentLanguage));
 const chooseSaved=a=>{setSavedId(a?a.id:'');setAddress(a?fromSaved(a):EMPTY);if(a&&isServed(a.country))setCountry(a.country);};
 useEffect(()=>{if(user?.email)setEmail(e=>e||user.email);},[user?.email]);
 // Signed-in buyers start from their default (or newest) saved address.
 useEffect(()=>{
  if(!user){setSaved([]);return undefined;}
  let current=true;
  apiClient.addresses.getAll().then(list=>{
   if(!current)return;const usable=(list||[]).filter(a=>a.type!=='billing');setSaved(usable);
   const first=usable.find(a=>a.is_default&&isServed(a.country))||usable.find(a=>isServed(a.country));
   if(first)chooseSaved(first);
  }).catch(()=>{});
  return()=>{current=false;};
 },[user?.id]);
 const submit=async e=>{
  e.preventDefault();if(busy)return;setBusy(true);setError('');
  try{
   const payload={items:items.map(i=>({productId:i.productId,quantity:i.quantity})),address:{...address,country,...(billingDifferent?{billing}:{})},locale:currentLanguage,email:email.trim(),...(user?{}:{createAccount})};
   const fingerprint=JSON.stringify(payload);
   let stored;try{stored=JSON.parse(sessionStorage.getItem('pipesan-checkout')||'null');}catch{/* Invalid saved request is replaced. */}
   if(!stored || stored.fingerprint!==fingerprint){stored={requestId:crypto.randomUUID(),fingerprint};sessionStorage.setItem('pipesan-checkout',JSON.stringify(stored));}
   const response=await apiClient.orders.create({...payload,requestId:stored.requestId});
   const url=new URL(response.url);
   if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com')throw new Error(t.unexpected);
   sessionStorage.setItem(`pipesan-order-cart:${response.orderId}`,JSON.stringify(items.map(i=>({id:i.id,quantity:i.quantity}))));
   window.location.assign(url.href);
  }catch(e){setError(e.message);setBusy(false);}
 };
 const summary=<aside className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 lg:sticky lg:top-24">
  <h2 className="text-lg font-semibold text-text-primary mb-4">{t.summaryTitle}</h2>
  <ul className="divide-y divide-gray-100 mb-4">{items.map(i=><li key={i.id} className="flex gap-3 py-3">
   <img src={i.image||'/product-placeholder.svg'} alt="" className="w-14 h-14 rounded-lg object-contain border border-gray-100 bg-white"/>
   <div className="flex-1 min-w-0"><p className="text-sm text-text-primary line-clamp-2">{i.name}</p><p className="text-xs text-gray-500 mt-1">{t.qty(i.quantity)}</p></div>
   <p className="text-sm font-medium whitespace-nowrap">€{(Number(i.price)*i.quantity).toFixed(2)}</p>
  </li>)}</ul>
  <OrderEstimate items={items} country={country} onCountryChange={setCountry} t={t} language={currentLanguage} showCountry={false}/>
 </aside>;
 return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
  <h1 className="text-3xl font-bold mb-6">{t.title}</h1>
  {params.get('canceled')&&<p role="status" className="mb-4 p-3 rounded-lg bg-amber-50 text-amber-800">{t.canceled}</p>}
  {!items.length?<p>{t.empty} <Link className="text-primary underline" to="/products">{t.continueShopping}</Link></p>:
  <div className="grid lg:grid-cols-12 gap-6 items-start">
   <div className="lg:col-span-7 order-2 lg:order-1">
    {!enabled?<p role="status" className="p-4 border rounded-xl bg-white">{t.disabled} <a href="mailto:contact@pipesan.eu" className="text-primary underline">contact@pipesan.eu</a> {t.disabledEnd}</p>:loading?<p>{t.loadingAccount}</p>:
    <form onSubmit={submit} className="space-y-5">
     <Section step={1} title={t.contactTitle}>
      {user?<p className="text-sm text-gray-600 mb-3">{t.accountNote(user.email)}</p>:<p className="text-sm mb-3">{t.haveAccount} <Link to="/login" state={{from:'/checkout'}} className="text-primary underline">{t.signInLink}</Link></p>}
      <label className="block text-sm font-medium text-text-primary">{t.email}<input type="email" name="email" required maxLength={254} autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className={inputClass}/></label>
      <p className="text-xs text-gray-500 mt-2">{t.guestNote(email.trim())}</p>
      {!user&&<label className="flex gap-2 items-start text-sm mt-3"><input type="checkbox" checked={createAccount} onChange={e=>setCreateAccount(e.target.checked)} className="mt-1"/><span>{t.createAccount}</span></label>}
     </Section>
     <Section step={2} title={t.deliveryTitle}>
      {saved.length>0&&<fieldset className="space-y-2 mb-5"><legend className="text-sm font-medium mb-2">{t.savedAddresses}</legend>
       {saved.map(a=><label key={a.id} className={`flex gap-3 p-3 border rounded-lg text-sm ${savedId===a.id?'border-primary bg-amber-50/40':'border-gray-200'} ${isServed(a.country)?'cursor-pointer':'opacity-50'}`}><input type="radio" name="saved-address" checked={savedId===a.id} disabled={!isServed(a.country)} onChange={()=>chooseSaved(a)}/><span>{[a.label,`${a.first_name} ${a.last_name}`,a.address,`${a.postal_code} ${a.city}`,countryName(a.country,currentLanguage)].filter(Boolean).join(' · ')}{!isServed(a.country)&&<span className="block text-xs">{t.notServed}</span>}</span></label>)}
       <label className={`flex gap-3 p-3 border rounded-lg text-sm cursor-pointer ${savedId===''?'border-primary bg-amber-50/40':'border-gray-200'}`}><input type="radio" name="saved-address" checked={savedId===''} onChange={()=>chooseSaved(null)}/><span>{t.newAddress}</span></label>
      </fieldset>}
      <div className="grid sm:grid-cols-2 gap-4">
       {FIELDS.map(name=><Field key={name} name={name} prefix="" label={t.fields[name]} value={address[name]} required={!OPTIONAL.includes(name)} onChange={v=>setAddress(a=>({...a,[name]:v}))}/>)}
       <label className="block text-sm font-medium text-text-primary">{t.country}<select value={country} onChange={e=>setCountry(e.target.value)} className={inputClass}>{countries.map(c=><option key={c.code} value={c.code}>{c.name}</option>)}</select></label>
      </div>
     </Section>
     <Section step={3} title={t.billingTitle}>
      <label className="flex gap-2 items-start text-sm"><input type="checkbox" checked={billingDifferent} onChange={e=>setBillingDifferent(e.target.checked)} className="mt-1"/><span>{t.billingDifferent}</span></label>
      {billingDifferent?<div className="grid sm:grid-cols-2 gap-4 mt-4">
       {BILLING_FIELDS.map(name=><Field key={name} name={name} prefix="billing-" label={t.fields[name]} value={billing[name]} required={!OPTIONAL.includes(name)} onChange={v=>setBilling(b=>({...b,[name]:v}))}/>)}
       <label className="block text-sm font-medium text-text-primary">{t.country}<select name="billing-country" value={billing.country} onChange={e=>setBilling(b=>({...b,country:e.target.value}))} className={inputClass}>{countries.map(c=><option key={c.code} value={c.code}>{c.name}</option>)}</select></label>
      </div>:<p className="text-xs text-gray-500 mt-2">{t.billingSame}</p>}
     </Section>
     {error&&<p role="alert" className="p-3 rounded-lg bg-red-50 text-red-700">{error}</p>}
     <div className="space-y-3">
      <button disabled={busy} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white rounded-lg px-8 py-3 font-semibold disabled:opacity-50"><Lock className="w-4 h-4"/>{busy?t.preparing:t.pay}</button>
      <p className="text-xs text-gray-500">{t.stripeNote} {t.secure}.</p>
     </div>
    </form>}
   </div>
   <div className="lg:col-span-5 order-1 lg:order-2">{summary}</div>
  </div>}
 </div>;
}
