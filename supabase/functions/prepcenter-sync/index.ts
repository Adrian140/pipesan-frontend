import {createSyncHandler} from './handler.js';
Deno.serve(createSyncHandler({env:(name:string)=>Deno.env.get(name)}));
