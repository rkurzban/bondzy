/**
 * create-bondzy.js
 * Generic script to create a Bondzy programmatically via Supabase.
 *
 * HOW TO CUSTOMIZE:
 *   1. Set the four environment variables below (or export them in your shell).
 *   2. Edit the BONDZY CONFIG section — fill in type, recipient, location, date/time, and penalty/reward.
 *   3. Run:  node scripts/create-bondzy.js
 *
 * PREREQUISITES:
 *   - Node 18+ (uses built-in fetch)
 *   - @supabase/supabase-js already in package.json; install with: npm install
 *   - Supabase SERVICE ROLE key (not the anon key) — found in your Supabase project →
 *     Settings → API → "service_role secret". This lets the script bypass Row Level Security.
 *   - Brevo API key (optional — set SEND_EMAILS=false to skip emails)
 */

const { createClient } = require("@supabase/supabase-js");

// ─── ENVIRONMENT VARIABLES ────────────────────────────────────────────────────
// Set these in your shell before running, e.g.:
//   export SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
//   export SUPABASE_SERVICE_ROLE_KEY=eyJ...
//   export BREVO_API_KEY=xkeysib-...
//   export CREATOR_EMAIL=you@example.com

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const CREATOR_EMAIL = process.env.CREATOR_EMAIL; // must match a Supabase auth user

// ─── BONDZY CONFIG ────────────────────────────────────────────────────────────
// Edit everything in this block for each Bondzy you want to create.

const BONDZY = {
  // "promise" = creator must show up (recipient gets notified if they don't)
  // "reward"  = recipient must show up to claim something
  type: "promise",

  // Who is this Bondzy for?
  recipientName: "Rob Kurzban",
  recipientEmail: "rkurzban@gmail.com",

  // Where?
  locationName: "The Pottery Spottery",
  locationAddress: "123 Clay St, Chicago, IL 60601", // full address
  locationLat: 41.8827,  // latitude  — get from Google Maps
  locationLng: -87.6233, // longitude — right-click on Maps → "What's here?"

  // When? (YYYY-MM-DD and HH:MM in 24-hour format)
  date: "2026-04-25",
  time: "14:00",
  gracePeriodMinutes: 10,
  timezone: "America/New_York", // IANA timezone string

  // What's at stake?
  // For "promise": describe the penalty if you don't show up.
  // For "reward":  this is what the recipient gets for showing up.
  rewardDescription: "I owe you a pottery class session if I don't show!",
  rewardLink: "", // Optional URL or code (e.g. PayPal link, gift card code)
};

// Set to false to skip sending emails (useful for testing)
const SEND_EMAILS = true;

// ─── SCRIPT ───────────────────────────────────────────────────────────────────

function validate() {
  const missing = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!CREATOR_EMAIL) missing.push("CREATOR_EMAIL");
  if (SEND_EMAILS && !BREVO_API_KEY) missing.push("BREVO_API_KEY");
  if (missing.length) {
    console.error("Missing environment variables:", missing.join(", "));
    process.exit(1);
  }
  if (!BONDZY.recipientEmail || !BONDZY.locationName || !BONDZY.date || !BONDZY.time) {
    console.error("BONDZY config is incomplete. Fill in recipientEmail, locationName, date, and time.");
    process.exit(1);
  }
}

async function getCreatorId(supabase) {
  // Uses the admin API to look up the creator's user ID from their email
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw new Error("Could not list users: " + error.message);
  const user = data.users.find((u) => u.email === CREATOR_EMAIL);
  if (!user) throw new Error(`No Supabase auth user found for ${CREATOR_EMAIL}`);
  return user.id;
}

async function getCreatorProfile(supabase, creatorId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", creatorId)
    .single();
  if (error) {
    console.warn("Could not load creator profile, using email as name.");
    return { name: CREATOR_EMAIL.split("@")[0], email: CREATOR_EMAIL };
  }
  return data;
}

async function insertBondzy(supabase, creatorId, creatorProfile) {
  const { data, error } = await supabase
    .from("bondzies")
    .insert({
      type: BONDZY.type,
      status: "active",
      creator_id: creatorId,
      creator_email: creatorProfile.email,
      creator_name: creatorProfile.name || "",
      recipient_email: BONDZY.recipientEmail,
      recipient_name: BONDZY.recipientName,
      location_name: BONDZY.locationName,
      location_address: BONDZY.locationAddress || "",
      location_lat: BONDZY.locationLat,
      location_lng: BONDZY.locationLng,
      date: BONDZY.date,
      time: BONDZY.time,
      grace_minutes: BONDZY.gracePeriodMinutes ?? 10,
      timezone: BONDZY.timezone || "UTC",
      reward_link: BONDZY.rewardLink || "",
      reward_description: BONDZY.rewardDescription || (BONDZY.type === "promise" ? "Bondzy Penalty" : "Bondzy Reward"),
    })
    .select()
    .single();

  if (error) throw new Error("Insert failed: " + error.message);
  return data;
}

async function sendEmail(to, toName, subject, htmlContent, textContent) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Bondzy", email: "info@bondzy.com" },
      to: [{ email: to, name: toName }],
      subject,
      textContent,
      htmlContent,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo error (${res.status}): ${body}`);
  }
}

function buildEmailHtml(bondzy, creatorName, isRecipient) {
  const isProm = bondzy.type === "promise";
  const formattedDate = new Date(bondzy.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const [h, m] = bondzy.time.split(":");
  const hour12 = ((+h % 12) || 12);
  const ampm = +h >= 12 ? "PM" : "AM";
  const formattedTime = `${hour12}:${m} ${ampm}`;

  if (isProm && isRecipient) {
    return `
<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
  <div style="background:#1B2A4A;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
    <h1 style="color:#D4A843;margin:0;font-size:24px;">🤝 Bondzy</h1>
  </div>
  <div style="background:white;padding:24px;border:1px solid #E8E9EB;border-top:none;">
    <h2 style="color:#1B2A4A;margin:0 0 16px;">${creatorName} made you a Promise Bondzy!</h2>
    <p style="color:#5A6570;line-height:1.6;">${creatorName} is committing to be at a specific place at a specific time. If they don't show up, you get the penalty!</p>
    <div style="background:#F5F6F8;border-radius:10px;padding:16px;margin:16px 0;">
      <p style="margin:4px 0;font-size:14px;">🤝 <strong>Commitment by:</strong> ${creatorName}</p>
      <p style="margin:4px 0;font-size:14px;">📍 <strong>Location:</strong> ${bondzy.location_name}</p>
      <p style="margin:4px 0;font-size:14px;">📅 <strong>When:</strong> ${formattedDate} at ${formattedTime}</p>
      <p style="margin:4px 0;font-size:14px;">⏰ <strong>Grace period:</strong> ${bondzy.grace_minutes} minutes</p>
      <p style="margin:4px 0;font-size:14px;">🎁 <strong>Penalty if they miss:</strong> ${bondzy.reward_description}</p>
    </div>
    <p style="color:#5A6570;font-size:14px;">You'll be notified when they check in — or if they don't show up.</p>
    <div style="text-align:center;margin:20px 0;">
      <a href="https://app.bondzy.com?bondzy=${bondzy.id}" style="background:#1B2A4A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">Open Bondzy</a>
    </div>
  </div>
  <div style="background:#F5F6F8;padding:16px;text-align:center;color:#5A6570;font-size:12px;border-radius:0 0 12px 12px;">
    <p style="margin:0;"><a href="https://www.bondzy.com" style="color:#1B2A4A;font-weight:600;">www.bondzy.com</a> · info@bondzy.com</p>
  </div>
</div>`;
  }

  // Reward recipient or promise creator confirmation
  return `
<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
  <div style="background:#1B2A4A;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
    <h1 style="color:#D4A843;margin:0;font-size:24px;">${isProm ? "🤝" : "🎁"} Bondzy</h1>
  </div>
  <div style="background:white;padding:24px;border:1px solid #E8E9EB;border-top:none;">
    <h2 style="color:#1B2A4A;margin:0 0 16px;">${isProm ? "Your Promise Bondzy is posted!" : `${creatorName} has a Reward Bondzy for you!`}</h2>
    <div style="background:#F5F6F8;border-radius:10px;padding:16px;margin:16px 0;">
      <p style="margin:4px 0;font-size:14px;">📍 <strong>Location:</strong> ${bondzy.location_name}</p>
      <p style="margin:4px 0;font-size:14px;">📅 <strong>When:</strong> ${formattedDate} at ${formattedTime}</p>
      <p style="margin:4px 0;font-size:14px;">⏰ <strong>Grace period:</strong> ${bondzy.grace_minutes} minutes</p>
      <p style="margin:4px 0;font-size:14px;">${isProm ? "🎁" : "🎁"} <strong>${isProm ? "Penalty:" : "Reward:"}</strong> ${bondzy.reward_description}</p>
    </div>
    <div style="text-align:center;margin:20px 0;">
      <a href="https://app.bondzy.com?bondzy=${bondzy.id}" style="background:#D4A843;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">Open Bondzy</a>
    </div>
  </div>
  <div style="background:#F5F6F8;padding:16px;text-align:center;color:#5A6570;font-size:12px;border-radius:0 0 12px 12px;">
    <p style="margin:0;"><a href="https://www.bondzy.com" style="color:#1B2A4A;font-weight:600;">www.bondzy.com</a> · info@bondzy.com</p>
  </div>
</div>`;
}

async function main() {
  validate();

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Looking up creator...");
  const creatorId = await getCreatorId(supabase);
  const creatorProfile = await getCreatorProfile(supabase, creatorId);
  console.log(`Creator: ${creatorProfile.name} (${creatorProfile.email}) — ID: ${creatorId}`);

  console.log("Creating Bondzy...");
  const bondzy = await insertBondzy(supabase, creatorId, creatorProfile);
  console.log(`Bondzy created! ID: ${bondzy.id}`);
  console.log(`  Type:      ${bondzy.type}`);
  console.log(`  Recipient: ${bondzy.recipient_name} (${bondzy.recipient_email})`);
  console.log(`  Location:  ${bondzy.location_name}`);
  console.log(`  When:      ${bondzy.date} at ${bondzy.time}`);
  console.log(`  Status:    ${bondzy.status}`);

  if (SEND_EMAILS) {
    const isProm = bondzy.type === "promise";
    const creatorName = creatorProfile.name || CREATOR_EMAIL.split("@")[0];

    console.log(`Sending email to recipient (${bondzy.recipient_email})...`);
    await sendEmail(
      bondzy.recipient_email,
      bondzy.recipient_name,
      isProm
        ? `🤝 ${creatorName} made you a Promise Bondzy!`
        : `🎁 ${creatorName} has a Reward Bondzy for you!`,
      buildEmailHtml(bondzy, creatorName, true),
      isProm
        ? `${creatorName} made a Promise Bondzy to you! They're committing to be at ${bondzy.location_name} on ${bondzy.date} at ${bondzy.time}. If they don't show up, you get: ${bondzy.reward_description}`
        : `${creatorName} has a Reward Bondzy for you! Show up to ${bondzy.location_name} on ${bondzy.date} at ${bondzy.time} to claim: ${bondzy.reward_description}`
    );
    console.log("  Recipient email sent.");

    console.log(`Sending confirmation email to creator (${creatorProfile.email})...`);
    await sendEmail(
      creatorProfile.email,
      creatorProfile.name,
      isProm ? "🤝 Your Promise Bondzy is posted!" : "✅ Your Bondzy is posted!",
      buildEmailHtml(bondzy, creatorName, false),
      isProm
        ? `Your Promise Bondzy to ${bondzy.recipient_name} is live! Be at ${bondzy.location_name} on ${bondzy.date} at ${bondzy.time}.`
        : `Your Reward Bondzy for ${bondzy.recipient_name} is live! Location: ${bondzy.location_name} on ${bondzy.date} at ${bondzy.time}.`
    );
    console.log("  Creator confirmation email sent.");
  } else {
    console.log("Email sending skipped (SEND_EMAILS=false).");
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
