import {createCheckoutHandler} from './handler.js';
Deno.serve(createCheckoutHandler({env:(name:string)=>Deno.env.get(name)}));
