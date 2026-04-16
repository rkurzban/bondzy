# Bondzy - Next Steps
**Post-MVP Roadmap** | Updated April 16, 2026

---

## Recently Completed ✅

- **Promise Bondzies** — fully implemented (creator commits, recipient notified on forfeit)
- **Auto-forfeit cron job** — Supabase pg_cron runs every 5 minutes
- **Creator emails** — confirmation on creation + notification on redemption/check-in
- **Custom domain** — live at app.bondzy.com
- **Email deep links** — "Open Bondzy" goes to `app.bondzy.com?bondzy=<id>`, not homepage
- **Programmatic creation** — `scripts/create-bondzy.js` for creating Bondzies via CLI
- **Auth stability** — tab-switch and token refresh no longer kick users off the create screen
- **Location display** — deduplicated when address starts with location name

---

## Immediate Next Steps

### 1. Analytics Dashboard ⭐ HIGH PRIORITY
**Goal:** Understand how the product is actually being used

**Key metrics:**
- Redemption rate (% of active Bondzies claimed)
- Forfeit rate (% expired unclaimed)
- Creator retention (% who create a second Bondzy)
- Email open rates

**Options:**
- Lightweight: query Supabase directly, build a simple `/admin` page
- Full: PostHog or Mixpanel (free tiers available)

**Complexity:** Low-Medium (1-2 days)

---

### 2. Mobile PWA ⭐ HIGH PRIORITY
**Goal:** Make it feel native on mobile (where 80%+ of GPS verification happens)

**Features:**
- Add-to-home-screen manifest + prompt
- Push notifications (via service workers) — notify recipient when window opens
- Offline support for viewing existing Bondzies

**Complexity:** Medium (2-3 days)

---

### 3. Option C: Webhook-Based Rewards (B2B)
**Goal:** Enable businesses to issue unique, single-use reward codes at redemption time

**How it works:**
- Creator stores a `webhook_url` instead of a static reward link
- On redemption, Bondzy POSTs to the webhook with bondzy details
- Business API responds with a fresh, unique code
- Code only exists when actually redeemed — no sharing/reuse risk

**Target use case:** Pottery Spottery, gyms, coffee shops, retail — driving verified foot traffic

**See:** `Documentation/OPTION_C_WEBHOOK_REWARDS.md` for full spec

**Complexity:** Medium (2-3 days — schema change + redemption flow update)

---

### 4. Calendar Integration
**Goal:** Reduce no-shows by making Bondzies visible in calendars

**Features:**
- "Add to Google Calendar" button in email and on Bondzy detail page
- iCal (.ics) export

**Complexity:** Low (1 day)

---

## Medium-Term Features (1-3 Months)

### 5. Group / Multi-Recipient Bondzies
- Send one Bondzy to multiple people
- First person to arrive wins, OR all must arrive

### 6. Social Sharing
- "I just claimed a Bondzy!" auto-share
- Referral links with tracking
- Public opt-in Bondzy feed

### 7. Recurring Bondzies
- Weekly or monthly repeating commitments
- Useful for gym accountability, regular meetups

---

## Technical Debt (Address Before Scale)

- **Split App.jsx** into separate component files (currently ~1,250 lines)
- **Move Brevo API key** to a Supabase Edge Function (currently exposed client-side)
- **Add TypeScript** for safety as codebase grows
- **Error tracking** — Sentry or similar
- **Rate limiting** — prevent Bondzy spam
- **E2E tests** — Playwright for critical flows (create → notify → GPS → redeem)

---

## Deprioritized / Parked

- Native iOS/Android apps (PWA first)
- Enterprise SSO / white-label (wait for B2B traction)
- Integrated gift card marketplace (wait for volume)

---

**Last Updated:** April 16, 2026
