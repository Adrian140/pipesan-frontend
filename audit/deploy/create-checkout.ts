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
function stripeSessionPayload({ checkout, order }, customer, origin) {
  return {
    mode: "payment",
    customer,
    client_reference_id: order.id,
    payment_method_types: ["card"],
    automatic_tax: { enabled: true },
    billing_address_collection: "required",
    customer_update: { address: "auto", name: "auto" },
    tax_id_collection: { enabled: true },
    line_items: checkout.items.map((item) => ({ quantity: item.quantity, price_data: { currency: "eur", unit_amount: Math.round(item.unitPrice * 100), tax_behavior: "exclusive", product_data: { name: item.name.slice(0, 250), metadata: { sku: item.sku } } } })),
    shipping_options: [{ shipping_rate_data: { display_name: "Standard delivery", type: "fixed_amount", fixed_amount: { amount: Math.round(order.shipping_amount * 100), currency: "eur" }, tax_behavior: "exclusive", tax_code: "txcd_92010001" } }],
    metadata: { pipesan_order_id: order.id, pipesan_checkout_id: checkout.id },
    payment_intent_data: { metadata: { pipesan_order_id: order.id } },
    success_url: `${origin}/order-success?order_id=${encodeURIComponent(order.id)}`,
    cancel_url: `${origin}/checkout?canceled=1`
  };
}
function customerPayload(order) {
  const name = `${order.shipping_first_name} ${order.shipping_last_name}`;
  const address = { line1: order.shipping_address, city: order.shipping_city, postal_code: order.shipping_postal_code, country: order.shipping_country };
  return { email: order.customer_email, name, address, shipping: { name, address }, metadata: { pipesan_order_id: order.id } };
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

// supabase/functions/create-checkout/handler.js
function createCheckoutHandler({ env, fetch: request = fetch }) {
  return async (req) => {
    if (req.method === "POST" && env("SUPABASE_SERVICE_ROLE_KEY") && req.headers.get("authorization") === `Bearer ${env("SUPABASE_SERVICE_ROLE_KEY")}`) {
      try {
        const body = await req.json();
        if (body.action !== "configuration") return Response.json({ error: "Unknown service action" }, { status: 400 });
        const { stripe } = backend(env, request);
        const account = await stripe("account");
        const tax = await stripe("tax/settings");
        return Response.json({ accountId: account.id, businessName: account.business_profile?.name || account.settings?.dashboard?.display_name, chargesEnabled: account.charges_enabled, taxStatus: tax.status, liveMode: env("STRIPE_SECRET_KEY")?.startsWith("sk_live_"), checkoutEnabled: env("CHECKOUT_ENABLED") === "true", webhookConfigured: !!env("CHECKOUT_WEBHOOK_SECRET") });
      } catch {
        return Response.json({ error: "Could not verify payment configuration" }, { status: 503 });
      }
    }
    const origin = req.headers.get("origin");
    const allowed = (env("CHECKOUT_ALLOWED_ORIGINS") || "https://www.pipesan.eu,https://pipesan.eu,http://127.0.0.1:5173").split(",");
    const headers = { "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0], "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info", "Access-Control-Allow-Methods": "POST,OPTIONS", Vary: "Origin" };
    const json = (body, status = 200) => Response.json(body, { status, headers });
    if (!allowed.includes(origin)) return json({ error: "Origin not allowed" }, 403);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    if (env("CHECKOUT_ENABLED") !== "true") return json({ error: "Online payment is not enabled yet. Please contact contact@pipesan.eu." }, 503);
    if (!env("STRIPE_SECRET_KEY") || !env("SUPABASE_SERVICE_ROLE_KEY")) return json({ error: "Payment configuration is incomplete" }, 503);
    try {
      const auth = req.headers.get("authorization");
      if (!auth?.startsWith("Bearer ")) return json({ error: "Please sign in" }, 401);
      const who = await request(`${env("SUPABASE_URL")}/auth/v1/user`, { headers: { authorization: auth, apikey: env("SUPABASE_ANON_KEY") }, signal: AbortSignal.timeout(15e3) });
      if (!who.ok) return json({ error: "Please sign in again" }, 401);
      const user = await who.json();
      if (!user.id || !user.email_confirmed_at) return json({ error: "Confirm your email before placing an order" }, 403);
      const raw = await req.text();
      if (raw.length > 2e4) return json({ error: "Request too large" }, 413);
      const body = JSON.parse(raw);
      if (!/^[a-f0-9-]{36}$/i.test(body.requestId || "") || !Array.isArray(body.items)) return json({ error: "Invalid checkout request" }, 400);
      const { db, stripe } = backend(env, request);
      const reservation = await db("rpc/pipesan_reserve_checkout", { account_id: user.id, request_id: body.requestId, cart: body.items.map((i) => ({ productId: i.productId, quantity: i.quantity })), address: body.address });
      const { checkout, order } = reservation;
      if (checkout.state !== "reserved") return json({ error: "This checkout has ended. Start a new checkout." }, 409);
      if (checkout.stripe_session_id) {
        const current = await stripe(`checkout/sessions/${encodeURIComponent(checkout.stripe_session_id)}`);
        if (current.status !== "open") return json({ error: "This payment session is closed. Check your order status." }, 409);
        return json({ url: current.url, orderId: order.id });
      }
      if (Date.now() - Date.parse(checkout.created_at) > 23 * 36e5) return json({ error: "This checkout needs reconciliation. Please contact support." }, 409);
      const customer = await stripe("customers", customerPayload(order), `pipesan-customer-${checkout.id}`);
      const session = await stripe("checkout/sessions", stripeSessionPayload(reservation, customer.id, origin), `pipesan-checkout-${checkout.id}`);
      await db(`pipesan_checkout_sessions?id=eq.${checkout.id}`, { stripe_session_id: session.id, stripe_url: session.url }, "PATCH");
      return json({ url: session.url, orderId: order.id });
    } catch (error) {
      return json({ error: error.message || "Checkout could not be prepared. Your cart is saved." }, 400);
    }
  };
}

// supabase/functions/create-checkout/index.ts
Deno.serve(createCheckoutHandler({ env: (name) => Deno.env.get(name) }));
