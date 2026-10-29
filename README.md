# PipeSan production frontend

This is the repository connected to Vercel `pipesan-frontend`: `Adrian140/pipesan-frontend`, production branch `main`.

The 2026-10-29 repair was integrated onto commit b36661c, retaining the expanded administration, translated catalog and password reset, additional routes and database cart synchronization. Do not replace this repository with the older PipeSan archive.

## Development

Node >=22.12, `npm ci`, configure `.env` using `.env.example`, `npm run dev`. Run `npm run lint`, `npm test`, `npm run build` before publication. Never commit secrets.

Checkout is intentionally disabled unless `VITE_CHECKOUT_ENABLED=true`. Leave disabled until the correct Stripe account, Stripe Tax, new edge functions and webhook pass end-to-end tests. Prices exclude VAT; shipping is EUR9.99, free from EUR100 before VAT. No payment is confirmed solely by a return URL.

Supabase repair migrations dated 20261029 were already applied to the shared database; do not run them again or replay legacy schema files. `send-order-emails` is deployed but Resend configuration and a secured queue schedule remain pending. The two new checkout functions are source only, not yet deployed. See `audit/AUDIT-2026-10-29.md` for the earlier archive audit and `audit/PRODUCTION-INTEGRATION-2026-10-29.md` for this integration.
