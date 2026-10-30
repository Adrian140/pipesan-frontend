// Reads the Prep Center warehouse inventory and applies PipeSan stock.
// Callers: pg_cron (x-cron-secret header) or an admin from the PipeSan admin panel (user JWT).
export const PREPCENTER_INVENTORY_URL='https://muswtkzjfrldhgokkmqw.supabase.co/functions/v1/client-data-api/api/inventory';
const ASIN_RE=/^[A-Z0-9]{10}$/;

export async function fetchInventory(apiKey,request=fetch,baseUrl=PREPCENTER_INVENTORY_URL){
 const rows=[];let url=`${baseUrl}?per_page=500&page=1`;
 for(let page=0;url&&page<50;page++){
  const response=await request(url,{headers:{'X-API-Key':apiKey,Accept:'application/json'},signal:AbortSignal.timeout(20000)});
  const body=await response.json().catch(()=>null);
  if(!response.ok)throw new Error(`Prep Center API ${response.status}: ${body?.error?.message || body?.error || body?.message || 'request failed'}`);
  rows.push(...(Array.isArray(body?.data)?body.data:[]));
  url=body?.links?.next || null;
 }
 return rows;
}

// Keep only PipeSan stock: rows named "PipeSan…" or whose ASIN is already sold in the shop.
export function pipesanRows(rows,shopAsins=new Set()){
 return rows.map(r=>({asin:String(r.asin||'').trim().toUpperCase(),sku:r.sku?String(r.sku):null,name:String(r.product_name||'').trim(),quantity:Math.max(0,Math.floor(Number(r.quantity_in_stock)||0))}))
  .filter(r=>ASIN_RE.test(r.asin) && (/^pipesan\b/i.test(r.name) || shopAsins.has(r.asin)));
}

export function createSyncHandler({env,fetch:request=fetch}){
 return async req=>{
  const origin=req.headers.get('origin');
  const allowed=(env('ADMIN_ALLOWED_ORIGINS')||'https://www.pipesan.eu,https://pipesan.eu').split(',');
  const allowOrigin=allowed.includes(origin) || /^https:\/\/pipesan-frontend-[a-z0-9-]+\.vercel\.app$/.test(origin||'') || /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin||'');
  const headers={'Access-Control-Allow-Origin':allowOrigin?origin:allowed[0],'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS',Vary:'Origin'};
  const json=(body,status=200)=>Response.json(body,{status,headers});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return json({error:'Method not allowed'},405);

  const url=env('SUPABASE_URL'),service=env('SUPABASE_SERVICE_ROLE_KEY'),apiKey=env('PREPCENTER_API_KEY'),cronSecret=env('PREPCENTER_CRON_SECRET');
  if(!url||!service||!apiKey)return json({error:'Sync is not configured'},503);
  async function db(path,body,method='POST'){
   const response=await request(`${url}/rest/v1/${path}`,{method,headers:{apikey:service,authorization:`Bearer ${service}`,'Content-Type':'application/json',Prefer:'return=representation'},body:body==null?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
   const data=await response.json().catch(()=>null);
   if(!response.ok)throw new Error(data?.message || 'Database request failed');return data;
  }

  let trigger;
  if(cronSecret && req.headers.get('x-cron-secret')===cronSecret)trigger='cron';
  else{
   const auth=req.headers.get('authorization');
   if(!allowOrigin || !auth?.startsWith('Bearer '))return json({error:'Not allowed'},401);
   const who=await request(`${url}/auth/v1/user`,{headers:{authorization:auth,apikey:env('SUPABASE_ANON_KEY')||service},signal:AbortSignal.timeout(15000)});
   if(!who.ok)return json({error:'Please sign in again'},401);
   const user=await who.json();
   const admins=await db(`users?select=id&role=eq.admin&auth_id=eq.${encodeURIComponent(user.id)}`,null,'GET');
   if(!Array.isArray(admins)||!admins.length)return json({error:'Admins only'},403);
   trigger='admin';
  }

  const [run]=await db('pipesan_prepcenter_sync_runs',{trigger});
  try{
   const rows=await fetchInventory(apiKey,request);
   // An empty answer is far more likely an API problem than an empty warehouse; never zero the shop on it.
   if(!rows.length)throw new Error('Prep Center returned no inventory rows');
   const products=await db('products?select=sku',null,'GET');
   const shopAsins=new Set(products.map(p=>String(p.sku||'').trim().toUpperCase()));
   const inventory=pipesanRows(rows,shopAsins);
   const result=await db('rpc/pipesan_apply_warehouse_stock',{run_id:run.id,inventory});
   await db(`pipesan_prepcenter_sync_runs?id=eq.${run.id}`,{status:'success',finished_at:new Date().toISOString(),warehouse_rows:rows.length,pipesan_rows:inventory.length},'PATCH');
   return json({ok:true,runId:run.id,warehouseRows:rows.length,pipesanRows:inventory.length,...result});
  }catch(error){
   await db(`pipesan_prepcenter_sync_runs?id=eq.${run.id}`,{status:'error',finished_at:new Date().toISOString(),error:String(error.message||error).slice(0,500)},'PATCH').catch(()=>{});
   return json({error:'Sync failed',detail:String(error.message||error).slice(0,300)},502);
  }
 };
}
