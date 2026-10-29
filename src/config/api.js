import {apiClient as existing} from './api/index';
import {apiClient as repaired} from './repairApi';
import {filterProducts} from '../domain/catalog';
export {getProfile} from './repairApi';
export const apiClient={...existing,...repaired,
 products:{...existing.products,...repaired.products,getAll:async(filters={})=>filterProducts(await repaired.products.getAll(),{...filters,category:filters.category==='All Categories'?'':filters.category})},
 admin:{...existing.admin,getContent:repaired.admin.getContent,updateContent:repaired.admin.updateContent},
 orders:{...existing.orders,create:repaired.orders.create,getById:repaired.orders.getById},
};
export default apiClient;
