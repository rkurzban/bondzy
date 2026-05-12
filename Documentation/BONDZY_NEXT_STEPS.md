# Bondzy - Next Steps
**Post-MVP Roadmap** | Updated May 12, 2026

---

## Recently Completed ✅

- **Promise Bondzies** — fully implemented (creator commits, recipient notified on forfeit)
- **Auto-forfeit cron job** — Supabase pg_cron runs every 5 minutes
- **Creator emails** — confirmation on creation + notification on redemption/check-in
- **Custom domain** — live at app.bondzy.com
- **Email deep links** — "Open Bondzy" goes to `app.bondzy.com?claim=<token>`, not homepage
- **Programmatic creation** — `scripts/create-bondzy.js` for creating Bondzies via CLI
- **Auth stability** — tab-switch and token refresh no longer kick users off the create screen
- **Location display** — deduplicated when address starts with location name
- **Phase 2 claim tokens** — shared links now use private `?claim=` tokens instead of public database ids
- **Rate limiting** — all edge functions (`create-bondzy`, `create-bondzy-self`, `claim-bondzy`, `redeem-bondzy`, `send-email`) gated by per-key hourly limits (May 11, 2026)
- **PWA add-to-home-screen** — `public/manifest.json` + theme/apple meta tags in `index.html`; users can install Bondzy as a standalone app on iOS and Android (May 12, 2026)
- **Error tracking scaffold** — Sentry SDK and `ErrorBoundary` wired into `src/main.jsx`; opt-in via `VITE_SENTRY_DSN` env var, tree-shaken to near-zero when unset (May 12, 2026)
- **Leaf-component extraction** — `Header`, `AuthForm`, `Help`, `Profile`, `Ic`, `BondzyMark`, and the `B` color palette moved out of `App.jsx` into dedicated files; `App.jsx` reduced from ~1,135 to ~985 lines (May 12, 2026)

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
- ~~Add-to-home-screen manifest + prompt~~ ✅ Shipped May 12, 2026
- Push notifications (via service workers) — notify recipient when window opens
- Offline support for viewing existing Bondzies

**Complexity:** Medium (2-3 days for the remaining service-worker work)

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

- **Split App.jsx further** — leaf components extracted (May 12, 2026); `Dash`, `Create`, `Detail`, and the main `BondzyApp` state container still live in `App.jsx` (~985 lines)
- ~~**Add email/function rate limiting**~~ ✅ Done May 11, 2026
- **Add TypeScript** for safety as codebase grows
- ~~**Error tracking** — Sentry or similar~~ ✅ Scaffold in place (May 12, 2026); activate by setting `VITE_SENTRY_DSN` in Vercel
- ~~**Rate limiting** — prevent Bondzy spam~~ ✅ Done May 11, 2026
- **E2E tests** — Playwright for critical flows (create → notify → GPS → redeem)

---

## Deprioritized / Parked

- Native iOS/Android apps (PWA first)
- Enterprise SSO / white-label (wait for B2B traction)
- Integrated gift card marketplace (wait for volume)

---

**Last Updated:** May 12, 2026
