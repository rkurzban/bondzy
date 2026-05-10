import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type BondzyType = "reward" | "promise";

type RequestBody = Record<string, unknown>;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const cleanString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const cleanNumber = (value: unknown) => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

const htmlEscape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formattedDate = (date: string, timezone: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    timeZone: timezone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const formattedTime = (time: string) => {
  const [hours, minutes] = time.split(":");
  const h = Number(hours);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${minutes || "00"} ${suffix}`;
};

const required = (body: RequestBody, fields: string[]) => {
  for (const field of fields) {
    const value = body[field];
    if (value === undefined || value === null || value === "") return field;
  }
  return null;
};

async function sendBondzyEmails({
  brevoKey,
  type,
  creatorEmail,
  recipientEmail,
  recipientName,
  locationName,
  locationAddress,
  date,
  time,
  timezone,
  graceMinutes,
  rewardDescription,
  bondzyUrl,
}: {
  brevoKey: string;
  type: BondzyType;
  creatorEmail: string;
  recipientEmail: string;
  recipientName: string;
  locationName: string;
  locationAddress: string;
  date: string;
  time: string;
  timezone: string;
  graceMinutes: number;
  rewardDescription: string;
  bondzyUrl: string;
}) {
  const isPromise = type === "promise";
  const dateLabel = formattedDate(date, timezone);
  const timeLabel = formattedTime(time);
  const safeRecipientName = htmlEscape(recipientName);
  const safeLocationName = htmlEscape(locationName);
  const safeLocationAddress = htmlEscape(locationAddress);
  const safeRewardDescription = htmlEscape(rewardDescription);
  const safeCreatorEmail = htmlEscape(creatorEmail);
  const safeBondzyUrl = htmlEscape(bondzyUrl);

  const detailLines = [
    `Recipient: ${recipientName} (${recipientEmail})`,
    `Location: ${locationName}${locationAddress ? `, ${locationAddress}` : ""}`,
    `When: ${dateLabel} at ${timeLabel}`,
    `${isPromise ? "Penalty" : "Reward"}: ${rewardDescription}`,
  ].join("\n");

  const recipientSubject = isPromise
    ? "Someone made you a Promise Bondzy"
    : "You have a Reward Bondzy waiting";

  const recipientText = isPromise
    ? `Hi ${recipientName},

Someone made a Promise Bondzy to you. They are committing to be at ${locationName} on ${dateLabel} at ${timeLabel}. If they do not show up, you receive the penalty.

Penalty: ${rewardDescription}

Open Bondzy: ${bondzyUrl}

Bondzy - No More Hoping. Make Things Happen.`
    : `Hi ${recipientName},

Show up on time for your appointment to claim your reward.

Go to: ${locationName}
When: ${dateLabel} at ${timeLabel}
Grace period: ${graceMinutes} minutes
Reward: ${rewardDescription}

Open Bondzy when you are at the location and verify your GPS to unlock your reward.

Open Bondzy: ${bondzyUrl}

Bondzy - No More Hoping. Make Things Happen.`;

  const recipientHtml = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;">
    <div style="background:#1B2A4A;padding:20px 28px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://app.bondzy.com/bondzymarkv2.png" alt="Bondzy" width="40" height="40" style="display:inline-block;vertical-align:middle;margin-right:10px;border:0;"/>
      <span style="color:#D4A843;font-size:22px;font-weight:700;vertical-align:middle;">Bondzy</span>
    </div>
    <div style="padding:28px;border:1px solid #E8ECF0;border-top:4px solid #D4A843;">
      <h1 style="color:#1B2A4A;font-size:24px;line-height:1.25;margin:0 0 14px;">${isPromise ? "A Promise Bondzy was made to you" : "You have a reward waiting"}</h1>
      <p style="color:#5A6570;font-size:15px;line-height:1.6;margin:0 0 22px;">Hi ${safeRecipientName}, ${isPromise ? "someone made a promise they need to verify in person." : "show up on time and verify your location to unlock it."}</p>
      <div style="background:#F8F9FA;border:1px solid #E8ECF0;border-radius:10px;padding:16px;margin-bottom:22px;">
        <p style="margin:0 0 8px;color:#1B2A4A;font-size:14px;"><strong>Location:</strong> ${safeLocationName}</p>
        ${safeLocationAddress ? `<p style="margin:0 0 8px;color:#1B2A4A;font-size:14px;"><strong>Address:</strong> ${safeLocationAddress}</p>` : ""}
        <p style="margin:0 0 8px;color:#1B2A4A;font-size:14px;"><strong>When:</strong> ${htmlEscape(dateLabel)} at ${htmlEscape(timeLabel)}</p>
        <p style="margin:0;color:#1B2A4A;font-size:14px;"><strong>${isPromise ? "Penalty" : "Reward"}:</strong> ${safeRewardDescription}</p>
      </div>
      <div style="text-align:center;">
        <a href="${safeBondzyUrl}" style="display:inline-block;background:#D4A843;color:#1B2A4A;padding:14px 34px;border-radius:9px;text-decoration:none;font-weight:800;">Open Bondzy</a>
      </div>
    </div>
    <div style="background:#F5F6F8;padding:18px;text-align:center;color:#5A6570;font-size:12px;border-radius:0 0 12px 12px;">
      Bondzy - No More Hoping. Make Things Happen.
    </div>
  </div>`;

  const creatorSubject = isPromise ? "Your Promise Bondzy is posted" : "Your Reward Bondzy is posted";
  const creatorText = `${creatorSubject}

${detailLines}

View dashboard: https://app.bondzy.com`;

  const creatorHtml = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;">
    <div style="background:#1B2A4A;padding:20px 28px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://app.bondzy.com/bondzymarkv2.png" alt="Bondzy" width="40" height="40" style="display:inline-block;vertical-align:middle;margin-right:10px;border:0;"/>
      <span style="color:#D4A843;font-size:22px;font-weight:700;vertical-align:middle;">Bondzy</span>
    </div>
    <div style="padding:28px;border:1px solid #E8ECF0;border-top:4px solid #2E8B57;">
      <h1 style="color:#1B2A4A;font-size:24px;line-height:1.25;margin:0 0 14px;">${htmlEscape(creatorSubject)}</h1>
      <div style="background:#F8F9FA;border:1px solid #E8ECF0;border-radius:10px;padding:16px;margin-bottom:22px;">
        <p style="margin:0 0 8px;color:#1B2A4A;font-size:14px;"><strong>Creator:</strong> ${safeCreatorEmail}</p>
        <p style="margin:0 0 8px;color:#1B2A4A;font-size:14px;"><strong>Recipient:</strong> ${safeRecipientName} (${htmlEscape(recipientEmail)})</p>
        <p style="margin:0 0 8px;color:#1B2A4A;font-size:14px;"><strong>Location:</strong> ${safeLocationName}</p>
        <p style="margin:0 0 8px;color:#1B2A4A;font-size:14px;"><strong>When:</strong> ${htmlEscape(dateLabel)} at ${htmlEscape(timeLabel)}</p>
        <p style="margin:0;color:#1B2A4A;font-size:14px;"><strong>${isPromise ? "Penalty" : "Reward"}:</strong> ${safeRewardDescription}</p>
      </div>
      <div style="text-align:center;">
        <a href="https://app.bondzy.com" style="display:inline-block;background:#1B2A4A;color:#ffffff;padding:14px 34px;border-radius:9px;text-decoration:none;font-weight:800;">View Dashboard</a>
      </div>
    </div>
  </div>`;

  const messages = [
    {
      sender: { name: "Bondzy", email: "info@bondzy.com" },
      to: [{ email: recipientEmail, name: recipientName }],
      subject: recipientSubject,
      textContent: recipientText,
      htmlContent: recipientHtml,
    },
    {
      sender: { name: "Bondzy", email: "info@bondzy.com" },
      to: [{ email: creatorEmail }],
      subject: creatorSubject,
      textContent: creatorText,
      htmlContent: creatorHtml,
    },
  ];

  for (const message of messages) {
    try {
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": brevoKey, "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error("Brevo email failed:", error);
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = req.headers.get("x-api-key");
  const expectedKey = Deno.env.get("BONDZY_API_KEY");
  if (!expectedKey || apiKey !== expectedKey) return json({ error: "Unauthorized" }, 401);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const missingField = required(body, [
    "type",
    "creator_email",
    "recipient_email",
    "recipient_name",
    "location_name",
    "location_lat",
    "location_lng",
    "date",
    "time",
    "reward_description",
  ]);

  if (missingField) return json({ error: `Missing required field: ${missingField}` }, 400);

  const type = cleanString(body.type) as BondzyType;
  if (type !== "reward" && type !== "promise") {
    return json({ error: "type must be 'reward' or 'promise'" }, 400);
  }

  const creatorEmail = cleanString(body.creator_email).toLowerCase();
  const recipientEmail = cleanString(body.recipient_email).toLowerCase();
  const recipientName = cleanString(body.recipient_name);
  const locationName = cleanString(body.location_name);
  const locationAddress = cleanString(body.location_address);
  const locationLat = cleanNumber(body.location_lat);
  const locationLng = cleanNumber(body.location_lng);
  const date = cleanString(body.date);
  const time = cleanString(body.time);
  const timezone = cleanString(body.timezone) || "America/New_York";
  const graceMinutes = cleanNumber(body.grace_minutes) ?? 10;
  const rewardDescription = cleanString(body.reward_description);
  const shouldSendEmail = body.send_email !== false;
  const rewardPayload =
    cleanString(body.reward_link) || cleanString(body.reward_payload) || cleanString(body.payload);

  if (!creatorEmail.includes("@")) return json({ error: "creator_email must be a valid email" }, 400);
  if (!recipientEmail.includes("@")) return json({ error: "recipient_email must be a valid email" }, 400);
  if (locationLat === null || locationLng === null) {
    return json({ error: "location_lat and location_lng must be numbers" }, 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: "date must use YYYY-MM-DD format" }, 400);
  }
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return json({ error: "time must use HH:MM 24-hour format" }, 400);
  }
  if (!rewardPayload) {
    return json({ error: "reward_link is required for reward and promise Bondzies" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Supabase secrets are not configured" }, 500);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", creatorEmail)
    .maybeSingle();

  if (profileError) return json({ error: profileError.message }, 500);
  if (!profile) return json({ error: `No Bondzy account found for creator email: ${creatorEmail}` }, 400);

  const { data: bondzy, error: insertError } = await supabase
    .from("bondzies")
    .insert({
      type,
      status: "active",
      creator_id: profile.id,
      creator_email: creatorEmail,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      location_name: locationName,
      location_address: locationAddress,
      location_lat: locationLat,
      location_lng: locationLng,
      date,
      time,
      timezone,
      grace_minutes: graceMinutes,
      reward_link: rewardPayload,
      reward_description: rewardDescription,
    })
    .select(
      "id,type,status,creator_id,creator_email,recipient_email,recipient_name,location_name,location_address,location_lat,location_lng,date,time,timezone,grace_minutes,reward_description,created_at",
    )
    .single();

  if (insertError) return json({ error: insertError.message }, 500);

  const { data: claim } = await supabase
    .from("bondzy_claims")
    .select("claim_token")
    .eq("bondzy_id", bondzy.id)
    .maybeSingle();

  const bondzyUrl = claim?.claim_token
    ? `https://app.bondzy.com/?claim=${claim.claim_token}`
    : "https://app.bondzy.com";

  const brevoKey = Deno.env.get("BREVO_API_KEY");
  if (brevoKey && shouldSendEmail) {
    await sendBondzyEmails({
      brevoKey,
      type,
      creatorEmail,
      recipientEmail,
      recipientName,
      locationName,
      locationAddress,
      date,
      time,
      timezone,
      graceMinutes,
      rewardDescription,
      bondzyUrl,
    });
  }

  return json(
    {
      success: true,
      bondzy_url: bondzyUrl,
      bondzy,
    },
    201,
  );
});
