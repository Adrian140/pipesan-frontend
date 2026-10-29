export const allowedCountries=['FR','DE','IT','ES','NL','BE','PL','RO'];
export function formEncode(value,prefix='',out=new URLSearchParams()) {
  for(const [key,item] of Object.entries(value)){
    const name=prefix?`${prefix}[${key}]`:key;
    if(item==null)continue;
    if(typeof item==='object')formEncode(item,name,out);else out.append(name,String(item));
  }
  return out;
}
export function stripeSessionPayload({checkout,order},customer,origin) {
  return {
    mode:'payment',customer,client_reference_id:order.id,
    payment_method_types:['card'],automatic_tax:{enabled:true},billing_address_collection:'required',
    customer_update:{address:'auto',name:'auto'},tax_id_collection:{enabled:true},
    line_items:checkout.items.map(item=>({quantity:item.quantity,price_data:{currency:'eur',unit_amount:Math.round(item.unitPrice*100),tax_behavior:'exclusive',product_data:{name:item.name.slice(0,250),metadata:{sku:item.sku}}}})),
    shipping_options:[{shipping_rate_data:{display_name:'Standard delivery',type:'fixed_amount',fixed_amount:{amount:Math.round(order.shipping_amount*100),currency:'eur'},tax_behavior:'exclusive',tax_code:'txcd_92010001'}}],
    metadata:{pipesan_order_id:order.id,pipesan_checkout_id:checkout.id},
    payment_intent_data:{metadata:{pipesan_order_id:order.id}},
    success_url:`${origin}/order-success?order_id=${encodeURIComponent(order.id)}`,
    cancel_url:`${origin}/checkout?canceled=1`,
  };
}
export function customerPayload(order) {
 const name=`${order.shipping_first_name} ${order.shipping_last_name}`;
 const address={line1:order.shipping_address,city:order.shipping_city,postal_code:order.shipping_postal_code,country:order.shipping_country};
 return {email:order.customer_email,name,address,shipping:{name,address},metadata:{pipesan_order_id:order.id}};
}
export async function verifyStripeSignature(raw,header,secret,now=Date.now()) {
 if(!header||!secret)return false;
 const parts=header.split(',').map(x=>x.trim().split('='));const timestamp=parts.find(([k])=>k==='t')?.[1];
 if(!/^\d+$/.test(timestamp||'') || Math.abs(now/1000-Number(timestamp))>300)return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 for(const [type,signature] of parts){
  if(type!=='v1'||!/^[a-f0-9]{64}$/i.test(signature))continue;
  const bytes=Uint8Array.from(signature.match(/../g),b=>parseInt(b,16));
  if(await crypto.subtle.verify('HMAC',key,bytes,new TextEncoder().encode(`${timestamp}.${raw}`)))return true;
 }
 return false;
}
export function backend(env,request=fetch){
 const url=env('SUPABASE_URL'),service=env('SUPABASE_SERVICE_ROLE_KEY'),stripeKey=env('STRIPE_SECRET_KEY');
 async function db(path,body,method='POST'){
  const response=await request(`${url}/rest/v1/${path}`,{method,headers:{apikey:service,authorization:`Bearer ${service}`,'Content-Type':'application/json',Prefer:'return=representation'},body:body==null?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  const data=await response.json().catch(()=>null);
  if(!response.ok)throw new Error(data?.message || 'Database request failed');return data;
 }
 async function stripe(path,body,idempotencyKey){
  const response=await request(`https://api.stripe.com/v1/${path}`,{method:body?'POST':'GET',headers:{authorization:`Bearer ${stripeKey}`,'Content-Type':'application/x-www-form-urlencoded',...(idempotencyKey?{'Idempotency-Key':idempotencyKey}:{})},body:body?formEncode(body):undefined,signal:AbortSignal.timeout(20000)});
  const data=await response.json();if(!response.ok)throw new Error('Stripe could not prepare the payment. Please try again or contact support.');return data;
 }
 return {db,stripe};
}
