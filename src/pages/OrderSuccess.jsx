import React,{useEffect,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {apiClient} from '../config/api';
import {useAuth} from '../contexts/AuthContext';
import {useCart} from '../contexts/CartContext';
export default function OrderSuccess(){
 const [params]=useSearchParams();const id=params.get('order_id');const {user,loading}=useAuth();const {consumePurchasedItems}=useCart();
 const [order,setOrder]=useState(null),[error,setError]=useState('');
 useEffect(()=>{
  setOrder(null);setError('');if(!id||!user)return;let active=true,timer,attempts=0;
  const poll=async()=>{try{
   const record=await apiClient.orders.getById(id);if(!active)return;setOrder(record);
   if(record?.paymentStatus==='paid'){
    const key=`pipesan-order-cart:${id}`;
    try{const purchased=JSON.parse(sessionStorage.getItem(key)||'null');if(purchased){await consumePurchasedItems(purchased);sessionStorage.removeItem(key);sessionStorage.removeItem('pipesan-checkout');}}catch{/* Do not empty an unrelated cart if storage is unavailable. */}
   }else if(record?.paymentStatus==='pending'&&++attempts<10)timer=setTimeout(poll,2000);
  }catch(e){if(active)setError(e.message);}};poll();return()=>{active=false;clearTimeout(timer);};
 },[id,user,consumePurchasedItems]);
 return <section className="max-w-2xl mx-auto p-12 text-center">
  <h1 className="text-2xl font-bold mb-4">{order?.paymentStatus==='paid'?'Payment confirmed':'Order status'}</h1>
  {!id?<p>Order status unavailable. This page does not confirm an order or payment.</p>:loading?<p>Loading account…</p>:!user?<Link to="/login" state={{from:`/order-success?order_id=${encodeURIComponent(id)}`}}>Sign in to view your order</Link>:error?<p role="alert">{error}</p>:!order?<p>Checking your order…</p>:<><p>Order {order.orderNumber}</p><p className="mt-3">{order.paymentStatus==='paid'?`Payment received: ${Number(order.totalAmount).toFixed(2)} ${order.currency}.`:order.paymentStatus==='failed'||order.status==='canceled'?'Payment was not completed.':'Waiting for payment confirmation. You can return to this page later; do not pay again while confirmation is pending.'}</p></>}
  <Link className="block mt-6 text-primary" to="/products">Back to products</Link>
 </section>;
}
