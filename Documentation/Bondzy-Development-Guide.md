# Bondzy Development Guide
## Where We Are and What's Next

*Last updated: February 20, 2026*

---

## What's Done ✅

| Feature | Notes |
|---------|-------|
| Deployment | React + Vite app on Vercel, GitHub at rkurzban/bondzy |
| Database & Auth | Supabase: magic link login, bondzies table, profiles, RLS policies |
| Google SSO | "Continue with Google" on the sign-in page |
| Google Places | Real Places Autocomplete API — any location worldwide |
| SMTP | Brevo connected to Supabase for auth emails (info@bondzy.com) |
| Email notifications | Brevo API called from the app on Bondzy creation and redemption |
| Creator confirmation email | Sent to creator when a Bondzy is created |
| Recipient redemption email | Sent to recipient when they successfully redeem |
| Creator redemption notification | Sent to creator when recipient redeems |
| Reward Bondzies | Full create → share → GPS verify → redeem flow |
| Promise Bondzies | Full create → share → GPS verify → fulfill flow (creator verifies their own location) |
| Auto-GPS & one-click redemption | Location check happens automatically; single tap to redeem |
| URL sharing / Copy Link | Each Bondzy has a shareable link; recipients don't need an account to view |
| app.bondzy.com | App now lives at app.bondzy.com, separate from the www.bondzy.com marketing site |
| www.bondzy.com footer link | Small tasteful link to the marketing site in the app footer |

---

## What's Left (In Priority Order)

---

### 1. Server-Side Forfeit Logic ⏰
**Status:** Partial. The app detects expired Bondzies on the client side (`isExpiredClient` in App.jsx) but does **not** update the database. A Bondzy that passes its time window stays `active` in Supabase until something triggers a status change.

**Why it matters:** Without this, expired Bondzies accumulate as "active" in the database. Reports, filters, and any future features that query status will be inaccurate.

**How to build it (Supabase Cron Job):**

1. Enable `pg_cron` in Supabase: Database → Extensions → search `pg_cron` → enable.

2. Run this SQL in the SQL Editor:

```sql
create or replace function public.forfeit_expired_bondzies()
returns void as $$
begin
  update public.bondzies
  set status = 'forfeit'
  where status = 'active'
  and (date + time + (grace_minutes || ' minutes')::interval) < now();
end;
$$ language plpgsql security definer;

select cron.schedule(
  'forfeit-expired-bondzies',
  '*/5 * * * *',
  'select public.forfeit_expired_bondzies()'
);
```

Every 5 minutes, Supabase marks expired Bondzies as forfeit. No external services needed.

**To verify:** Go to Supabase → SQL Editor and run:
```sql
select * from cron.job;
```

---

### 2. Domain Consolidation 🌐
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
| Brevo API key security | `VITE_BREVO_API_KEY` is browser-exposed. Fine for beta; move to a Supabase Edge Function before scaling |

---

### 4. Brevo API Key Security 🔒
**Status:** The Brevo API key (`VITE_BREVO_API_KEY`) is a Vite environment variable, which means it's bundled into the client-side JavaScript and visible to anyone who inspects the page source. This is acceptable for beta.

**When to fix it:** Once you have real volume or the key has meaningful sending limits you want to protect.

**How to fix it:** Move the Brevo calls into a Supabase Edge Function (same approach as the original Phase 3 design in the previous version of this doc). The React app calls the Edge Function; the Edge Function holds the secret key server-side.

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

Set in `.env.local` (local dev) and in Vercel (production):

| Variable | Where to find it |
|----------|-----------------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API Keys |
| `VITE_GOOGLE_PLACES_KEY` | Google Cloud → Credentials |
| `VITE_BREVO_API_KEY` | Brevo → Settings → SMTP & API → API keys tab |

### Deploy Workflow

```
git add .
git commit -m "Description of what changed"
git push
```

Vercel auto-deploys within ~60 seconds. Test locally first with `npm run dev`.

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

---

## Costs at Scale

| Service | Free Tier | When You'd Pay |
|---------|-----------|---------------|
| Vercel | 100GB bandwidth/mo | Unlikely to hit soon |
| Supabase | 500MB DB, 50K auth users | Very generous for beta |
| Brevo | 300 emails/day | ~150 Bondzies/day (2 emails each) |
| Google Places | $200/mo free credits | ~10,000+ searches/month |

**Bottom line:** You can run Bondzy for free through beta and well into early growth.
