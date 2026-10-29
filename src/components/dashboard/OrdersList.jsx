import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {apiClient} from '../../config/api';
export default function OrdersList({admin=false}){
 const [orders,setOrders]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState('');
 const load=async()=>{setError('');try{setOrders(await (admin?apiClient.admin.getOrders():apiClient.orders.getAll()));}catch(e){setError(e.message);}finally{setLoading(false);}};
 useEffect(()=>{load();},[admin]);
 const update=async(e,order)=>{e.preventDefault();setBusy(order.id);setError('');try{const data=new FormData(e.currentTarget);await apiClient.admin.updateOrder(order.id,{status:data.get('status'),trackingNumber:data.get('trackingNumber'),carrierName:data.get('carrierName')});await load();}catch(e){setError(e.message);}finally{setBusy('');}};
 return <section><h2 className="text-2xl font-bold mb-6">{admin?'Comenzi':'Comenzile mele'}</h2>
 {error&&<p role="alert" className="text-red-700 mb-4">{error}</p>}
 {loading?<p>Se încarcă…</p>:!orders.length&&!error?<p>Nu există comenzi.</p>:<div className="space-y-4">{orders.map(o=><article key={o.id} className="border rounded-lg p-4">
 <div className="flex flex-wrap justify-between gap-3"><h3 className="font-semibold">{o.orderNumber}</h3><span>{Number(o.totalAmount).toFixed(2)} {o.currency}</span></div>
 <p>Stare: {o.status} · Plată: {o.paymentStatus}</p><p className="text-sm text-gray-500">{new Date(o.createdAt).toLocaleString()}</p>
 {admin?<><p className="mt-2">{o.customerEmail}</p><p>{o.shippingFirstName} {o.shippingLastName} · {o.shippingAddress}, {o.shippingCity}, {o.shippingPostalCode}, {o.shippingCountry}</p>
 <form onSubmit={e=>update(e,o)} className="mt-4 flex flex-wrap gap-3"><label>Stare<select name="status" defaultValue={o.status} className="block border p-2 rounded">{['pending','paid','packed','shipped','delivered','completed','canceled'].map(s=><option key={s}>{s}</option>)}</select></label><label>Curier<input name="carrierName" defaultValue={o.carrierName||''} className="block border p-2 rounded"/></label><label>AWB<input name="trackingNumber" defaultValue={o.trackingNumber||''} className="block border p-2 rounded"/></label><button disabled={busy===o.id} className="bg-primary text-white px-4 rounded">Salvează</button></form>
 <p className="text-sm mt-2">Plata este confirmată exclusiv de Stripe. Rambursările se gestionează separat în Stripe.</p></>:<Link to={`/order-success?order_id=${o.id}`} className="text-primary underline">Vezi confirmarea plății</Link>}
 </article>)}</div>}
 <p className="text-sm mt-4 text-gray-500">Sunt afișate cele mai recente 100 de comenzi.</p></section>;
}
