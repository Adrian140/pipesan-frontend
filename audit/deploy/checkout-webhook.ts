// supabase/functions/_shared/checkout.js
function formEncode(value, prefix = "", out = new URLSearchParams()) {
  for (const [key, item] of Object.entries(value)) {
    const name = prefix ? `${prefix}[${key}]` : key;
    if (item == null) continue;
    if (typeof item === "object") formEncode(item, name, out);
    else out.append(name, String(item));
  }
  return out;
}
async function verifyStripeSignature(raw, header, secret, now = Date.now()) {
  if (!header || !secret) return false;
  const parts = header.split(",").map((x) => x.trim().split("="));
  const timestamp = parts.find(([k]) => k === "t")?.[1];
  if (!/^\d+$/.test(timestamp || "") || Math.abs(now / 1e3 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  for (const [type, signature] of parts) {
    if (type !== "v1" || !/^[a-f0-9]{64}$/i.test(signature)) continue;
    const bytes = Uint8Array.from(signature.match(/../g), (b) => parseInt(b, 16));
    if (await crypto.subtle.verify("HMAC", key, bytes, new TextEncoder().encode(`${timestamp}.${raw}`))) return true;
  }
  return false;
}
function backend(env, request = fetch) {
  const url = env("SUPABASE_URL"), service = env("SUPABASE_SERVICE_ROLE_KEY"), stripeKey = env("STRIPE_SECRET_KEY");
  async function db(path, body, method = "POST") {
    const response = await request(`${url}/rest/v1/${path}`, { method, headers: { apikey: service, authorization: `Bearer ${service}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: body == null ? void 0 : JSON.stringify(body), signal: AbortSignal.timeout(15e3) });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || "Database request failed");
    return data;
  }
  async function stripe(path, body, idempotencyKey) {
    const response = await request(`https://api.stripe.com/v1/${path}`, { method: body ? "POST" : "GET", headers: { authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded", ...idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {} }, body: body ? formEncode(body) : void 0, signal: AbortSignal.timeout(2e4) });
    const data = await response.json();
    if (!response.ok) throw new Error("Stripe could not prepare the payment. Please try again or contact support.");
    return data;
  }
  return { db, stripe };
}

// supabase/functions/checkout-webhook/handler.js
function createWebhookHandler({ env, fetch: request = fetch }) {
  return async (req) => {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
    const secret = env("CHECKOUT_WEBHOOK_SECRET");
    if (!secret) return new Response("Webhook not configured", { status: 503 });
    const raw = await req.text();
    if (raw.length > 1e6) return new Response("Payload too large", { status: 413 });
    if (!await verifyStripeSignature(raw, req.headers.get("stripe-signature"), secret)) return new Response("Invalid signature", { status: 400 });
    try {
      const event = JSON.parse(raw);
      const session = event.data?.object;
      const paid = ["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type) && session?.payment_status === "paid";
      const expired = ["checkout.session.expired", "checkout.session.async_payment_failed"].includes(event.type);
      if (!paid && !expired) return Response.json({ received: true });
      if (!session?.metadata?.pipesan_order_id) return Response.json({ received: true });
      if (session.currency !== "eur") return new Response("Currency mismatch", { status: 400 });
      const { db } = backend(env, request);
      await db("rpc/pipesan_finish_checkout", { session_id: session.id, paid, total_cents: paid ? session.amount_total : null, tax_cents: paid ? session.total_details?.amount_tax : null, intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null });
      if (env("ORDER_EMAIL_WORKER_ENABLED") === "true") {
        try {
          await request(`${env("SUPABASE_URL")}/functions/v1/send-order-emails`, { method: "POST", headers: { authorization: `Bearer ${env("SUPABASE_SERVICE_ROLE_KEY")}` }, signal: AbortSignal.timeout(2e4) });
        } catch {
        }
      }
      return Response.json({ received: true });
    } catch {
      return new Response("Order update failed; retry required", { status: 500 });
    }
  };
}

// supabase/functions/checkout-webhook/index.ts
Deno.serve(createWebhookHandler({ env: (name) => Deno.env.get(name) }));
