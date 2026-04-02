# Bondzy - Next Steps
**Post-MVP Roadmap**

---

## Immediate Next Steps (This Week)

### 1. Domain Setup ⭐ HIGH PRIORITY
**Goal:** Move from bondzy.vercel.app to bondzy.com

**Steps:**
1. Log into GoDaddy/Wix account
2. Go to DNS settings for bondzy.com
3. Add Vercel nameservers OR CNAME record
4. In Vercel dashboard → Settings → Domains → Add bondzy.com
5. Wait for DNS propagation (24-48 hours max)
6. Update all email templates to use bondzy.com links

**Why important:** Professional appearance, brand recognition, SEO

**Complexity:** Low (30 minutes of work, mostly waiting)

---

### 2. Auto-Forfeit Backend Job ⭐ HIGH PRIORITY
**Goal:** Automatically mark expired Bondzies as "forfeit"

**Current state:** UI shows "expired" but database status stays "active"

**Solution:** Supabase cron job (pg_cron extension)

**Implementation:**
```sql
-- Run every 1-2 minutes
SELECT cron.schedule(
  'auto-forfeit-bondzies',
  '*/2 * * * *',  -- Every 2 minutes
  $$
  UPDATE bondzies 
  SET status = 'forfeit', 
      updated_at = NOW()
  WHERE status = 'active' 
    AND (date + time + INTERVAL '1 minute' * grace_minutes) < NOW()
  $$
);
```

**Why important:** Data integrity, analytics accuracy, user trust

**Complexity:** Low (15 minutes to implement, test, deploy)

**Granularity decision:** 
- Every 2 minutes = Good balance
- Every 30 seconds = More precise but higher database load
- Every 5 minutes = Less load but less precise

**Recommendation:** Start with 2 minutes, monitor performance

---

### 3. Creator Confirmation Emails ⭐ MEDIUM PRIORITY
**Goal:** Send emails to creators when Bondzy is posted and when it's claimed

**Two emails needed:**

**A) Creation Confirmation:**
- Subject: "✅ Your Bondzy is posted!"
- Body: Summary of what they created, link to view
- Send immediately after creation

**B) Redemption Notification:**
- Subject: "🎉 [Recipient] claimed your Bondzy!"
- Body: Who claimed it, when, reward details
- Send immediately after redemption

**Implementation:**
- Copy existing recipient email code
- Change recipient to creator
- Adjust messaging

**Why important:** Creator engagement, peace of mind, retention

**Complexity:** Low (20 minutes - duplicate existing email code)

---

## Short-Term Improvements (Next 2-4 Weeks)

### 4. Promise Bondzies 🔄 MAJOR FEATURE
**Goal:** Creator commits to showing up by staking a reward

**Flow:**
1. Creator sets location, time, and reward they'll forfeit
2. Creator names recipient (who gets reward if creator no-shows)
3. Creator must verify GPS during window
4. If creator no-shows → recipient gets reward automatically
5. If creator shows → Bondzy marked complete, no transfer

**New fields needed:**
- Already have `type: 'reward' | 'promise'` field
- May need `promised_at` timestamp
- `completion_verified_at` timestamp

**Why important:** This is the other half of the value prop - makes commitments credible

**Complexity:** Medium (2-3 days - new UI flow, different logic, testing)

---

### 5. UI Polish & Cosmetic Improvements 🎨
**Ideas:**
- Better empty states (when no Bondzies exist)
- More celebration animations on redemption
- Smoother transitions between states
- Loading skeletons instead of spinners
- Better error messages
- Help tooltips
- Onboarding flow for first-time users

**Why important:** Professional polish, reduces confusion, increases delight

**Complexity:** Low-Medium (can be done incrementally)

---

### 6. Analytics Dashboard 📊
**Goal:** Track key metrics

**Metrics to track:**
- Redemption rate (% of Bondzies claimed)
- Average time-to-claim
- Forfeit rate
- Creator retention (repeat usage)
- Email open rates
- GPS accuracy distribution
- Most popular locations
- Peak usage times

**Implementation:**
- Add event tracking (custom or PostHog)
- Simple admin dashboard
- Weekly email digest

**Why important:** Data-driven decisions, investor updates, optimization

**Complexity:** Medium (requires analytics setup)

---

### 7. Mobile PWA Features 📱
**Goal:** Make it feel like a native app on mobile

**Features:**
- Add-to-home-screen prompt
- Offline support for viewing existing Bondzies
- Push notifications (via service workers)
- Haptic feedback on redemption
- Native share sheet integration

**Why important:** 80% of users will be on mobile

**Complexity:** Medium (PWA manifest + service worker)

---

## Medium-Term Features (1-3 Months)

### 8. Social Sharing
- "I just claimed a Bondzy!" auto-posts
- Share Bondzy creation to social media
- Referral links with tracking
- Public Bondzy feed (opt-in)

### 9. Calendar Integration
- Add to Google Calendar button
- iCal export
- Sync with Outlook
- Calendar view in dashboard

### 10. Team/Group Bondzies
- Multiple recipients for same Bondzy
- First person to arrive wins
- Or: All must arrive within window

### 11. Integrated Gift Cards
- Partner with Square, Shopify
- Buy gift cards directly in Bondzy
- Take 2-5% transaction fee

### 12. Enhanced Location Features
- Save favorite locations
- Recent locations list
- Popular Bondzy spots
- Map view of all active Bondzies

---

## Long-Term Vision (3-6+ Months)

### 13. Promise Bondzies 2.0
- Recurring Bondzies (weekly meetups)
- Bondzy chains (series of commitments)
- Bondzy groups (friend circles)

### 14. Enterprise Features
- Company admin dashboard
- Team check-in tracking
- Custom branding
- SSO integration
- Bulk Bondzy creation

### 15. Platform & API
- Public API for third parties
- Zapier integration
- Slack bot
- Discord bot
- iOS/Android native apps

### 16. Marketplace
- Public Bondzy marketplace
- Sponsored Bondzies (brands pay for attendance)
- Retail foot traffic driving
- Event promotion

---

## Technical Debt & Maintenance

### Code Quality
- Split App.jsx into separate components
- Add TypeScript
- Unit tests for critical functions
- E2E tests with Playwright
- Performance monitoring

### Infrastructure
- Database backups
- Error tracking (Sentry)
- Uptime monitoring
- CDN for static assets
- Rate limiting

### Security
- Security audit
- Penetration testing
- GDPR compliance
- Privacy policy
- Terms of service

---

## Resource Requirements

### Time Estimates (Solo Developer)

**This Week:**
- Domain setup: 30 min
- Auto-forfeit: 30 min
- Creator emails: 1 hour
**Total: 2 hours**

**Next 2 Weeks:**
- Promise Bondzies: 2-3 days
- UI polish: 1-2 days
- Analytics: 1 day
**Total: 4-6 days**

**Next Month:**
- PWA features: 2-3 days
- Social sharing: 1-2 days
- Calendar integration: 2-3 days
**Total: 5-8 days**

### Budget (if hiring)

**Contract Developer:**
- $50-100/hour
- Promise Bondzies: $2,000-4,000
- Full Phase 2: $10,000-15,000

**Marketing:**
- Domain/hosting: $100/year
- Email service: $0-50/month
- Paid ads: $500-2,000/month
- Content creation: $1,000/month

---

## Priority Matrix

### High Impact + Low Effort (DO FIRST)
- ✅ Domain setup
- ✅ Auto-forfeit job
- ✅ Creator emails

### High Impact + Medium Effort (DO SOON)
- Promise Bondzies
- Analytics dashboard
- Mobile PWA

### Low Impact + Low Effort (QUICK WINS)
- UI polish
- Error messages
- Help tooltips

### Low Impact + High Effort (SKIP FOR NOW)
- Native apps
- Complex integrations
- Enterprise features

---

## Success Metrics (3-Month Goals)

### User Engagement
- 100 active users
- 50% redemption rate
- 30% creator retention (post second Bondzy)
- <10% forfeit rate

### Technical Performance
- <1s page load
- <5s GPS verification
- 99.9% uptime
- <1% error rate

### Business Metrics
- 10 paying users (if freemium)
- 1 B2B pilot customer
- 500 Bondzies created
- 2,000 email opens

---

## Decision Points

### When to hire?
- When revenue > $2,000/month OR
- When user growth > 50%/month OR
- When you're spending >20 hours/week on support

### When to raise funding?
- Product-market fit validated (40%+ redemption rate sustained)
- 1,000+ active users
- Clear path to $1M ARR
- Defensible moat (network effects kicking in)

### When to pivot?
- <20% redemption rate after 3 months
- <10% creator retention
- High forfeit rate (>30%)
- No growth despite marketing

---

## Questions to Answer

1. **Granularity of auto-forfeit cron:** Every 30 seconds? 2 minutes? 5 minutes?
   - Recommendation: Start with 2 minutes, can always increase frequency

2. **Freemium limits:** How many free Bondzies per month?
   - Recommendation: 5 free, $5/mo for unlimited

3. **Gift card integration:** Build or partner?
   - Recommendation: Partner (Square/Shopify) - don't reinvent payments

4. **Mobile app:** React Native or separate native?
   - Recommendation: PWA first, native only if traction

5. **Social features:** Public feed?
   - Recommendation: Opt-in only, privacy-first

---

## Risks to Monitor

### Product Risks
- Redemption rate dropping
- Creator churn increasing
- Forfeit rate rising
- Email open rate declining

### Technical Risks
- GPS accuracy issues
- Email deliverability problems
- Database performance degradation
- API rate limits hit

### Business Risks
- Slow user growth
- High CAC
- Low LTV
- Competitor emergence

---

## Conclusion

**You've built an MVP that works!** 🎉

The foundation is solid. Now it's about:
1. **Polish** - Make it feel professional (domain, emails, UI)
2. **Complete** - Add Promise Bondzies (the other half)
3. **Scale** - Get users, measure, iterate

**Next action:** Domain setup + auto-forfeit + creator emails = 2 hours of work, massive impact.

**You're on the right track, Rob!** 🚀

---

**Last Updated:** February 15, 2026
