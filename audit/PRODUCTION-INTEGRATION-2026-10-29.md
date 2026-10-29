# Production repository integration — 2026-10-29

Target: Adrian140/pipesan-frontend main, Vercel pipesan-frontend. Base: b36661c.

The earlier archive commit in Adrian140/PipeSan did not trigger Vercel. Repairs are integrated into the newer production tree, preserving expanded admin tabs, uploaded product images, translated catalog/reset page, extra routes and authenticated database cart storage.

Ported: real role-based auth without email/local-cache administrator fallback, protected routes, safe profile/address/invoice adapters, server-only gated checkout, authoritative order status, cart validation/persistence and paid-item consumption, safe product URLs/availability, explicit catalog errors, category URL filtering, exclusive-VAT labels and agreed shipping, honest contact-form errors, private SQL repair evidence and server source without secrets.

Additional production defects fixed: missing Info icon on email-verification page, duplicate translation keys, missing product rendered as empty record, unrestricted order payment-status editing, VAT-profile save blocked by unconfigured validation, contact form claiming success on network failure.

The original audit describes the archive at the time it was written; its screenshots are historical. This integration preserves production UI rather than replacing it with archive components.

Payment activation, Resend sender/key/scheduler, invoice-file reconciliation and live payment tests remain pending. No Stripe account or credentials changed. The database migrations were already applied and were not replayed by this frontend integration.
