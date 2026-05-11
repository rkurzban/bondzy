# Bondzy Security Hardening Plan

## What Changed

This hardening pass closes the highest-risk gaps after Phase 1 reward secrecy and Phase 2 claim-token links.

- `send-email` no longer forwards arbitrary browser-supplied Brevo payloads.
- Email sender, recipients, subjects, text, and HTML are generated server-side from approved templates.
- Web app creation now goes through the authenticated `create-bondzy-self` Edge Function.
- Reward redemption and Promise check-in notifications are sent by `redeem-bondzy`.
- The browser no longer marks expired Bondzies as `forfeit`; server cron owns that transition.
- Promise penalty values are moved into `bondzy_secrets` and cleared from `bondzies.reward_link`.
- RLS policies are version-controlled in a migration.
- An RLS smoke-test script verifies anon, creator, recipient, and unrelated-user access.

## Files

- `supabase/functions/_shared/bondzy-email.ts`
- `supabase/functions/send-email/index.ts`
- `supabase/functions/create-bondzy-self/index.ts`
- `supabase/functions/redeem-bondzy/index.ts`
- `supabase/functions/claim-bondzy/index.ts`
- `supabase/migrations/20260510_promise_penalty_secrets.sql`
- `supabase/migrations/20260510_rls_policies.sql`
- `src/App.jsx`
- `scripts/rls-smoke-test.js`

## Deployment Order

Run these after Phase 1 and Phase 2 are already deployed.

1. Apply the SQL migrations in Supabase.

   ```sql
   -- Run the contents of:
   -- supabase/migrations/20260510_promise_penalty_secrets.sql
   -- supabase/migrations/20260510_rls_policies.sql
   ```

2. Confirm server-side forfeit cron exists.

   ```sql
   select * from cron.job where jobname = 'forfeit-expired-bondzies';
   ```

   If no row appears, apply `supabase/migrations/20260413_forfeit_expired_bondzies.sql`.

3. Deploy the Edge Functions.

   ```powershell
   supabase functions deploy send-email --no-verify-jwt
   supabase functions deploy create-bondzy-self --no-verify-jwt
   supabase functions deploy claim-bondzy --no-verify-jwt
   supabase functions deploy redeem-bondzy --no-verify-jwt
   supabase functions deploy create-bondzy --no-verify-jwt
   ```

4. Deploy the frontend.

   ```powershell
   node_modules\.bin\vite.cmd build --configLoader runner
   git add .
   git commit -m "Harden Bondzy security paths"
   git push
   ```

5. Rotate the Brevo API key after the functions and frontend are live.

   Update the Supabase `BREVO_API_KEY` Edge Function secret with the new key.

## Test Plan

1. Create a Reward Bondzy from the web app.
2. Confirm recipient and creator emails arrive and use a `?claim=` link.
3. Confirm browser dev tools do not show raw HTML email payloads being sent from the client.
4. Redeem a Reward Bondzy and confirm the creator gets the redemption email.
5. Create a Promise Bondzy, check in as creator, and confirm the recipient gets the Promise-kept email.
6. Create a Promise Bondzy, let it forfeit, and confirm the recipient can reveal the penalty only after forfeit.
7. Confirm expired Bondzies change to `forfeit` through Supabase cron, not browser writes.
8. Run the RLS smoke test with service-role credentials available locally.

   ```powershell
   npm.cmd run test:rls
   ```

9. Confirm the old browser relay shape is rejected:

   ```json
   {
     "sender": { "email": "attacker@example.com" },
     "to": [{ "email": "victim@example.com" }],
     "subject": "bad",
     "htmlContent": "<p>bad</p>"
   }
   ```

   Expected result: `400 Unsupported email event type` or `401 Authentication required`.

## Secret Hygiene

- `VITE_BREVO_API_KEY` must not exist in `.env.local`.
- `VITE_BREVO_API_KEY` must not exist in Vercel environment variables.
- `VITE_BREVO_API_KEY` must not appear in source code.
- Brevo key rotation should happen after the hardened email functions are deployed.

## Follow-Up

- ~~Add rate limiting to `send-email`, `claim-bondzy`, `redeem-bondzy`, and creation functions.~~ **Done May 11, 2026** — see `supabase/migrations/20260511_rate_limiting.sql` and `supabase/functions/_shared/rate-limit.ts`. Limits (per 1-hour window): `create-bondzy` 120/hr per creator_email, `create-bondzy-self` 40/hr per user, `redeem-bondzy` 20/hr per bondzy, `claim-bondzy` 120/hr per claim_token, `send-email` 20/hr per user. Returns `429` + `console.warn` on limit hit.
- Add legacy `?bondzy=` usage logging before removing the signed-in handler.
- Backfill the complete production schema into migrations so this repo is the durable source of truth.
