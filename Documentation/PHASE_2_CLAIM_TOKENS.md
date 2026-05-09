# Phase 2 Claim Tokens

## What Changed

Phase 2 replaces public shared links that expose `bondzies.id` with opaque claim tokens.

- New shared links use `?claim=<token>` instead of `?bondzy=<id>`.
- Claim tokens live in `public.bondzy_claims`, a private table with no anon/authenticated read policies.
- A database trigger creates a claim token for every new Bondzy.
- Existing Bondzies are backfilled with claim tokens by the migration.
- The app uses the `claim-bondzy` Edge Function to load public Reward Bondzy links.
- The `redeem-bondzy` Edge Function now requires either a valid claim token or an authenticated matching recipient for Reward redemptions.
- Promise claim links require sign-in and are only visible to the creator or recipient.

## Files

- `supabase/migrations/20260509_claim_tokens_phase2.sql`
- `supabase/functions/claim-bondzy/index.ts`
- `supabase/functions/redeem-bondzy/index.ts`
- `supabase/functions/create-bondzy/index.ts`
- `src/App.jsx`
- `scripts/create-bondzy.js`

## Deployment Order

1. Apply the SQL migration in Supabase.

2. Deploy the new claim lookup Edge Function.

   ```powershell
   supabase functions deploy claim-bondzy --no-verify-jwt
   ```

3. Deploy the updated redemption and API functions.

   ```powershell
   supabase functions deploy redeem-bondzy --no-verify-jwt
   supabase functions deploy create-bondzy --no-verify-jwt
   ```

4. Deploy the frontend.

   The frontend expects `claim-bondzy` and `get_bondzy_claim_token()` to exist before it can create private claim links.

## Test Plan

1. Create a Reward Bondzy from the web app.
2. Confirm the recipient email link uses `?claim=` and does not contain the Bondzy id.
3. Open the claim link while signed out and confirm the Reward Bondzy loads.
4. During the time window, redeem near the location and confirm the reward is revealed.
5. Try calling `redeem-bondzy` with only `bondzy_id` while signed out and confirm it is rejected.
6. Open a creator dashboard Bondzy and use Copy Link. Confirm the copied URL uses `?claim=`.
7. Create a Reward Bondzy through the `create-bondzy` API and confirm the response `bondzy_url` uses `?claim=`.
8. Create or open a Promise Bondzy claim link while signed out and confirm it asks for sign-in instead of showing the Promise details.

## Notes

Legacy `?bondzy=<id>` links still work for signed-in users who already have access to the Bondzy in their dashboard. Public unauthenticated Reward links should now use `?claim=<token>`.
