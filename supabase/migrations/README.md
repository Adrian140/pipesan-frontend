# Database migrations

Production project: baazcwosfkaageltesbc.

The following repair migrations were applied once through Supabase SQL Editor on 2026-10-29:

1. 202610290001_profile_security.sql
2. 202610290002_invoice_security.sql
3. 202610290003_order_notifications.sql
4. 202610290004_stripe_checkout.sql
5. 202610290005_auth_profile.sql
6. 202610290006_review_tracking_security.sql

On 2026-10-30, `202610300001_prepcenter_stock_sync.sql` was applied with `supabase db query --linked -f` (not `db push`). Its schedule block was run separately: the cron secret lives only in Vault (`pipesan_prepcenter_cron_secret`) and in the `PREPCENTER_CRON_SECRET` function secret, next to `PREPCENTER_API_KEY`.

They may not appear in the CLI migration ledger. Inspect actual policies/functions/schema and reconcile migration history before any `db push`. Earlier files contain conflicting initial schemas and must not be replayed on the existing database. These repairs are not a complete fresh-install schema.

Tests under `audit/*dry-run.sql` use rollback. Already-applied policy/trigger definitions are not idempotent: run probes on an appropriate isolated database or adapt them to the existing definitions first. Rollback scripts are for reviewed recovery, not routine deployment. The checkout rollback preserves reservations to avoid losing payment reconciliation evidence.
