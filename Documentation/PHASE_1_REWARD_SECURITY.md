# Phase 1 Reward Security

## What Changed

Phase 1 moves active Reward Bondzy values out of the public `bondzies` row and makes redemption server-owned.

- Active reward values are copied into `public.bondzy_secrets`.
- `bondzies.reward_link` is cleared for active Reward Bondzies.
- A database trigger keeps future active Reward Bondzy inserts protected.
- The app calls the `redeem-bondzy` Supabase Edge Function instead of directly setting `status = redeemed`.
- `redeem-bondzy` checks server-side time window, distance, status, and Promise creator auth before updating the row.

## Files

- `supabase/migrations/20260508_reward_secrets_phase1.sql`
- `supabase/functions/redeem-bondzy/index.ts`
- `src/App.jsx`

## Deployment Order

Run these in this order:

1. Apply the SQL migration in Supabase.

   Use the Supabase SQL Editor, or run the migration through the Supabase CLI if your local project is linked.

2. Deploy the new Edge Function.

   ```powershell
   supabase functions deploy redeem-bondzy --no-verify-jwt
   ```

3. Deploy the frontend.

   The frontend expects `redeem-bondzy` to exist and expects active Reward Bondzy rows to have `reward_link = NULL`.

## Test Plan

1. Create a new Reward Bondzy.
2. Confirm the recipient email is delivered.
3. In Supabase, confirm the new Bondzy has `bondzies.reward_link = NULL`.
4. Confirm `bondzy_secrets` has one row for that Bondzy.
5. Open the shared link before the time window and confirm the reward is not visible.
6. During the time window, redeem near the location and confirm the reward is revealed.
7. Refresh the redeemed page and use `Reveal Reward` if the reward is not already visible.

## Phase 1 Limitations

The public `?bondzy=<id>` link still acts like a bearer link. Anyone with the link can attempt redemption, but they no longer receive the reward value before server-approved redemption.

Phase 2 should replace public ids with opaque claim tokens and tighten recipient authorization.
