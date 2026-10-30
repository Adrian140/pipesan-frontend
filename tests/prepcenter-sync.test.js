// @vitest-environment node
import {it,expect,vi} from 'vitest';
import {fetchInventory,pipesanRows,createSyncHandler} from '../supabase/functions/prepcenter-sync/handler';

const inventory=[
 {sku:'AV7230',asin:'B0DM8MFF8B',product_name:'PipeSan – 3-Way Corner Valve',quantity_in_stock:15},
 {sku:'5R-QHG4',asin:'b0dfqglvd8',product_name:'PipeSan Combined Angle Valve',quantity_in_stock:2},
 {sku:'AV8059B',asin:'B0DFQGLVD8',product_name:'PipeSan Combined Angle Valve',quantity_in_stock:14},
 {sku:'X-1',asin:'B0079765N8',product_name:'Boucheron Jaipur Homme 100ml',quantity_in_stock:84},
 {sku:'X-2',asin:'B0DMW11S8M',product_name:'Brass nipple listed under another name',quantity_in_stock:-3},
 {sku:null,asin:null,product_name:'PipeSan without ASIN',quantity_in_stock:9},
];

it('keeps only PipeSan rows or ASINs already sold in the shop',()=>{
 const rows=pipesanRows(inventory,new Set(['B0DMW11S8M']));
 expect(rows.map(r=>r.asin)).toEqual(['B0DM8MFF8B','B0DFQGLVD8','B0DFQGLVD8','B0DMW11S8M']);
 expect(rows.at(-1).quantity).toBe(0);
});

it('follows pagination links and sends the key only to Prep Center',async()=>{
 const fetch=vi.fn()
  .mockResolvedValueOnce(Response.json({data:[inventory[0]],links:{next:'https://prep.example/inv?page=2'}}))
  .mockResolvedValueOnce(Response.json({data:[inventory[1]],links:{next:null}}));
 const rows=await fetchInventory('pc_client_test',fetch,'https://prep.example/inv');
 expect(rows).toHaveLength(2);
 expect(fetch.mock.calls[1][0]).toBe('https://prep.example/inv?page=2');
 expect(fetch.mock.calls[0][1].headers['X-API-Key']).toBe('pc_client_test');
});

const env=n=>({SUPABASE_URL:'https://db.example',SUPABASE_SERVICE_ROLE_KEY:'service',PREPCENTER_API_KEY:'pc_client_test',PREPCENTER_CRON_SECRET:'cron-secret'})[n];

it('rejects callers without the cron secret or an admin session',async()=>{
 const fetch=vi.fn();
 const handler=createSyncHandler({env,fetch});
 const r=await handler(new Request('https://fn',{method:'POST',headers:{origin:'https://www.pipesan.eu','x-cron-secret':'wrong'}}));
 expect(r.status).toBe(401);
 expect(fetch).not.toHaveBeenCalled();
});

it('rejects signed-in users who are not admins',async()=>{
 const fetch=vi.fn(async url=>String(url).includes('/auth/v1/user')?Response.json({id:'u1'}):Response.json([]));
 const handler=createSyncHandler({env,fetch});
 const r=await handler(new Request('https://fn',{method:'POST',headers:{origin:'https://www.pipesan.eu',authorization:'Bearer user-jwt'}}));
 expect(r.status).toBe(403);
});

it('applies filtered PipeSan stock from a cron run and logs the run',async()=>{
 const calls=[];
 const fetch=vi.fn(async(url,init={})=>{
  url=String(url);calls.push([url,init.method,init.body]);
  if(url.startsWith('https://muswtkzjfrldhgokkmqw'))return Response.json({data:inventory,links:{next:null}});
  if(url.endsWith('/pipesan_prepcenter_sync_runs'))return Response.json([{id:7}]);
  if(url.includes('/products?select=sku'))return Response.json([{sku:'B0DM8MFF8B'}]);
  if(url.includes('/rpc/'))return Response.json({matched:2,updated:2,created_drafts:0});
  return Response.json([]);
 });
 const handler=createSyncHandler({env,fetch});
 const r=await handler(new Request('https://fn',{method:'POST',headers:{'x-cron-secret':'cron-secret'}}));
 const body=await r.json();
 expect(r.status).toBe(200);
 expect(body).toMatchObject({ok:true,runId:7,warehouseRows:6,pipesanRows:3,matched:2});
 const rpc=JSON.parse(calls.find(([u])=>u.includes('/rpc/'))[2]);
 expect(rpc.run_id).toBe(7);
 expect(rpc.inventory.every(r=>r.name.startsWith('PipeSan'))).toBe(true);
 expect(JSON.parse(calls.at(-1)[2]).status).toBe('success');
});

it('never zeroes stock when Prep Center answers with an empty list',async()=>{
 const fetch=vi.fn(async url=>{
  url=String(url);
  if(url.startsWith('https://muswtkzjfrldhgokkmqw'))return Response.json({data:[],links:{next:null}});
  if(url.endsWith('/pipesan_prepcenter_sync_runs'))return Response.json([{id:8}]);
  return Response.json([]);
 });
 const handler=createSyncHandler({env,fetch});
 const r=await handler(new Request('https://fn',{method:'POST',headers:{'x-cron-secret':'cron-secret'}}));
 expect(r.status).toBe(502);
 expect(fetch.mock.calls.some(([u])=>String(u).includes('/rpc/'))).toBe(false);
});
