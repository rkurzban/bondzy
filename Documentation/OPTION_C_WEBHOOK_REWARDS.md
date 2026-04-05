# Option C: Webhook-Issued Reward Codes

**The Dynamic Reward Architecture**

---

## The Problem Option C Solves

Right now, a reward code (e.g. `POTTERY20OFF`) is typed into the Bondzy at creation time and stored in the database. This works fine for one-offs, but it creates real problems at scale for a business like The Pottery Spottery:

- **Codes are burned at creation, not redemption.** If a customer never shows up, the code still exists in the database indefinitely, readable by anyone with access to that record.
- **No inventory control.** You can't issue unique, single-use codes per customer — you'd have to pre-generate a batch and manually assign them.
- **No integration with your systems.** When a code is redeemed on Bondzy, your own POS or booking system doesn't know about it. Staff have to manually cross-reference.
- **Codes can be guessed or shared.** A static code like `POTTERY20OFF` in a database record is a liability — it doesn't expire with the Bondzy, and a motivated person who sees it once can reuse it.

Option C solves all of this by keeping the business in control of code issuance.

---

## The Solution

Instead of storing the reward value at creation time, the Bondzy record stores a **webhook URL** — a callback address pointing to the business's own server.

The flow looks like this:

1. **Creation:** Business creates a Bondzy with `webhook_url: "https://api.thepotteryspottery.com/bondzy/redeemed"` instead of a static `reward_link`.
2. **Customer redeems:** Customer shows up, GPS is verified, Bondzy marks the record as redeemed.
3. **Webhook fires:** Immediately after marking redeemed, Bondzy's backend POSTs to the webhook URL with a payload like:
   ```json
   {
     "bondzy_id": "abc-123",
     "recipient_email": "jane@example.com",
     "recipient_name": "Jane",
     "redeemed_at": "2026-04-05T14:32:00Z",
     "location_name": "The Pottery Spottery"
   }
   ```
4. **Business server responds:** Your server looks up a fresh, unused code for this customer, marks it used in your database, and returns it:
   ```json
   { "reward_code": "JANE-X7K2-APRIL" }
   ```
5. **Code appears on screen:** Bondzy stores the returned code in `reward_link` and displays it in the animated live verification screen — the customer shows their phone to staff.

Because the code is only generated at the moment of verified redemption, it is unique, single-use, and fully traceable in your own system.

---

## What This Enables

- **Per-customer unique codes** — every redemption gets a fresh code, impossible to share or reuse
- **Real-time inventory deduction** — your system marks the code used the instant GPS confirms presence
- **CRM integration** — your webhook handler can also log the visit, update loyalty points, send a follow-up email, etc.
- **Expiry control** — you can issue codes that expire in 24 hours, tightly bound to the redemption event
- **Audit trail** — your server logs who redeemed what and when, independently of Bondzy's records

---

## The Lift

### Bondzy side (changes to this app)

1. **Database:** Add a `webhook_url` column to the `bondzies` table (nullable; presence indicates Option C mode).
2. **Edge Function / redemption logic:** After writing `status = 'redeemed'`, check if `webhook_url` is set. If so, POST to it, await the response, write the returned `reward_code` into `reward_link`. Add a timeout (e.g. 5 seconds) and a fallback message if the webhook doesn't respond.
3. **Create UI:** Add an optional "Reward webhook URL" field for business creators (can be hidden behind a toggle or a business account flag).

Estimated effort: **1 day.**

### Business side (changes to The Pottery Spottery / API caller)

1. **Webhook endpoint:** A single serverless function or route (e.g. on Vercel, Netlify, or your existing backend) that accepts a POST, generates or retrieves a code, and returns JSON.
2. **Code inventory:** A simple table with columns like `code`, `used`, `used_by`, `used_at`. Can be seeded with a batch of pre-generated codes, or codes can be generated on the fly (UUID-based).
3. **Security:** Verify the request is from Bondzy (a shared secret in the header, e.g. `X-Bondzy-Secret: <your-key>`).

A minimal webhook handler is about 30–40 lines of code. If you already have a backend, this is an afternoon of work. If you need to stand up a new serverless function, add a few hours for setup.

Estimated effort: **half a day to one day**, depending on existing infrastructure.

---

## When to Build It

Option C is worth building when:

- You're issuing Bondzies at volume (10+ per week) and managing codes manually feels painful
- You need unique per-redemption codes for audit or fraud-prevention reasons
- You want redemptions to automatically trigger actions in another system (CRM, loyalty, POS)

For early-stage use, Option A (static code, animated screen) is entirely sufficient. The animated screen already prevents casual screenshot fraud. Option C adds the deeper integration layer once the business case is proven.

---

## Summary

| | Option A (current) | Option C (webhook) |
|---|---|---|
| Code set at | Creation | Redemption |
| Code reuse risk | Possible | None (single-use) |
| Per-customer uniqueness | No | Yes |
| Business system integration | None | Full |
| Staff verification | Animated screen | Animated screen + code traces back to their system |
| Build effort | Done | ~2 days total |

---

*Last updated: April 2026*
