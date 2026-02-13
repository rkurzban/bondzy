# Bondzy Development Guide
## Your Complete Roadmap from Here to Launch

*Last updated: February 13, 2026*

---

## What's Done ✅

| Phase | Status | What It Covers |
|-------|--------|---------------|
| Phase 1: Deployment | ✅ Complete | React app on Vercel, GitHub repo at rkurzban/bondzy |
| Phase 2: Database & Auth | ✅ Complete | Supabase with magic link login, Bondzies table, profiles, RLS policies |
| Phase 5: Google Places | ✅ Complete | Real Places Autocomplete API — any location worldwide |
| SMTP Fix | ✅ Complete | Brevo SMTP connected to Supabase for auth emails (info@bondzy.com) |

---

## What's Left (In Priority Order)

---

### Phase 3: Email Notifications 📧
**Why it matters:** This is the #1 missing piece. When you create a Bondzy, the recipient currently has no idea. They need an email.

**What to build:**
- When a Bondzy is created, send an email to the recipient saying "Someone buried a treasure for you!"
- Include: location, date/time, and a link to sign up / sign in at bondzy.vercel.app
- When a Bondzy is redeemed, optionally notify the creator

**How to build it (Supabase Edge Function + Brevo API):**

1. In Supabase, go to the SQL Editor and create a database webhook trigger:

```sql
-- This function fires whenever a new Bondzy is inserted
create or replace function public.notify_bondzy_recipient()
returns trigger as $$
begin
  -- Call the edge function via pg_net (Supabase's HTTP extension)
  perform net.http_post(
    url := 'https://wbbkutufcmrxjdbmhgbv.supabase.co/functions/v1/send-bondzy-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY'
    ),
    body := jsonb_build_object(
      'bondzy_id', new.id,
      'recipient_name', new.recipient_name,
      'recipient_email', new.recipient_email,
      'location_name', new.location_name,
      'date', new.date::text,
      'time', new.time::text,
      'reward_description', new.reward_description
    )
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_bondzy_created
  after insert on public.bondzies
  for each row execute procedure public.notify_bondzy_recipient();
```

2. Create a Supabase Edge Function. In your terminal:

```bash
npx supabase functions new send-bondzy-email
```

This creates a file at `supabase/functions/send-bondzy-email/index.ts`. The function calls Brevo's API:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')

serve(async (req) => {
  const { recipient_name, recipient_email, location_name, date, time, reward_description } = await req.json()
  
  const emailBody = `
    <h1>🎁 Someone buried a treasure for you!</h1>
    <p>Hi ${recipient_name}!</p>
    <p>Someone created a Bondzy reward for you. Here are the details:</p>
    <div style="background:#FFF8E7;padding:16px;border-radius:8px;margin:16px 0;">
      <p>📍 <strong>Go to:</strong> ${location_name}</p>
      <p>📅 <strong>When:</strong> ${date} at ${time}</p>
      <p>🎁 <strong>Reward:</strong> ${reward_description}</p>
    </div>
    <p>Show up at the right place and time, verify your GPS, and claim your reward!</p>
    <a href="https://bondzy.vercel.app" style="background:#D4A843;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px;">Open Bondzy</a>
  `

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Bondzy', email: 'info@bondzy.com' },
      to: [{ email: recipient_email, name: recipient_name }],
      subject: '🎁 Someone has a Reward Bondzy for you!',
      htmlContent: emailBody,
    }),
  })

  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
```

3. Deploy the function:
```bash
npx supabase functions deploy send-bondzy-email
```

4. Set the Brevo API key as a secret:
```bash
npx supabase secrets set BREVO_API_KEY=your-brevo-api-key-here
```

**Where to find your Brevo API key:** In Brevo, go to Settings → SMTP & API → click the "API keys & MCP" tab → copy your API key (or create a new one).

**Alternative simpler approach:** Instead of Edge Functions, you can call Brevo's API directly from your React app when creating a Bondzy. Add this to the `sub` function in App.jsx after the successful insert:

```javascript
// After successful Supabase insert, send notification email
await fetch('https://api.brevo.com/v3/smtp/email', {
  method: 'POST',
  headers: {
    'api-key': import.meta.env.VITE_BREVO_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sender: { name: 'Bondzy', email: 'info@bondzy.com' },
    to: [{ email: f.recipientEmail, name: f.recipientName }],
    subject: '🎁 Someone has a Reward Bondzy for you!',
    htmlContent: `<h1>A treasure awaits!</h1><p>Hi ${f.recipientName}! Go to ${f.locationName} on ${f.date} at ${f.time} to claim your reward.</p><a href="https://bondzy.vercel.app">Open Bondzy</a>`,
  }),
});
```

Note: The simpler approach exposes your Brevo API key in the browser. It's fine for beta/testing but the Edge Function approach is better for production.

---

### Phase 4: Forfeit Logic ⏰
**Why it matters:** Active Bondzies that pass their time window just sit there forever. They need to auto-forfeit.

**How to build it (Supabase Cron Job — no Zapier needed!):**

1. Enable the `pg_cron` extension in Supabase: Go to Database → Extensions → search for `pg_cron` → enable it.

2. Run this SQL in the SQL Editor:

```sql
-- Create a function that forfeits expired Bondzies
create or replace function public.forfeit_expired_bondzies()
returns void as $$
begin
  update public.bondzies
  set status = 'forfeit'
  where status = 'active'
  and (date + time + (grace_minutes || ' minutes')::interval) < now();
end;
$$ language plpgsql security definer;

-- Run every 5 minutes
select cron.schedule(
  'forfeit-expired-bondzies',
  '*/5 * * * *',
  'select public.forfeit_expired_bondzies()'
);
```

That's it. Every 5 minutes, Supabase checks for expired Bondzies and marks them as forfeit. No external services, no Zapier.

**To verify it's working:** Go to Supabase → SQL Editor and run:
```sql
select * from cron.job;
```
You should see your scheduled job listed.

---

### Phase 6: Migrate Wix Content & Connect Domain 🌐
**Why it matters:** Your Wix site has valuable content (About, Terms, Privacy, Success Stories) that needs to come over before you can point bondzy.com to Vercel.

**Steps:**

1. **Copy content from Wix:** Visit each page on your current bondzy.com and copy the text content. You can also use browser developer tools to grab images.

2. **Add pages to the React app:** We'll add a simple page routing system. Each page (About, Terms, Privacy, Success Stories) becomes a React component that renders the content.

3. **Add navigation links:** Update the landing page footer and header to link to these pages.

4. **Connect the domain:** Once all content is migrated:
   - Go to Vercel → bondzy project → Settings → Domains → Add `bondzy.com`
   - Vercel will show you DNS records to add
   - In GoDaddy (switch nameservers back to GoDaddy first), add those DNS records
   - Wait 5-60 minutes for DNS propagation
   - bondzy.com now shows your new app

---

### Phase 7: Polish & UX 💅
**Items from our backlog:**

- **Blank button fix:** The "Get Started" button goes blank after clicking. This is likely a CSS issue with the disabled state — add a style for `disabled` buttons.
- **Mobile responsiveness:** Test on phone-sized screens, fix any layout issues.
- **Smarter date/time picker:** Quick-pick buttons like "Tomorrow morning", "This Saturday", "Next week" — reduces mobile typing.
- **Reward link shortcuts:** Pre-fill buttons for "PayPal", "Venmo", "Amazon Gift Card".
- **Auto-populate recipient:** If recipient email matches an existing user, pre-fill their name.
- **Onboarding:** First-time user experience — maybe a quick tour or example Bondzy.

---

### Phase 8: Promise Bondzies 🤝
**Why it's easier than you think:** The database already supports it — we built a single `bondzies` table with a `type` field that can be "reward" or "promise".

**The difference:**
- **Reward Bondzy:** "I'll give you $25 if YOU show up at the gym."
- **Promise Bondzy:** "I'll pay you $25 if I DON'T show up at the gym."

**What to build:**
- A "Create Promise Bondzy" flow (very similar to Reward, just different labels)
- GPS verification checks the CREATOR's location instead of the recipient's
- If the creator doesn't show up → recipient gets the reward link
- If the creator does show up → Bondzy marked as fulfilled

Most of the UI and database logic is identical to Reward Bondzies. The main change is who does the GPS check.

---

## Your Infrastructure Cheat Sheet

### Where Things Live

| Thing | Location | Login |
|-------|----------|-------|
| Source code | github.com/rkurzban/bondzy | GitHub account |
| Local code | C:\Users\rkurz\bondzy-project | Your computer |
| Hosting | vercel.com (bondzy project) | GitHub SSO |
| Database & Auth | supabase.com (Bondzy project) | GitHub SSO |
| Email sending | app.brevo.com | rkurzban@gmail.com |
| Domain | GoDaddy (bondzy.com) | Ask Lori |
| Google Places API | console.cloud.google.com (Bonzy project) | Google account |
| Current live app | bondzy.vercel.app | — |
| Current Wix site | bondzy.com | Wix/GoDaddy |

### Environment Variables

These must be set in both `.env.local` (local dev) and Vercel (production):

| Variable | Value | Where to find it |
|----------|-------|-------------------|
| VITE_SUPABASE_URL | https://wbbkutufcmrxjdbmhgbv.supabase.co | Supabase → Settings → API |
| VITE_SUPABASE_ANON_KEY | (your publishable key) | Supabase → Settings → API Keys |
| VITE_GOOGLE_PLACES_KEY | AIzaSyBr8yzkxvXTr7cTMcPGgWHHz2qtP7Obe-Y | Google Cloud → Credentials |

### The Deploy Workflow

Every time you update code:

```
cd C:\Users\rkurz\bondzy-project
git add .
git commit -m "Description of what changed"
git push
```

Vercel auto-deploys within 60 seconds. To test locally first: `npm run dev`

### Database Schema

**profiles** table:
- id (uuid, references auth.users)
- email (text, unique)
- name (text)
- created_at (timestamp)

**bondzies** table:
- id (uuid, auto-generated)
- type ("reward" or "promise")
- status ("active", "redeemed", "forfeit")
- creator_id (uuid, references profiles)
- recipient_email (text)
- recipient_id (uuid, nullable — linked when recipient signs up)
- recipient_name (text)
- location_name, location_address, location_lat, location_lng
- date, time, grace_minutes (default 10)
- reward_link, reward_description (default "Bondzy Reward")
- created_at, redeemed_at (nullable)

### Key Supabase Features

- **SQL Editor:** Run queries, create functions, set up cron jobs
- **Authentication:** Manages magic link login, user sessions
- **Table Editor:** Browse your data visually
- **Edge Functions:** Serverless code (for email notifications)
- **Cron Jobs:** Scheduled tasks (for forfeit logic) — requires pg_cron extension

---

## Costs at Scale

| Service | Free Tier | When You'd Pay |
|---------|-----------|---------------|
| Vercel | 100GB bandwidth/mo | Unlikely to hit soon |
| Supabase | 500MB DB, 50K auth users | Very generous for beta |
| Brevo | 300 emails/day | ~300 Bondzies/day |
| Google Places | $200/mo free credits | ~10,000+ searches/month |

**Bottom line:** You can run Bondzy for free through beta and well into early growth.

---

## Quick Wins You Can Do Without Claude

1. **Test the full loop:** Create a Bondzy for a friend, have them sign up, go to the location, and redeem it.
2. **Check Supabase Table Editor:** See your real data — go to Table Editor → bondzies to see created Bondzies.
3. **Update text/copy:** Edit `src/App.jsx` directly — the landing page text, help FAQ, etc. are all readable strings.
4. **Add Brevo API key to Vercel:** If you set up email notifications, you'll need `VITE_BREVO_API_KEY` in Vercel's environment variables.
5. **Monitor usage:** Check Google Cloud Console for Places API usage, Brevo for email stats.
