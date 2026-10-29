import { productPrice } from './catalog';
export function readCart(storage) {
  try { const parsed=JSON.parse(storage.getItem('cart') || '[]');return Array.isArray(parsed)?parsed.filter(i=>i && typeof i.id==='string' && i.productId && typeof i.name==='string' && Number.isFinite(i.price) && i.price>=0 && Number.isInteger(i.quantity) && i.quantity>0).map(i=>({...i,quantity:Math.min(i.quantity,99)})):[]; } catch{return [];}
}
export function addCartItem(items,product,quantity=1,variant=null) {
  if(!product.inStock || !Number.isInteger(quantity) || quantity<1)return items;
  const price=variant?.price ?? productPrice(product);if(!Number.isFinite(price) || price<0)return items;
  const id=variant?`${product.id}-${variant.id}`:String(product.id);
  const maximum=product.manage_stock===false?99:Math.min(99,Math.max(0,product.stockCount ?? 99));
  const existing=items.find(i=>i.id===id);const next=Math.min((existing?.quantity || 0)+quantity,maximum);
  if(next<1)return items;
  if(existing)return items.map(i=>i.id===id?{...i,price,quantity:next,maxQuantity:maximum}:i);
  return [...items,{id,productId:product.id,name:variant?`${product.name} - ${variant.name}`:product.name,sku:variant?.sku || product.sku,price,image:product.image,quantity:next,maxQuantity:maximum,variant}];
}
export function changeQuantity(items,id,quantity) {
  if(!Number.isInteger(quantity) || quantity<0)return items;
  if(quantity===0)return items.filter(i=>i.id!==id);
  return items.map(i=>i.id===id?{...i,quantity:Math.min(quantity,99,i.maxQuantity ?? 99)}:i);
}
