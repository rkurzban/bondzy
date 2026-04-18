# Bondzy - Project Summary
**Making Commitments Believable Through Location & Time**

---

## Executive Summary

Bondzy is a web application that solves a fundamental problem in social coordination: **how do you make plans credible?** By combining **GPS verification** with **time-windowed rewards**, Bondzy creates a mechanism where commitments become trustworthy and showing up becomes rewarding.

**Current Status:** Live at app.bondzy.com — active users, real Bondzies being created
**Development Phase:** Post-MVP, iterating based on usage
**Technical Stack:** React + Supabase + Vercel

---

## The Problem

Traditional planning relies on trust and hope:
- "I'll be there at 3pm" → Maybe they will, maybe they won't
- "Let's meet for coffee" → Coordination via endless back-and-forth
- No mechanism to make commitments credible
- No reward for actually showing up

**Result:** Flaky plans, wasted time, erosion of trust in relationships.

---

## The Solution

### Reward Bondzies ✅ Implemented
**Concept:** Create a location-based reward that only becomes claimable when someone is in the right place at the right time.

**How it works:**
1. **Creator** posts a reward (gift card, treat, favor) tied to a specific location and time
2. **Recipient** receives email notification with a deep link to their specific Bondzy
3. **Time window opens** 10 minutes before scheduled time
4. **GPS auto-verifies** location when recipient opens the Bondzy
5. **One-click redemption** if they're within 100m during the 20-minute window
6. **Automatic forfeit** if window expires unclaimed

**The Mechanism:**
- Time window: 10 min before → 10 min after scheduled time (20 min total)
- GPS threshold: Must be within **100 meters**
- Live countdown: Creates urgency and excitement

### Promise Bondzies ✅ Implemented
**Concept:** Creator commits to being somewhere by staking a penalty they'll forfeit if they don't show.

**How it works:**
1. Creator sets location, time, and penalty they'll forfeit
2. Creator names recipient (who gets penalty if creator no-shows)
3. Creator must verify GPS during window
4. If creator no-shows → recipient is notified with penalty link
5. If creator shows → Bondzy marked complete, no transfer

---

## Technical Architecture

### Frontend
- **Framework:** React 18 (single-page application, ~1,250 lines)
- **Styling:** Inline styles + custom animations
- **State Management:** React hooks (useState, useEffect, useMemo)
- **Routing:** Client-side navigation (page state, no router library)

### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (magic link email + Google OAuth)
- **Auto-forfeit:** Supabase pg_cron job runs every 5 minutes

### Infrastructure
- **Hosting:** Vercel (auto-deploy from GitHub)
- **Email:** Brevo transactional email API (info@bondzy.com)
- **Maps:** Google Places API (location search + coordinates)
- **GPS:** Browser Geolocation API

### Data Model
```
bondzies table:
- id, created_at, updated_at
- type: 'reward' | 'promise'
- status: 'active' | 'redeemed' | 'forfeit'
- creator_id, creator_email, creator_name
- recipient_email, recipient_name, recipient_id
- location_name, location_address, location_lat, location_lng
- date, time, grace_minutes, timezone
- reward_link, reward_description
- redeemed_at
```

### Security
- Row Level Security (RLS) enabled on all tables
- Environment variables for all API keys
- HTTPS everywhere (Vercel + custom domain)

---

## Key Features (All Implemented)

### ✅ Time Window Enforcement
- Countdown timer updates live every second
- Three states: Too Early (locked), Active (claimable), Expired (forfeit)
- Grace period: 10 minutes built in

### ✅ Auto-GPS Verification
- Automatically checks location when window opens
- 100m proximity threshold
- Smart distance feedback
- Handles permissions gracefully (denied, unsupported, error states)

### ✅ One-Click Redemption
- When GPS confirms proximity → "CLAIM YOUR REWARD!" button appears
- Gradient background, pulsing animation, confetti
- Single click to redeem; reward link delivered immediately

### ✅ Email Notifications (via Brevo)
- Recipient email on creation: deep link to their specific Bondzy at `app.bondzy.com?bondzy=<id>`
- Creator confirmation email on creation
- Creator notified when recipient claims (reward) or checks in (promise)
- Recipient notified when creator keeps their promise
- **Reward Bondzy recipient email** uses a full-brand HTML template: navy hero with white gift circle, gold accent bar, structured detail rows (table-based for email compatibility), warm gold reward row highlight, and "Claim My Reward →" CTA
- All email headers include the Bondzy logo mark + wordmark
- Consistent copy: "Show up on time for your appointment to claim your reward."

### ✅ Promise Bondzies
- Creator commits to a location/time with a stated penalty
- Creator verifies GPS (not recipient)
- Forfeit flow: recipient notified with penalty link if creator no-shows

### ✅ Programmatic Bondzy Creation
- `scripts/create-bondzy.js`: Node.js script to create Bondzies via Supabase service role key
- Supports both reward and promise types
- Sends all standard emails
- Used for manual/bulk creation without going through the UI

### ✅ Dashboard & Management
- View created vs. received Bondzies
- Filter by status (active/redeemed/forfeit)
- Real-time status updates
- Copy link to share

### ✅ Authentication
- Magic link email login (no passwords)
- Google OAuth
- Persistent sessions
- Tab-switch / token refresh no longer interrupts active flows

---

## User Experience Flow

### Creating a Bondzy (Creator)
1. Click "Post Reward Bondzy" or "Post Promise Bondzy"
2. Enter recipient name & email
3. Search and select location (Google Places autocomplete)
4. Pick date & time
5. Add reward/penalty description (and optional link)
6. Review summary → Post
7. Both creator and recipient receive email immediately

### Claiming a Bondzy (Recipient — Reward)
1. Receive email with "Open Bondzy" button → lands on `app.bondzy.com?bondzy=<id>`
2. See countdown if early, or "Active!" if window is open
3. GPS auto-checks location when window opens
4. If within 100m: "CLAIM YOUR REWARD!" button appears with confetti
5. One click → Reward link revealed, creator notified

### Checking In (Creator — Promise)
1. Open Bondzy during time window at the committed location
2. GPS verifies creator is within 100m
3. One click → Promise kept, recipient notified

---

## Known Limitations / Tech Debt

- App.jsx is a single ~1,250-line file (no component splitting yet)
- Brevo API key is in client-side code (acceptable for current scale; should move to Edge Function before significant growth)
- No TypeScript, no automated tests
- No analytics / admin dashboard

---

## Infrastructure Costs (Current)

- **Supabase:** Free tier
- **Vercel:** Free tier
- **Brevo:** Free tier (300 emails/day)
- **Google Places:** ~$0.017 per autocomplete request
- **Total monthly:** ~$5-10

---

## Roadmap

### Phase 1: MVP ✅ Complete
- Reward Bondzies, GPS verification, email notifications, dashboard, auth

### Phase 2: Core Product ✅ Complete
- Promise Bondzies
- Auto-forfeit cron job
- Creator confirmation + redemption emails
- Custom domain (app.bondzy.com)
- Programmatic creation script
- Auth stability fixes (tab-switch, token refresh)
- Location display deduplication

### Phase 3: Growth (In Progress)
- ✅ Branding & email design — logo on all email headers and Bondzy detail view; richer Reward Bondzy recipient template; consistent copy
- Analytics dashboard (redemption rate, forfeit rate, creator retention)
- Mobile PWA (add-to-home-screen, push notifications)
- Social sharing ("I just claimed a Bondzy!")
- Calendar integration (add to Google Calendar)
- Group/multi-recipient Bondzies
- Option C: webhook-based dynamic reward codes for B2B partners

### Phase 4: Platform (Future)
- Public API
- Zapier / Slack integrations
- White-label for enterprise
- Native mobile apps

---

## Contact

**Rob Kurzban**
Product: https://app.bondzy.com
Repository: github.com/rkurzban/bondzy

---

**Last Updated:** April 18, 2026
**Version:** 2.1 (Post-MVP, live)
