import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendCreationEmails, type BondzyEmailRow, type BondzyType } from "../_shared/bondzy-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

const required = (body: RequestBody, fields: string[]) => {
  for (const field of fields) {
    const value = body[field];
    if (value === undefined || value === null || value === "") return field;
  }
  return null;
};

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
    .select("id,name")
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
    await sendCreationEmails(
      brevoKey,
      {
        ...bondzy,
        creator_name: profile.name || null,
        redeemed_at: null,
      } as BondzyEmailRow,
      bondzyUrl,
    );
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
