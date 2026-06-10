# AGENTS.md

Guidance for Codex (and other AGENTS.md-aware coding agents) when working in this repo. Mirrors `CLAUDE.md`.

## Commands

```bash
npm run dev        # Vite dev server (local)
npm run build      # Production build → dist/
npm run preview    # Preview the production build locally

# Deploy
git add .
git commit -m "..."
git push           # Vercel auto-deploys from main within ~60s

# Supabase DB + Edge Functions (run from repo root)
npx supabase db push                         # Apply pending DB migrations
npx supabase functions deploy send-bondzy-email
npx supabase secrets set BREVO_API_KEY=...      # one-time / on key rotation

# Programmatic Bondzy creation (uses service role key)
node scripts/create-bondzy.js
```

No test suite yet. No linter wired into CI.

## Project Overview

**Bondzy** is a web app that makes plans credible by combining **GPS verification** with **time-windowed rewards**. A creator posts a reward (or a promise) tied to a specific location + time; the recipient (or, for promises, the creator) must be within **100 m** during a **20-minute window** (10 min before to 10 min after the scheduled time) to claim. Unclaimed Bondzies auto-forfeit via a Supabase pg_cron job.

- **Live:** https://app.bondzy.com (custom domain on Vercel)
- **Repo:** github.com/rkurzban/bondzy
- **Status:** Post-MVP, in production, iterating based on real usage
- **Local checkout:** `C:\Users\rkurz\bondzy-project`

### Stack

| Layer | Tool |
|---|---|
| Frontend | React 18 SPA (Vite). ~1,250-line `src/App.jsx`. Client-side page state — no router library. |
| Auth + DB | Supabase (project ref `wbbkutufcmrxjdbmhgbv`). Magic-link email + Google OAuth. |
| Edge Functions | Supabase Edge Functions (Deno). Holds the Brevo API key — **never bundled into the browser**. |
| Email | Brevo transactional API. Sender: `info@bondzy.com`. |
| Maps / location search | Google Places Autocomplete + Geolocation API. |
| Hosting | Vercel — auto-deploys from `main` on push. |
| Scheduling | Supabase `pg_cron` — `forfeit-expired-bondzies` runs every 5 minutes. |

### Environment Variables

Both `.env.local` and Vercel project settings need:

| Variable | Source |
|---|---|
| `VITE_SUPABASE_URL` | `https://wbbkutufcmrxjdbmhgbv.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API Keys (publishable key) |
| `VITE_GOOGLE_PLACES_KEY` | Google Cloud → Credentials (Bondzy project) |

`BREVO_API_KEY` lives on the Supabase Edge Function side only — set via `npx supabase secrets set BREVO_API_KEY=...`. **Do not** add it to `.env.local` or Vercel as a `VITE_` variable; that exposes it to the browser.

## Current State

### Complete

- **Reward Bondzies** — creator posts a reward (gift card, treat, favor) tied to a location + time. Recipient gets an email with a private claim link (`app.bondzy.com?claim=<token>`). When the 20-minute window opens, GPS auto-checks proximity; if within 100 m, a "CLAIM YOUR REWARD!" button (gradient + pulse + confetti) reveals the reward link in one click.
- **Promise Bondzies** — creator commits to a location + time with a stated penalty they'll forfeit. The **creator** is the one who verifies GPS during the window. If they no-show, the recipient is emailed the penalty link. If they show, the Bondzy is marked complete and no transfer happens.
- **Auth** — Supabase magic-link email login + Google OAuth. Persistent sessions. Tab-switch / token refresh no longer interrupts in-flight flows (this had been a regression and was fixed).
- **Time window enforcement** — live per-second countdown with three states (Too Early / Active / Expired). 10-minute grace period baked into the window definition.
- **GPS verification** — auto-checks on window open. 100 m threshold. Distance-aware feedback. Handles denied / unsupported / permission-error states gracefully.
- **Auto-forfeit** — `forfeit_expired_bondzies()` SQL function + pg_cron job running every 5 min. Marks active Bondzies whose window has expired as `forfeit`.
- **Email notifications (Brevo)** — recipient on creation, creator confirmation, creator notified on recipient claim (reward) / check-in (promise), recipient notified on promise kept. **Reward Bondzy recipient email** uses a full-brand HTML template: navy hero with white gift circle, gold accent bar, table-based detail rows (for email-client compatibility), warm gold reward-row highlight, "Claim My Reward →" CTA.
- **Email iconography** — detail icons use hosted PNG assets in `public/email-icons/` so Gmail and other clients render them consistently instead of substituting random emoji glyphs.
- **All email headers** include the Bondzy logo mark + wordmark; consistent copy ("Show up on time for your appointment to claim your reward.").
- **Dashboard** — view created vs. received Bondzies, filter by status (active / redeemed / forfeit), copy-link-to-share, real-time status updates.
- **Programmatic creation** — `scripts/create-bondzy.js` creates Bondzies via the Supabase **service role key** (bypassing UI). Supports both reward and promise types, fires all standard emails. Used for manual/bulk creation.
- **Custom domain** — `app.bondzy.com` pointed at Vercel.

### In Progress / Planned (Phase 3 — Growth)

- Analytics dashboard (redemption rate, forfeit rate, creator retention).
- Mobile PWA (add-to-home-screen, push notifications).
- Social sharing ("I just claimed a Bondzy!").
- Calendar integration (add to Google Calendar).
- Group / multi-recipient Bondzies.
- **Option C** — webhook-based dynamic reward codes for B2B partners (design doc in `Documentation/OPTION_C_WEBHOOK_REWARDS.md`).

### Future (Phase 4 — Platform)

Public API · Zapier / Slack integrations · white-label for enterprise · native mobile apps.

## Architecture

### Frontend

`src/App.jsx` is a single ~1,250-line SPA — landing page, auth flow, create-Bondzy forms (reward + promise), recipient claim flow, creator check-in flow, dashboard, all navigation, all styling (inline + custom animation). State via `useState` / `useEffect` / `useMemo`. Routing is page-state (no router library); deep links from emails arrive as `?claim=<token>` and the app reads the query string on load.

This monolithic shape is the dominant piece of tech debt. Be careful with edits — search the file for the relevant feature label before refactoring; many handlers share state slices.

### Key Files

| File | Purpose |
|---|---|
| `src/App.jsx` | Whole app — see above. |
| `src/lib/supabase.js` (or equivalent) | Supabase client init from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. |
| `public/email-icons/` | Hosted PNG assets used in transactional email templates. Reference these by absolute URL in HTML email bodies. |
| `scripts/create-bondzy.js` | Node script for programmatic Bondzy creation. Uses **service role key** (not anon) — keep out of any browser bundle. |
| `supabase/functions/send-bondzy-email/index.ts` | Edge Function that calls Brevo. Reads `BREVO_API_KEY` from Supabase secrets. Triggered by a database webhook (`on_bondzy_created` trigger calling `pg_net.http_post`). |
| `supabase/migrations/` | SQL migrations including the bondzies table, RLS policies, `forfeit_expired_bondzies()`, the `can_read_bondzy_profile()` helper, the cron schedule. |

### Email Flow

1. Client INSERTs a row into `bondzies`.
2. `on_bondzy_created` trigger fires → calls `notify_bondzy_recipient()` → `pg_net.http_post` to the `send-bondzy-email` Edge Function.
3. The Edge Function reads `BREVO_API_KEY` from secrets and POSTs to Brevo's `/v3/smtp/email` endpoint.
4. Templated HTML with `public/email-icons/*.png` referenced by absolute URL goes out from `info@bondzy.com`.

**The trigger-based path is the source of truth.** Don't add a parallel client-side `fetch` to Brevo from `App.jsx` — that was an earlier prototype path and would re-expose the API key in the browser bundle.

### Auto-forfeit Flow

`pg_cron` runs `select public.forfeit_expired_bondzies()` every 5 minutes:

```sql
update public.bondzies
set status = 'forfeit'
where status = 'active'
  and (date + time + (grace_minutes || ' minutes')::interval) < now();
```

To verify the schedule is live:

```sql
select * from cron.job;
```

Should list `forfeit-expired-bondzies`.

## Database (Supabase)

### Tables

- **`profiles`** — extends `auth.users`. `id` (uuid, references auth.users), `email`, `name`, `created_at`.
- **`bondzies`** — `id`, `type` (`'reward'` | `'promise'`), `status` (`'active'` | `'redeemed'` | `'forfeit'`), `creator_id` / `creator_email` / `creator_name`, `recipient_email` / `recipient_name` / `recipient_id` (nullable; linked once recipient signs up), `location_name` / `location_address` / `location_lat` / `location_lng`, `date` / `time` / `grace_minutes` (default 10) / `timezone`, `reward_link` / `reward_description` (default `'Bondzy Reward'`), `created_at` / `updated_at` / `redeemed_at`.

### RLS

- RLS is enabled on every table.
- **`profiles` RLS uses a `can_read_bondzy_profile()` helper** so dashboard / profile lookups don't recursively break Bondzy visibility. Don't rewrite the profile SELECT policy as a bare `auth.uid()` join through bondzies — it'll deadlock the dashboard query.
- All client-side writes go through RLS-policed inserts; server-side writes (the Edge Function, the cron job, the `create-bondzy.js` script) use the **service role key** and bypass RLS by design.

### Data API Grants

- Bondzy uses Supabase's Data API through `supabase-js` in the browser and Edge Functions, so public-schema tables/functions must have explicit grants as Supabase phases out implicit public-schema exposure.
- `supabase/migrations/20260517_explicit_data_api_grants.sql` is the source of truth for Data API exposure. It grants authenticated access to `bondzies` and `profiles`, service-role access to internal tables/functions, and keeps `anon` blocked from app tables.
- Internal tables (`bondzy_secrets`, `bondzy_claims`, `rate_limit_hits`) should stay hidden from `anon` and `authenticated`; Edge Functions access them with the service-role key.
- Future migrations that add public tables/functions must include matching `GRANT`/`REVOKE` statements. RLS controls rows after a table is exposed; grants control whether the Data API can reach the table at all.

### Where Each Secret Lives

| Secret | Location | Used by |
|---|---|---|
| `VITE_SUPABASE_ANON_KEY` | `.env.local` + Vercel env | Browser |
| Supabase service role key | `.env.local` (for `scripts/create-bondzy.js`) | Node script only — never in browser |
| `BREVO_API_KEY` | Supabase Edge Function secrets | `send-bondzy-email` Edge Function only |
| `VITE_GOOGLE_PLACES_KEY` | `.env.local` + Vercel env | Browser (restrict by HTTP referrer in Google Cloud Console) |

## Known Gotchas

- **Brevo API key must stay server-side.** The Edge Function path is canonical; an older draft of the dev guide suggested calling Brevo directly from `App.jsx` as a "simpler approach." Don't. It re-exposes the key in the bundle.
- **`profiles` RLS recursion.** The `can_read_bondzy_profile()` helper exists specifically to prevent the dashboard's profile lookup from triggering a recursive policy evaluation against `bondzies`. Migrations that touch profile policies must preserve this helper.
- **The window is `[scheduled − 10 min, scheduled + 10 min]`.** Not `[scheduled, scheduled + 20 min]`. The 100 m radius and 20-minute span are deliberate — they're tight enough to be meaningful (you actually have to be there at the time) and loose enough to absorb GPS noise and reasonable lateness.
- **Auto-forfeit only marks `active → forfeit`.** It does not retroactively touch `redeemed` rows. If a redemption was racing the cron window, the redemption wins (`status` flips to `redeemed` before the cron next fires).
- **Deep links use `?claim=<token>`, not URL paths.** The app is a SPA with page-state routing; there's no React Router. Any new email type that needs a deep link should mirror this pattern, not introduce a new path-based one.
- **`scripts/create-bondzy.js` uses the service role key** to write directly to `bondzies`, bypassing RLS. The row insert still fires the `on_bondzy_created` trigger, so emails go out automatically. Don't reach for the script when the UI flow would work — keep it for bulk / manual creation.
- **Supabase migration versions must be unique.** The CLI uses the filename prefix before the first underscore as the migration version. Do not create multiple files named like `20260510_*.sql`; use a more specific prefix such as `202605100001_*.sql` for same-day follow-up migrations.
- **Data API grants are separate from RLS.** If a new table is created in `public`, add explicit grants for `authenticated` and/or `service_role` only if that role should reach it through Supabase REST/RPC. Do not rely on implicit grants.
- **Free-tier ceilings:** Brevo 300 emails/day, Supabase 500 MB DB / 50K auth users, Vercel 100 GB bandwidth/mo. The first one you'll bump into in growth is Brevo.
- **App.jsx is the monolith.** Splitting it is on the roadmap but hasn't happened yet. When making changes, prefer additive edits over restructuring unless a component split is the explicit task.

## Deployment Notes

- `git push` to `main` triggers Vercel auto-deploy. Production deploys complete in ~60s; you can watch logs in the Vercel dashboard.
- Edge Function changes require an explicit `npx supabase functions deploy <name>` — they're not deployed by the git push.
- Database migrations apply with `npx supabase db push` (or via the SQL editor in the Supabase dashboard for ad-hoc changes — the migration files are the source of truth, so anything done via the dashboard should be backfilled as a migration). This is separate from `git push`; GitHub/Vercel deploys do not apply Supabase migrations.
- DNS for `app.bondzy.com` lives at GoDaddy; Vercel issued the cert.

## Where Things Live (Operator Cheat Sheet)

| Thing | Where | Login |
|---|---|---|
| Source code | github.com/rkurzban/bondzy | GitHub |
| Hosting | vercel.com → bondzy | GitHub SSO |
| DB + Auth + Edge Functions | supabase.com → Bondzy project (`wbbkutufcmrxjdbmhgbv`) | GitHub SSO |
| Email sending | app.brevo.com | `rkurzban@gmail.com` |
| Domain | GoDaddy → `bondzy.com` | Ask Lori |
| Google Places API | console.cloud.google.com → Bondzy project | Google |
