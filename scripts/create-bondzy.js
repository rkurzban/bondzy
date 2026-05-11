/**
 * create-bondzy.js
 * Generic script to create a Bondzy via the Bondzy API.
 *
 * HOW TO CUSTOMIZE:
 *   1. Set the environment variables below (or export them in your shell).
 *   2. Edit the BONDZY CONFIG section — fill in type, recipient, location, date/time, and penalty/reward.
 *   3. Run:  node scripts/create-bondzy.js
 *
 * PREREQUISITES:
 *   - Node 18+ (uses built-in fetch)
 *   - BONDZY_API_KEY — your API key for the Bondzy service
 *   - SUPABASE_URL   — your Supabase project URL (e.g. https://xxxxxxxxxxxx.supabase.co)
 *   - CREATOR_EMAIL  — email of the Bondzy account that will own this Bondzy
 */

// ─── ENVIRONMENT VARIABLES ────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const BONDZY_API_KEY = process.env.BONDZY_API_KEY;
const CREATOR_EMAIL = process.env.CREATOR_EMAIL;

// ─── BONDZY CONFIG ────────────────────────────────────────────────────────────

const BONDZY = {
  // "promise" = creator must show up (recipient gets notified if they don't)
  // "reward"  = recipient must show up to claim something
  type: "promise",

  // Who is this Bondzy for?
  recipientName: "Rob Kurzban",
  recipientEmail: "rkurzban@gmail.com",

  // Where?
  locationName: "The Pottery Spottery",
  locationAddress: "123 Clay St, Chicago, IL 60601",
  locationLat: 41.8827,
  locationLng: -87.6233,

  // When? (YYYY-MM-DD and HH:MM in 24-hour format)
  date: "2026-04-25",
  time: "14:00",
  gracePeriodMinutes: 10,
  timezone: "America/New_York",

  // What's at stake?
  rewardDescription: "I owe you a pottery class session if I don't show!",
  rewardLink: "www.example.com", // Required private URL/code/text (e.g. PayPal link, gift card code)
};

// Set to false to skip sending emails (useful for testing)
const SEND_EMAILS = true;

// ─── SCRIPT ───────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL) { console.error("Missing: SUPABASE_URL"); process.exit(1); }
  if (!BONDZY_API_KEY) { console.error("Missing: BONDZY_API_KEY"); process.exit(1); }
  if (!CREATOR_EMAIL) { console.error("Missing: CREATOR_EMAIL"); process.exit(1); }
  if (!BONDZY.recipientEmail || !BONDZY.locationName || !BONDZY.date || !BONDZY.time || !BONDZY.rewardLink) {
    console.error("BONDZY config is incomplete. Fill in recipientEmail, locationName, date, time, and rewardLink.");
    process.exit(1);
  }

  const endpoint = `${SUPABASE_URL}/functions/v1/create-bondzy`;

  console.log("Creating Bondzy...");
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "x-api-key": BONDZY_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: BONDZY.type,
      creator_email: CREATOR_EMAIL,
      recipient_email: BONDZY.recipientEmail,
      recipient_name: BONDZY.recipientName,
      location_name: BONDZY.locationName,
      location_address: BONDZY.locationAddress,
      location_lat: BONDZY.locationLat,
      location_lng: BONDZY.locationLng,
      date: BONDZY.date,
      time: BONDZY.time,
      timezone: BONDZY.timezone,
      grace_minutes: BONDZY.gracePeriodMinutes,
      reward_description: BONDZY.rewardDescription,
      reward_link: BONDZY.rewardLink,
      send_email: SEND_EMAILS,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error(`Error (${res.status}):`, data.error || JSON.stringify(data));
    process.exit(1);
  }

  const bondzy = data.bondzy;
  console.log(`Bondzy created! ID: ${bondzy.id}`);
  console.log(`  Link:      ${data.bondzy_url}`);
  console.log(`  Type:      ${bondzy.type}`);
  console.log(`  Recipient: ${bondzy.recipient_name} (${bondzy.recipient_email})`);
  console.log(`  Location:  ${bondzy.location_name}`);
  console.log(`  When:      ${bondzy.date} at ${bondzy.time}`);
  console.log(`  Status:    ${bondzy.status}`);
  if (!SEND_EMAILS) console.log("  Emails:    skipped (SEND_EMAILS=false)");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});