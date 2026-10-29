// Server only. Never import this module into the browser bundle.
export function createEmailWorker({env, fetch: request = fetch}) {
  return async function handle(req) {
    const json=(body,status=200)=>Response.json(body,{status});
    if(req.method!=='POST')return json({error:'Method not allowed'},405);
    const serviceKey=env('SUPABASE_SERVICE_ROLE_KEY');
    if(!serviceKey || req.headers.get('authorization')!==`Bearer ${serviceKey}`)return json({error:'Unauthorized'},401);
    const url=env('SUPABASE_URL'),key=env('RESEND_API_KEY'),from=env('ORDER_EMAIL_FROM');
    if(!url || !key || !from)return json({error:'Email delivery is not configured'},503);
    const dbHeaders={authorization:`Bearer ${serviceKey}`,apikey:serviceKey,'Content-Type':'application/json'};
    const db=async(path,options)=>{
      const res=await request(`${url}/rest/v1/${path}`,{...options,headers:dbHeaders,signal:AbortSignal.timeout(15000)});
      if(!res.ok)throw new Error('Database operation failed');
      return res.status===204?null:res.json();
    };
    try {
      const jobs=await db('rpc/pipesan_claim_emails',{method:'POST',body:JSON.stringify({batch_size:10})});
      let accepted=0,failed=0;
      for(const job of jobs){
        let outcome;
        if(!job.recipient_email || !job.message || !job.reply_to || !job.event_key){
          outcome={status:'manual_review',error_message:'Incomplete queued notification',locked_at:null};failed++;
        } else {
          try {
            const response=await request('https://api.resend.com/emails',{
              method:'POST',headers:{authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':`pipesan-${job.id}`},
              body:JSON.stringify({from,to:[job.recipient_email],reply_to:job.reply_to,subject:job.subject,text:job.message}),
              signal:AbortSignal.timeout(15000)
            });
            const responseBody=await response.json().catch(()=>({}));
            if(response.ok && responseBody.id){
              outcome={status:'sent',provider_id:responseBody.id,sent_at:new Date().toISOString(),error_message:null,locked_at:null};accepted++;
            }else{
              const retryable=response.status===429 || response.status>=500;
              outcome={status:retryable&&job.attempts<5?'queued':'failed',error_message:`Email provider HTTP ${response.status}`,locked_at:null};failed++;
            }
          }catch{
            // Delivery may have happened: retry using the exact same idempotency key.
            outcome={status:job.attempts<5?'queued':'manual_review',error_message:'Delivery response unavailable; reconcile if retries are exhausted.',locked_at:null};failed++;
          }
        }
        await db(`email_logs?id=eq.${encodeURIComponent(job.id)}&status=eq.processing`,{method:'PATCH',body:JSON.stringify(outcome)});
      }
      return json({processed:jobs.length,accepted,failed});
    }catch{return json({error:'Email worker could not complete; inspect queue state'},500);}
  };
}
