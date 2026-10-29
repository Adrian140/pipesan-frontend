import { createEmailWorker } from './worker.js';
Deno.serve(createEmailWorker({ env: (name: string) => Deno.env.get(name) }));
