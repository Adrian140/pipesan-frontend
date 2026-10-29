import {backend,verifyStripeSignature} from '../_shared/checkout.js';
export function createWebhookHandler({env,fetch:request=fetch}){
 return async req=>{
  if(req.method!=='POST')return new Response('Method not allowed',{status:405});
  const secret=env('CHECKOUT_WEBHOOK_SECRET');if(!secret)return new Response('Webhook not configured',{status:503});
  const raw=await req.text();if(raw.length>1000000)return new Response('Payload too large',{status:413});
  if(!await verifyStripeSignature(raw,req.headers.get('stripe-signature'),secret))return new Response('Invalid signature',{status:400});
  try{
   const event=JSON.parse(raw);const session=event.data?.object;
   const paid=['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type) && session?.payment_status==='paid';
   const expired=['checkout.session.expired','checkout.session.async_payment_failed'].includes(event.type);
   if(!paid&&!expired)return Response.json({received:true});
   if(!session?.metadata?.pipesan_order_id)return Response.json({received:true});
   if(session.currency!=='eur')return new Response('Currency mismatch',{status:400});
   const {db}=backend(env,request);
   await db('rpc/pipesan_finish_checkout',{session_id:session.id,paid,total_cents:paid?session.amount_total:null,tax_cents:paid?session.total_details?.amount_tax:null,intent_id:typeof session.payment_intent==='string'?session.payment_intent:null});
   // Delivery failure must not roll back an accepted payment; queued emails remain retryable.
   if(env('ORDER_EMAIL_WORKER_ENABLED')==='true'){
    try{await request(`${env('SUPABASE_URL')}/functions/v1/send-order-emails`,{method:'POST',headers:{authorization:`Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`},signal:AbortSignal.timeout(20000)});}catch{/* Separate scheduled worker retries the queue. */}
   }
   return Response.json({received:true});
  }catch{return new Response('Order update failed; retry required',{status:500});}
 };
}
