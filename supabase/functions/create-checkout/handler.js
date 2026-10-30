import {backend,customerPayload,stripeSessionPayload} from '../_shared/checkout.js';
export function createCheckoutHandler({env,fetch:request=fetch}) {
 return async req=>{
  if(req.method==='POST' && env('SUPABASE_SERVICE_ROLE_KEY') && req.headers.get('authorization')===`Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`){
   try{
    const body=await req.json();if(body.action!=='configuration')return Response.json({error:'Unknown service action'},{status:400});
    const {stripe}=backend(env,request);const account=await stripe('account');const tax=await stripe('tax/settings');
    return Response.json({accountId:account.id,businessName:account.business_profile?.name || account.settings?.dashboard?.display_name,chargesEnabled:account.charges_enabled,taxStatus:tax.status,liveMode:env('STRIPE_SECRET_KEY')?.startsWith('sk_live_'),checkoutEnabled:env('CHECKOUT_ENABLED')==='true',webhookConfigured:!!env('CHECKOUT_WEBHOOK_SECRET')});
   }catch{return Response.json({error:'Could not verify payment configuration'},{status:503});}
  }
  const origin=req.headers.get('origin');
  const allowed=(env('CHECKOUT_ALLOWED_ORIGINS')||'https://www.pipesan.eu,https://pipesan.eu,http://127.0.0.1:5173').split(',');
  const headers={'Access-Control-Allow-Origin':allowed.includes(origin)?origin:allowed[0],'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS',Vary:'Origin'};
  const json=(body,status=200)=>Response.json(body,{status,headers});
  if(!allowed.includes(origin))return json({error:'Origin not allowed'},403);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  if(env('CHECKOUT_ENABLED')!=='true')return json({error:'Online payment is not enabled yet. Please contact contact@pipesan.eu.'},503);
  if(!env('STRIPE_SECRET_KEY')||!env('SUPABASE_SERVICE_ROLE_KEY'))return json({error:'Payment configuration is incomplete'},503);
  try {
   const raw=await req.text();if(raw.length>20000)return json({error:'Request too large'},413);
   const body=JSON.parse(raw);
   if(!/^[a-f0-9-]{36}$/i.test(body.requestId||'')||!Array.isArray(body.items))return json({error:'Invalid checkout request'},400);
   // Signed-in buyers order on their account; guests (anon key only) order with an email address.
   const auth=req.headers.get('authorization');let user=null;
   if(auth?.startsWith('Bearer ')){
    const who=await request(`${env('SUPABASE_URL')}/auth/v1/user`,{headers:{authorization:auth,apikey:env('SUPABASE_ANON_KEY')},signal:AbortSignal.timeout(15000)});
    if(who.ok)user=await who.json();
   }
   const guest=!user?.id;
   if(guest&&typeof body.email!=='string')return json({error:'Please sign in or enter your email address'},401);
   if(!guest&&!user.email_confirmed_at)return json({error:'Confirm your email before placing an order'},403);
   const {db,stripe}=backend(env,request);
   const reservation=await db('rpc/pipesan_reserve_checkout',{account_id:guest?null:user.id,request_id:body.requestId,cart:body.items.map(i=>({productId:i.productId,quantity:i.quantity})),address:body.address,guest_email:typeof body.email==='string'?body.email:null});
   const {checkout,order}=reservation;
   if(checkout.state!=='reserved')return json({error:'This checkout has ended. Start a new checkout.'},409);
   if(checkout.stripe_session_id){
    const current=await stripe(`checkout/sessions/${encodeURIComponent(checkout.stripe_session_id)}`);
    if(current.status!=='open')return json({error:'This payment session is closed. Check your order status.'},409);
    return json({url:current.url,orderId:order.id});
   }
   // Stripe expires idempotency keys after 24h; never recreate an uncertain old session.
   if(Date.now()-Date.parse(checkout.created_at)>23*3600000)return json({error:'This checkout needs reconciliation. Please contact support.'},409);
   let session;
   try{
    const customer=await stripe('customers',customerPayload(order),`pipesan-customer-${checkout.id}`);
    session=await stripe('checkout/sessions',stripeSessionPayload(reservation,customer.id,origin,body.locale,guest&&body.createAccount===true),`pipesan-checkout-${checkout.id}`);
   }catch(error){
    // No Stripe session exists, so nothing can be paid: give the stock back and cancel the pending order.
    try{await db('rpc/pipesan_release_unopened_checkout',{checkout:checkout.id});}catch{/* Reservation stays for manual review. */}
    throw error;
   }
   await db(`pipesan_checkout_sessions?id=eq.${checkout.id}`,{stripe_session_id:session.id,stripe_url:session.url},'PATCH');
   return json({url:session.url,orderId:order.id});
  }catch(error){return json({error:error.message || 'Checkout could not be prepared. Your cart is saved.'},400);}
 };
}
