import {createWebhookHandler} from './handler.js';
Deno.serve(createWebhookHandler({env:(name:string)=>Deno.env.get(name)}));
