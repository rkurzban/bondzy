# Bondzy Development Guide
## Where We Are and What's Next

*Last updated: May 17, 2026*

---

## What's Done ✅

| Feature | Notes |
|---------|-------|
| Deployment | React + Vite app on Vercel, GitHub at rkurzban/bondzy |
| Database & Auth | Supabase: magic link login, bondzies table, profiles, RLS policies |
| Google SSO | "Continue with Google" on the sign-in page |
| Google Places | Real Places Autocomplete API — any location worldwide |
| SMTP | Brevo connected to Supabase for auth emails (info@bondzy.com) |
| Email notifications | App invokes Supabase Edge Functions; Brevo sends from server-side secrets |
| Creator confirmation email | Sent to creator when a Bondzy is created |
| Recipient redemption email | Sent to recipient when they successfully redeem |
| Creator redemption notification | Sent to creator when recipient redeems |
| Reward Bondzies | Full create → share → GPS verify → redeem flow |
| Promise Bondzies | Full create → share → GPS verify → fulfill flow (creator verifies their own location) |
| Auto-GPS & one-click redemption | Location check happens automatically; single tap to redeem |
| URL sharing / Copy Link | Each Bondzy has a shareable link; recipients don't need an account to view |
| Brevo API key security | Brevo key rotated and stored as the Supabase `BREVO_API_KEY` Edge Function secret |
| Claim token links | Shared links use private `?claim=` tokens instead of public database ids |
| Server-side forfeit cron | Supabase cron owns expired Bondzy forfeits; browser code no longer writes forfeits |
| Explicit Supabase Data API grants | `20260517_explicit_data_api_grants.sql` locks in table/function exposure before Supabase's implicit public-schema grants change |
| Email icon assets | Hosted PNG email icons live in `public/email-icons/` and render consistently in Gmail |
| app.bondzy.com | App now lives at app.bondzy.com, separate from the www.bondzy.com marketing site |
| www.bondzy.com footer link | Small tasteful link to the marketing site in the app footer |

---

## What's Left (In Priority Order)

---

### 1. Server-Side Forfeit Logic
**Status:** Complete. Supabase cron owns the expired-to-forfeit transition. The browser may display an active-but-expired Bondzy as expired for UI purposes, but it does not write `status = "forfeit"` to the database.

**To verify:** Go to Supabase SQL Editor and run:
```sql
select * from cron.job where jobname = 'forfeit-expired-bondzies';
```

You should see one row.

---

### 2. Domain Consolidation
**Status:** The app is at `app.bondzy.com`. The marketing site (`www.bondzy.com`) is still on Wix. These are currently two separate things, which is fine for now.

**Decision to make:** Do you want to eventually migrate the Wix marketing site content into the React app and serve everything from one place? Or keep them permanently separate (Wix for marketing, app.bondzy.com for the app)?

**If keeping them separate (recommended for now):** No action needed. The footer link to www.bondzy.com is already in place.

**If consolidating later:**
1. Copy content from Wix pages (About, Terms, Privacy, etc.)
2. Add those as React components in the app
3. Point www.bondzy.com DNS to Vercel alongside app.bondzy.com

---

### 3. Polish & UX 💅

| Item | Notes |
|------|-------|
| Mobile responsiveness | Test on phone screens; fix any layout issues |
| Smarter date/time picker | Quick-pick buttons ("Tomorrow morning", "This Saturday") reduce typing on mobile |
| Reward link shortcuts | Pre-fill buttons for PayPal, Venmo, Amazon Gift Card |
| Auto-populate recipient | If recipient email matches existing user, pre-fill their name |
| Onboarding | First-time user tour or example Bondzy |

---

### 4. Email Function Hardening
**Status:** Hardened. `send-email` now accepts only approved creation event names plus a Bondzy id, validates the authenticated creator, and renders the email server-side. Post-redemption emails are sent by `redeem-bondzy`, not by the browser.

**Remaining risk:** Add rate limiting before public scale.
---

## Infrastructure

### Where Things Live

| Thing | Location | Login |
|-------|----------|-------|
| Source code | github.com/rkurzban/bondzy | GitHub account |
| Hosting | vercel.com (bondzy project) | GitHub SSO |
| Database & Auth | supabase.com (Bondzy project) | GitHub SSO |
| Email sending | app.brevo.com | rkurzban@gmail.com |
| Domain | GoDaddy (bondzy.com) | Ask Lori |
| Google Places API | console.cloud.google.com (Bondzy project) | Google account |
| Marketing site | www.bondzy.com (Wix) | Wix/GoDaddy |
| Live app | app.bondzy.com | — |

### Environment Variables

Set Vite variables in `.env.local` for local dev and in Vercel for production. Only variables prefixed with `VITE_` belong here, because they are visible in browser JavaScript.

| Variable | Where to find it |
|----------|-----------------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API Keys |
| `VITE_GOOGLE_PLACES_KEY` | Google Cloud → Credentials |

Set server-only secrets in Supabase Edge Function secrets, not in Vercel and not with a `VITE_` prefix:

| Secret | Where to find it |
|----------|-----------------|
| `BREVO_API_KEY` | Brevo -> Settings -> SMTP & API -> API keys & MCP tab. Must start with `xkeysib-`; do not use an SMTP key that starts with `xsmtpsib-`. |
| `BONDZY_API_KEY` | Internal shared secret for the `create-bondzy` API. This is a random shared password, not a Google, Brevo, or Supabase key. |

### Deploy Workflow

```
git add .
git commit -m "Description of what changed"
git push
```

Vercel auto-deploys within ~60 seconds. Test locally first with `npm run dev`.

Database migrations are separate from Git/Vercel deploys. Apply pending Supabase migrations from the repo root:

```powershell
npx supabase db push
```

Migration filename versions must be unique. The Supabase CLI treats the prefix before the first underscore as the version, so avoid multiple files like `20260510_*.sql`; use a more specific same-day prefix such as `202605100001_*.sql`.

Supabase Edge Functions are deployed separately:

```powershell
supabase functions deploy create-bondzy-self --no-verify-jwt
supabase functions deploy create-bondzy --no-verify-jwt
supabase functions deploy send-email --no-verify-jwt
supabase functions deploy redeem-bondzy --no-verify-jwt
```

When email icon assets change, deploy the frontend first so `https://app.bondzy.com/email-icons/*.png` exists, then deploy the Edge Functions that reference those assets.

### Database Schema

**profiles** table:
- `id` (uuid, references auth.users)
- `email` (text, unique)
- `name` (text)
- `created_at` (timestamp)

**bondzies** table:
- `id` (uuid, auto-generated)
- `type` ("reward" or "promise")
- `status` ("active", "redeemed", "forfeit")
- `creator_id` (uuid, references profiles)
- `recipient_email` (text)
- `recipient_id` (uuid, nullable — linked when recipient signs up)
- `recipient_name` (text)
- `location_name`, `location_address`, `location_lat`, `location_lng`
- `date`, `time`, `grace_minutes` (default 10)
- `reward_link`, `reward_description`
- `created_at`, `redeemed_at` (nullable)

**bondzy_claims** table:
- `bondzy_id` (uuid, references `bondzies.id`)
- `claim_token` (uuid, unique private shared-link token)
- `created_at` (timestamp)

### Data API Grants

Bondzy uses Supabase's Data API through both the browser client and Edge Functions. Grants are now explicit in `supabase/migrations/20260517_explicit_data_api_grants.sql`:

- `authenticated` can access the app-facing `bondzies` and `profiles` tables, with RLS deciding which rows are visible.
- `anon` is blocked from application tables; public claim links go through Edge Functions.
- `service_role` can access internal tables/functions used by Edge Functions and maintenance scripts.
- Internal tables such as `bondzy_secrets`, `bondzy_claims`, and `rate_limit_hits` stay hidden from `anon` and `authenticated`.

When adding a new table or RPC function in `public`, add the matching `GRANT`/`REVOKE` statements in the same migration. RLS is not a replacement for Data API grants; the grant controls whether the API can reach the object at all.

---

## Costs at Scale

| Service | Free Tier | When You'd Pay |
|---------|-----------|---------------|
| Vercel | 100GB bandwidth/mo | Unlikely to hit soon |
| Supabase | 500MB DB, 50K auth users | Very generous for beta |
| Brevo | 300 emails/day | ~150 Bondzies/day (2 emails each) |
| Google Places | $200/mo free credits | ~10,000+ searches/month |

**Bottom line:** You can run Bondzy for free through beta and well into early growth.
