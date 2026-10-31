import { supabase } from './supabase';
import { normalizeProduct } from '../domain/catalog';
const client = () => { if (!supabase) throw new Error('Supabase is not configured.'); return supabase; };
const result = async query => { const {data,error} = await query; if(error) throw error; return data; };
const camel = row => row && Object.fromEntries(Object.entries(row).map(([k,v])=>[k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase()),v]));
const fields = (input, allowed) => Object.fromEntries(allowed.filter(k=>input[k] !== undefined).map(k=>[k.replace(/[A-Z]/g,c=>'_'+c.toLowerCase()),input[k]]));
const unavailable = name => async () => { throw new Error(`${name} is not configured yet. Please contact contact@pipesan.eu.`); };
const authenticatedUser = async () => {
  const {data,error} = await client().auth.getUser(); if(error) throw error;
  if(!data.user) throw new Error('Please sign in to continue.'); return data.user;
};
export async function getProfile(authUser) {
  if(!authUser) return null;
  const profile = await result(client().from('users').select('id,auth_id,first_name,last_name,phone,country,language,role,email_verified,created_at').eq('auth_id',authUser.id).maybeSingle());
  return {...camel(profile), authId:authUser.id, email:authUser.email, role:profile?.role || 'user', deliveryCountry:profile?.country};
}
async function owner() { const profile=await getProfile(await authenticatedUser()); if(!profile?.id) throw new Error('Your account profile is not available. Please contact support.'); return profile; }
async function admin() { const profile=await owner(); if(profile.role!=='admin') throw new Error('Administrator access required.'); return profile; }
const addressFields=['type','label','firstName','lastName','company','address','city','postalCode','country','phone','isDefault'];
const billingFields=['type','firstName','lastName','companyName','vatNumber','sirenSiret','country','address','city','postalCode','phone','isDefault'];
function ownedResource(table,allowed) {
  return {
    getAll:async()=>{const u=await owner(); return (await result(client().from(table).select('*').eq('user_id',u.id))).map(camel);},
    create:async input=>{const u=await owner();return camel(await result(client().from(table).insert({...fields(input,allowed),user_id:u.id}).select().single()));},
    update:async(id,input)=>{const u=await owner();return camel(await result(client().from(table).update(fields(input,allowed)).eq('id',id).eq('user_id',u.id).select().single()));},
    delete:async id=>{const u=await owner();await result(client().from(table).delete().eq('id',id).eq('user_id',u.id).select('id').single());},
  };
}
const adminResource=(table,allowed)=>({
  list:async()=>{await admin();return (await result(client().from(table).select('*'))).map(camel);},
  create:async input=>{await admin();return result(client().from(table).insert(fields(input,allowed)).select().single());},
  update:async(id,input)=>{await admin();return result(client().from(table).update(fields(input,allowed)).eq('id',id).select().single());},
  delete:async id=>{await admin();return result(client().from(table).delete().eq('id',id).select('id').single());},
});
const services=adminResource('services',['title','description','features','price','unit','category','isActive','sortOrder']);
const pricing=adminResource('pricing',['service','price','unit','category','isActive']);
const documents=adminResource('documents',['title','description','type','size','pages','languages','downloadUrl','category','isActive']);
const products=adminResource('products',['name','sku','slug','description','shortDescription','categoryId','price','salePrice','stockQuantity','isActive','isDraft','manageStock','inStock','stockStatus','images','amazonLinks','bulletPoints','dimensions']);
function productInput(input) {
  const name=(input.title ?? input.name ?? '').trim();
  const price=Number(input.price);
  if(!name || !input.sku || input.price==='' || !Number.isFinite(price) || price<0)throw new Error('Name, SKU and a valid price are required.');
  const stock=Number(input.stockQuantity ?? 0);if(!Number.isInteger(stock)||stock<0)throw new Error('Stock must be a non-negative integer.');
  let dimensions=input.dimensions;
  if(typeof dimensions==='string'){try{dimensions=JSON.parse(dimensions || '{}');}catch{dimensions={description:dimensions};}}
  return {...input,name,price,stockQuantity:stock,stockStatus:input.inStock===false?'out_of_stock':(input.manageStock===false||stock>0)?'in_stock':'out_of_stock',dimensions,slug:input.slug || name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),categoryId:input.categoryId || null,images:input.image?[input.image,...(input.images || []).slice(1)]:input.images || []};
}
async function invoiceFile(id) {
  const u = await owner();
  const invoice = await result(client().from('invoices').select('file_path').eq('id',id).eq('user_id',u.id).single());
  if (!invoice.file_path) throw new Error('This invoice has no PDF attached. Please contact support.');
  return result(client().storage.from('user-invoices').download(invoice.file_path));
}
export const apiClient = {
  auth:{
    login:async(email,password)=>{const {data,error}=await client().auth.signInWithPassword({email,password});if(error)throw error;return {user:await getProfile(data.user)};},
    register:async input=>{const {error}=await client().auth.signUp({email:input.email,password:input.password,options:{emailRedirectTo:window.location.origin+'/dashboard',data:fields(input,['firstName','lastName','phone','deliveryCountry','accountType','companyName','vatNumber'])}});if(error)throw error;return {message:'Check your email to confirm your account.'};},
    validate:async()=>getProfile(await authenticatedUser()),
    forgotPassword:async email=>{const {error}=await client().auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/reset-password'});if(error)throw error;},
    changePassword:async(currentPassword,password)=>{const user=await authenticatedUser();const check=await client().auth.signInWithPassword({email:user.email,password:currentPassword});if(check.error)throw check.error;const {error}=await client().auth.updateUser({password});if(error)throw error;},
    enable2FA:unavailable('Two-factor authentication setup'),verify2FA:unavailable('Two-factor authentication setup'),disable2FA:unavailable('Two-factor authentication setup'),
  },
  user:{updateProfile:async input=>{const u=await owner();return result(client().from('users').update(fields(input,['firstName','lastName','phone','country','language'])).eq('id',u.id).select('id').single());}},
  products:{
    getAll:async()=>{let all=[];for(let start=0;;start+=500){const rows=await result(client().from('products').select('*,categories(name,slug)').eq('is_active',true).eq('is_draft',false).order('id').range(start,start+499));all.push(...rows.map(normalizeProduct));if(rows.length<500)break;}return all;},
    getById:async id=>{const row=await result(client().from('products').select('*,categories(name,slug)').eq(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id))?'id':'slug',id).eq('is_active',true).eq('is_draft',false).maybeSingle());return row?normalizeProduct(row):null;},
  },
  content:{getPublic:async()=>Object.fromEntries((await result(client().from('content').select('key,value').eq('language','en'))).map(r=>[r.key,r.value]))},
  categories:{getAll:async()=>{const [rows,items]=await Promise.all([result(client().from('categories').select('*').eq('is_active',true).order('sort_order')),apiClient.products.getAll()]);return rows.map(row=>({...row,productCount:items.filter(p=>p.category_id===row.id).length}));}},
  addresses:ownedResource('addresses',addressFields),
  billingProfiles:{...ownedResource('billing_profiles',billingFields),validateVAT:unavailable('VAT validation')},
  invoices:{getAll:async()=>{const u=await owner();return(await result(client().from('invoices').select('*').eq('user_id',u.id))).map(row=>({...camel(row),number:row.invoice_number || row.id,amount:Number(row.total_amount || 0),vatAmount:Number(row.tax_amount || 0)}));},download:invoiceFile,view:invoiceFile},
  documents:{getAll:async()=>(await result(client().from('documents').select('*').eq('is_active',true))).map(camel)},
  admin:{
    getOrders:async()=>{await admin();return (await result(client().from('orders').select('*').order('created_at',{ascending:false}).limit(100))).map(camel);},
    updateOrder:async(id,input)=>{await admin();const existing=await result(client().from('orders').select('status,payment_status').eq('id',id).single());
      if(input.status!==existing.status){
        if(!['packed','shipped','delivered','completed'].includes(input.status))throw new Error('Payment, cancellation and refund states are managed by the payment service.');
        if(existing.payment_status!=='paid')throw new Error('Only paid orders can be processed for delivery.');
      }
      return result(client().from('orders').update(fields(input,['status','trackingNumber','carrierName'])).eq('id',id).select('id').single());},
    getServices:services.list,createService:services.create,updateService:services.update,deleteService:services.delete,
    getProducts:async()=>(await products.list()).map(p=>({...p,title:p.name,image:p.images?.[0] || ''})),createProduct:async p=>products.create(productInput(p)),updateProduct:async(id,p)=>products.update(id,productInput(p)),deleteProduct:products.delete,
    getPricing:pricing.list,createPricing:pricing.create,updatePricing:pricing.update,deletePricing:pricing.delete,
    getDocuments:documents.list,createDocument:documents.create,updateDocument:documents.update,deleteDocument:documents.delete,
    getUsers:async()=>{await admin();return (await result(client().from('users').select('id,email,first_name,last_name,role,created_at'))).map(camel);},
    getContent:async()=>{await admin();return Object.fromEntries((await result(client().from('content').select('key,value').eq('language','en'))).map(r=>[r.key,r.value]));},
    updateContent:async input=>{await admin();return result(client().from('content').upsert(Object.entries(input).map(([key,value])=>({key,value:String(value),language:'en'})),{onConflict:'key'}).select());},
  },
  orders:{
    getAll:async()=>{const u=await owner();return (await result(client().from('orders').select('id,order_number,status,payment_status,total_amount,currency,created_at').eq('user_id',u.id).order('created_at',{ascending:false}).limit(100))).map(camel);},
    create:async input=>{const {data,error}=await client().functions.invoke('create-checkout',{body:input});if(error){let message=error.message;try{message=(await error.context.json()).error || message;}catch{}throw new Error(message);}if(data?.error)throw new Error(data.error);return data;},
    getById:async id=>{const u=await owner();const row=await result(client().from('orders').select('id,order_number,status,payment_status,total_amount,currency,created_at').eq('id',id).eq('user_id',u.id).single());return camel(row);},
  },
  contact:{send:async form=>{const endpoint=import.meta.env.VITE_CONTACT_ENDPOINT;if(!endpoint)throw new Error('Please email contact@pipesan.eu. The contact form is currently unavailable.');const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(form)});if(!response.ok)throw new Error('Message could not be sent. Please email contact@pipesan.eu.');return {success:true};}},
};
export default apiClient;
