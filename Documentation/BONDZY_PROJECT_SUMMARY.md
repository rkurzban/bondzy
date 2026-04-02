# Bondzy - Project Summary
**Making Commitments Believable Through Location & Time**

---

## Executive Summary

Bondzy is a web application that solves a fundamental problem in social coordination: **how do you make plans credible?** By combining **GPS verification** with **time-windowed rewards**, Bondzy creates a mechanism where commitments become trustworthy and showing up becomes rewarding.

**Current Status:** Fully functional MVP deployed at bondzy.vercel.app  
**Development Phase:** Ready for beta testing  
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

### Reward Bondzies (Current Implementation)
**Concept:** Create a location-based reward that only becomes claimable when someone is in the right place at the right time.

**How it works:**
1. **Creator** posts a reward (gift card, treat, favor) tied to a specific location and time
2. **Recipient** receives email notification with details
3. **Time window opens** 10 minutes before scheduled time
4. **GPS auto-verifies** location when recipient opens the Bondzy
5. **One-click redemption** if they're within 150m during the 20-minute window
6. **Automatic forfeit** if window expires unclaimed

**The Mechanism:**
- Time window: 10 min before → 10 min after scheduled time (20 min total)
- GPS threshold: Must be within 150 meters
- Grace period: Built-in 10-minute late buffer
- Live countdown: Creates urgency and excitement

### Promise Bondzies (Planned)
**Concept:** Creator commits to being somewhere by posting a reward they'll forfeit if they don't show.

**How it works:**
1. Creator stakes a reward on their own attendance
2. If creator no-shows, recipient automatically receives the reward
3. Creates skin-in-the-game credibility

---

## Technical Architecture

### Frontend
- **Framework:** React 18 (single-page application)
- **Styling:** Inline styles + custom animations
- **State Management:** React hooks (useState, useEffect, useMemo)
- **Routing:** Client-side navigation
- **Key Features:**
  - Live countdown timers (updates every second)
  - Auto-GPS verification on window open
  - Progressive enhancement (works on any device)
  - Responsive design (mobile-first)

### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (magic link email)
- **Real-time:** Supabase realtime subscriptions
- **File Storage:** N/A (links only, no uploads)

### Infrastructure
- **Hosting:** Vercel (auto-deploy from GitHub)
- **Email:** Brevo transactional email API
- **Maps:** Google Places API (location search)
- **GPS:** Browser Geolocation API

### Data Model
```
bondzies table:
- id, created_at, updated_at
- type: 'reward' | 'promise'
- status: 'active' | 'redeemed' | 'forfeit'
- creator_id, recipient_email, recipient_name
- location_name, location_address, location_lat, location_lng
- date, time, grace_minutes
- reward_link, reward_description
- redeemed_at
```

### Security
- Row Level Security (RLS) enabled on all tables
- Environment variables for API keys
- HTTPS everywhere
- No sensitive data in client code
- IP-unrestricted email API (allows Vercel deployment)

---

## Key Features (Implemented)

### ✅ Time Window Enforcement
- Countdown timer updates live every second
- Three states: Too Early (locked), Active (claimable), Expired (forfeit)
- Visual indicators (colors, icons, animations)
- Grace period notification ("You get 10 minutes late allowance")

### ✅ Auto-GPS Verification
- Automatically checks location when window opens
- No manual "verify" button needed
- Smart distance feedback: "You're roughly 450m away"
- GPS accuracy rating (High/Good/Moderate)
- Handles permissions gracefully

### ✅ One-Click Redemption
- When GPS confirms proximity → giant "CLAIM YOUR REWARD!" button appears
- Gradient background, pulsing animation, confetti
- Single click to redeem
- Immediate reward link delivery

### ✅ Email Notifications
- HTML-formatted emails via Brevo
- Includes all Bondzy details
- Mobile-responsive
- Sender: info@bondzy.com (verified)

### ✅ Dashboard & Management
- View created vs. received Bondzies
- Filter by status (active/redeemed/forfeit)
- Real-time updates when Bondzies are claimed
- Copy link to share

### ✅ Authentication
- Magic link email login (no passwords)
- Persistent sessions
- Secure token handling via Supabase

### ✅ Location Search
- Google Places autocomplete
- Worldwide coverage
- Saves full address + coordinates
- Field mask optimization for API efficiency

---

## User Experience Flow

### Creating a Bondzy (Creator)
1. Click "Post Reward Bondzy"
2. Enter recipient name & email
3. Search and select location (Google Places)
4. Pick date & time
5. Add reward link & description
6. Review summary → Post
7. Recipient receives email immediately

### Claiming a Bondzy (Recipient)
1. Receive email notification
2. Open Bondzy link
3. See countdown if early, or "Active!" if window is open
4. GPS auto-checks location when window opens
5. If close enough: Giant "CLAIM YOUR REWARD!" button appears with confetti
6. One click → Reward link revealed
7. Celebration animation 🎉

### Time States
- **Too Early:** 🔒 "Opens in 1h 23m 45s" (gray, locked)
- **Active:** ⏰ "Active! Closes in 8m 42s" (gold, pulsing)
- **Expired:** ⛔ "Window Closed" (red, final)

---

## Metrics & Success Criteria

### Current Performance
- Page load: <1 second
- GPS verification: 2-5 seconds
- Email delivery: Instant
- Mobile responsive: 100%

### Key Metrics to Track
- **Redemption rate:** % of active Bondzies claimed
- **On-time arrival:** % claimed within first 10 minutes
- **Forfeit rate:** % that expire unclaimed
- **Creator satisfaction:** Repeat usage
- **Email open rate:** Notification engagement

---

## Competitive Landscape

### Existing Solutions (and why they fail)
- **Calendar invites:** No enforcement, just reminders
- **Group chats:** Endless coordination, no commitment
- **Check-in apps:** Social media flex, not coordination
- **Shared calendars:** Visibility but no credibility

### Bondzy's Differentiation
- **Enforced commitment** via GPS + time windows
- **Reward mechanism** makes showing up valuable
- **Zero friction** - no app download, works in browser
- **Trust through technology** rather than social pressure

---

## Business Model (Potential)

### Revenue Streams
1. **Freemium:** 
   - Free: 5 Bondzies/month
   - Pro: Unlimited for $5/month
   
2. **B2B:**
   - Team coordination for remote companies
   - Event check-in for conferences
   - Retail: Drive foot traffic with location-based offers

3. **Transaction Fee:**
   - Take 2-5% of reward value for integrated gift card purchases
   - Partner with Square, Shopify, etc.

### Unit Economics
- **Cost per user:** ~$0.01 (email + GPS + database)
- **LTV:** $60/year (assuming $5/mo Pro conversion)
- **CAC:** TBD (organic growth initially)

---

## Roadmap

### Phase 1: MVP ✅ (COMPLETE)
- Reward Bondzies
- Time windows + GPS verification
- Email notifications
- Dashboard & auth

### Phase 2: Polish & Scale (Next 4-6 weeks)
- Promise Bondzies (creator commits)
- Auto-forfeit backend job (cron)
- Domain migration (bondzy.com)
- Creator confirmation emails
- Analytics dashboard
- Mobile PWA optimization

### Phase 3: Growth (2-3 months)
- Social sharing features
- Team/group Bondzies
- Integrated gift card marketplace
- Calendar integrations
- Mobile app (React Native)

### Phase 4: Platform (6+ months)
- Public API
- Third-party integrations
- White-label for enterprise
- International expansion

---

## Technical Challenges Solved

1. **Time Window Precision**
   - Live countdown with second-by-second updates
   - Client-side time calculation (no polling)
   - Handles timezone differences

2. **GPS Accuracy**
   - Distance calculation via Haversine formula
   - Accuracy rating based on device capability
   - "Roughly" language to manage expectations
   - 150m threshold balances precision vs. usability

3. **Email Deliverability**
   - Sender domain verification (info@bondzy.com)
   - IP restriction removal for Vercel deployment
   - HTML responsive templates
   - Transactional API (Brevo) for reliability

4. **State Management**
   - GPS verification resets on navigation (prevents gaming)
   - Live updates when Bondzies are claimed
   - Optimistic UI with error recovery

5. **Environment Variables**
   - Proper VITE_ prefix for client-side access
   - Separate local vs. production configs
   - Secure key rotation workflow

---

## Team & Resources

### Development
- **Current:** 1 developer (Rob Kurzban) + AI assistance (Claude)
- **Time invested:** ~3 weeks
- **Code base:** ~800 lines (single React component)

### Infrastructure Costs
- **Supabase:** Free tier (sufficient for beta)
- **Vercel:** Free tier (auto-deploy from GitHub)
- **Brevo:** Free tier (300 emails/day)
- **Google Places:** $0.017 per autocomplete request
- **Total monthly:** ~$5-10 during beta

### Domain
- **bondzy.com:** Registered via GoDaddy/Wix
- **Current:** Deployed on bondzy.vercel.app
- **Next step:** Point domain to Vercel

---

## Risk Analysis

### Technical Risks
- **GPS inaccuracy:** Mitigated by 150m threshold + accuracy display
- **Email deliverability:** Using transactional provider (Brevo) with verified domain
- **Scale:** Supabase handles 50k+ users on free tier
- **Browser compatibility:** Using standard APIs (98% coverage)

### Product Risks
- **User adoption:** Requires both creator and recipient engagement
- **Gaming the system:** GPS reset on navigation, time window enforcement
- **Spam/abuse:** Rate limiting planned, manual review for beta

### Business Risks
- **Network effects:** Value increases with more users (mitigated by B2B pivot option)
- **Competition:** First-mover advantage in this specific niche
- **Regulation:** No payment processing initially (links only)

---

## Why Bondzy Will Win

### 1. **Real Pain Point**
Everyone has experienced flaky plans. This is universal.

### 2. **Simple Mechanism**
GPS + Time = Credibility. Easy to understand, hard to game.

### 3. **Low Friction**
No app download. Works in browser. Magic link login.

### 4. **Immediate Value**
First Bondzy demonstrates value. No onboarding needed.

### 5. **Network Effects**
Each successful Bondzy teaches two people the system.

### 6. **Multiple Use Cases**
Social plans, business meetings, retail promotions, event check-ins.

---

## Current Status & Next Actions

### What Works Today
✅ Full redemption flow (create → notify → countdown → GPS → redeem)  
✅ Email notifications with HTML templates  
✅ Time window enforcement with live countdowns  
✅ Auto-GPS verification  
✅ Dashboard with filtering  
✅ Magic link authentication  
✅ Responsive design  

### What's Next (Priority Order)
1. **Domain setup:** Point bondzy.com to Vercel
2. **Auto-forfeit:** Supabase cron job to mark expired Bondzies
3. **Creator emails:** Confirmation when Bondzy is posted + when claimed
4. **Promise Bondzies:** Full implementation
5. **Analytics:** Track redemption rates, time-to-claim, etc.
6. **Mobile polish:** PWA features, add-to-home-screen
7. **Social sharing:** "I just claimed a Bondzy!" posts

### Ready for Beta Testing
The app is functionally complete and ready for real-world testing with a small group of users.

---

## Investment Ask (If Applicable)

### Seed Round: $100K-250K
**Use of funds:**
- $80K: Full-time development (6 months)
- $40K: Marketing & user acquisition
- $20K: Infrastructure & tools
- $30K: Legal & incorporation
- $30K: Contingency

**Milestones:**
- Month 1-2: Promise Bondzies + auto-forfeit + domain setup
- Month 3-4: Beta testing with 100 users
- Month 5-6: Public launch, analytics, social features
- Month 6: 1,000 active users, Product-market fit validation

**Returns:**
- Acquihire opportunity (team + tech)
- Strategic acquisition (location/coordination space)
- Series A potential ($2-5M at $10-20M valuation)

---

## Contact

**Rob Kurzban**  
Email: rob@bondzy.com  
Product: https://bondzy.vercel.app  
Repository: github.com/rkurzban/bondzy-project

---

## Appendix: Technical Specs

### API Dependencies
- Supabase (PostgreSQL + Auth + Realtime)
- Brevo (Email delivery)
- Google Places (Location search)
- Browser Geolocation (GPS verification)

### Performance Targets
- Time to interactive: <1.5s
- GPS verification: <5s
- Email delivery: <10s
- Database query: <100ms

### Browser Support
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+
- Mobile: iOS 14+, Android 10+

### Deployment
- Auto-deploy on `git push` to main branch
- Environment variables managed in Vercel dashboard
- Zero-downtime deployments
- Instant rollback capability

---

**Last Updated:** February 15, 2026  
**Version:** 1.0 (MVP Complete)
