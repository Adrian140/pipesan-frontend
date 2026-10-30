import React,{useEffect,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {apiClient} from '../config/api';
import {useAuth} from '../contexts/AuthContext';
import {useCart} from '../contexts/CartContext';
import {useLanguage} from '../contexts/LanguageContext';
import {checkoutText} from '../translations/checkout';
const consume=async(id,consumePurchasedItems)=>{
 const key=`pipesan-order-cart:${id}`;
 try{const purchased=JSON.parse(sessionStorage.getItem(key)||'null');if(purchased){await consumePurchasedItems(purchased);sessionStorage.removeItem(key);sessionStorage.removeItem('pipesan-checkout');}}catch{/* Do not empty an unrelated cart if storage is unavailable. */}
};
export default function OrderSuccess(){
 const [params]=useSearchParams();const id=params.get('order_id');const {user,loading}=useAuth();const {consumePurchasedItems}=useCart();
 const {currentLanguage}=useLanguage();const t=checkoutText(currentLanguage);
 const [order,setOrder]=useState(null),[error,setError]=useState('');
 // Guests cannot read the order; Stripe only redirects here after a completed card payment.
 const guestReturn=!loading&&!user&&!!id&&!!sessionStorage.getItem(`pipesan-order-cart:${id}`);
 useEffect(()=>{if(guestReturn)consume(id,consumePurchasedItems);},[guestReturn,id,consumePurchasedItems]);
 useEffect(()=>{
  setOrder(null);setError('');if(!id||!user)return;let active=true,timer,attempts=0;
  const poll=async()=>{try{
   const record=await apiClient.orders.getById(id);if(!active)return;setOrder(record);
   if(record?.paymentStatus==='paid')await consume(id,consumePurchasedItems);
   else if(record?.paymentStatus==='pending'&&++attempts<10)timer=setTimeout(poll,2000);
  }catch(e){if(active)setError(e.message);}};poll();return()=>{active=false;clearTimeout(timer);};
 },[id,user,consumePurchasedItems]);
 const amount=order?`${Number(order.totalAmount).toFixed(2)} ${order.currency}`:'';
 return <section className="max-w-2xl mx-auto p-12 text-center">
  <h1 className="text-2xl font-bold mb-4">{order?.paymentStatus==='paid'?t.paidTitle:t.statusTitle}</h1>
  {!id?<p>{t.noOrder}</p>:loading?<p>{t.loadingAccount}</p>:!user?(guestReturn?<p>{t.guestThanks}</p>:<p>{t.noOrder} <Link className="text-primary underline" to="/login" state={{from:`/order-success?order_id=${encodeURIComponent(id)}`}}>{t.signInLink}</Link></p>):error?<p role="alert">{error}</p>:!order?<p>{t.checking}</p>:<><p>{t.orderLabel(order.orderNumber)}</p><p className="mt-3">{order.paymentStatus==='paid'?t.paidText(amount):order.paymentStatus==='failed'||order.status==='canceled'?t.notPaid:t.waiting}</p></>}
  <Link className="block mt-6 text-primary" to="/products">{t.backToProducts}</Link>
 </section>;
}
