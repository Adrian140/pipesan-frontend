export const allowedCountries=['FR','AT','BE','BG','HR','CZ','DK','EE','FI','DE','GR','HU','IE','IT','LV','LI','LT','LU','NL','NO','PL','PT','RO','SK','SI','ES','SE','CH','GB'];
export function formEncode(value,prefix='',out=new URLSearchParams()) {
  for(const [key,item] of Object.entries(value)){
    const name=prefix?`${prefix}[${key}]`:key;
    if(item==null)continue;
    if(typeof item==='object')formEncode(item,name,out);else out.append(name,String(item));
  }
  return out;
}
const STRIPE_LOCALES=['fr','en','it','de','es','ro'];
export function stripeSessionPayload({checkout,order},customer,origin,locale,createAccount=false) {
  return {
    mode:'payment',customer,client_reference_id:order.id,locale:STRIPE_LOCALES.includes(locale)?locale:'auto',
    payment_method_types:['card'],automatic_tax:{enabled:true},billing_address_collection:'required',
    customer_update:{address:'auto',name:'auto'},tax_id_collection:{enabled:true},
    line_items:checkout.items.map(item=>({quantity:item.quantity,price_data:{currency:'eur',unit_amount:Math.round(item.unitPrice*100),tax_behavior:'exclusive',product_data:{name:item.name.slice(0,250),metadata:{sku:item.sku}}}})),
    shipping_options:[{shipping_rate_data:{display_name:'Chronopost',type:'fixed_amount',fixed_amount:{amount:Math.round(order.shipping_amount*100),currency:'eur'},tax_behavior:'exclusive',tax_code:'txcd_92010001'}}],
    metadata:{pipesan_order_id:order.id,pipesan_checkout_id:checkout.id,...(createAccount?{pipesan_create_account:'1'}:{})},
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
  const data=await response.json();
  // Stripe's own reason (e.g. account restricted, tax not activated) is safe to show and needed to fix it.
  if(!response.ok)throw new Error(`Stripe could not prepare the payment${data?.error?.message?`: ${data.error.message}`:'.'} Please try again or contact support.`);return data;
 }
 // Auth admin calls (service role) for accounts created from a guest order.
 async function auth(path,body){
  const response=await request(`${url}/auth/v1/${path}`,{method:'POST',headers:{apikey:service,authorization:`Bearer ${service}`,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  return {ok:response.ok,status:response.status,data:await response.json().catch(()=>null)};
 }
 return {db,stripe,auth};
}

// Creates the account a guest asked for, moves the paid order and its address onto it,
// and emails a link to choose a password. An existing account with that email just gets the order.
export async function createGuestAccount({db,auth,orderId,siteUrl}){
 const [order]=await db(`orders?id=eq.${encodeURIComponent(orderId)}&select=customer_email,shipping_first_name,shipping_last_name,shipping_company,shipping_country,customer_phone`,null,'GET');
 if(!order?.customer_email)return {created:false};
 const created=await auth('admin/users',{email:order.customer_email,email_confirm:false,user_metadata:{first_name:order.shipping_first_name,last_name:order.shipping_last_name,company_name:order.shipping_company||'',phone:order.customer_phone||'',country:order.shipping_country}});
 if(!created.ok&&created.status!==422)throw new Error('Account could not be created');
 await db('rpc/pipesan_link_guest_order',{target:orderId});
 if(created.ok)await auth(`recover?redirect_to=${encodeURIComponent(`${siteUrl}/reset-password`)}`,{email:order.customer_email});
 return {created:created.ok};
}
