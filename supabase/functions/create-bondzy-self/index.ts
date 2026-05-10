import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendCreationEmails, type BondzyType } from "../_shared/bondzy-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RequestBody = Record<string, unknown>;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const cleanString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const field = (body: RequestBody, snake: string, camel?: string) =>
  cleanString(body[snake]) || (camel ? cleanString(body[camel]) : "");

const cleanNumber = (value: unknown) => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

const numberField = (body: RequestBody, snake: string, camel?: string) => {
  const direct = cleanNumber(body[snake]);
  if (direct !== null) return direct;
  return camel ? cleanNumber(body[camel]) : null;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Supabase secrets are not configured" }, 500);

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Authentication required" }, 401);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const type = field(body, "type") as BondzyType;
  const recipientEmail = field(body, "recipient_email", "recipientEmail").toLowerCase();
  const recipientName = field(body, "recipient_name", "recipientName");
  const locationName = field(body, "location_name", "locationName");
  const locationAddress = field(body, "location_address", "locationAddress");
  const locationLat = numberField(body, "location_lat", "locationLat");
  const locationLng = numberField(body, "location_lng", "locationLng");
  const date = field(body, "date");
  const time = field(body, "time");
  const timezone = field(body, "timezone") || "UTC";
  const rewardDescription = field(body, "reward_description", "rewardDescription");
  const rewardPayload =
    field(body, "reward_link", "rewardLink") ||
    field(body, "reward_payload", "rewardPayload") ||
    field(body, "payload") ||
    field(body, "reward_value", "rewardValue");
  const graceMinutes = cleanNumber(body.grace_minutes) ?? cleanNumber(body.gracePeriodMinutes) ?? 10;

  if (type !== "reward" && type !== "promise") return json({ error: "type must be reward or promise" }, 400);
  if (!recipientEmail.includes("@")) return json({ error: "recipient_email must be a valid email" }, 400);
  if (!recipientName) return json({ error: "recipient_name is required" }, 400);
  if (!locationName) return json({ error: "location_name is required" }, 400);
  if (locationLat === null || locationLng === null) {
    return json({ error: "location_lat and location_lng must be numbers" }, 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "date must use YYYY-MM-DD format" }, 400);
  if (!/^\d{2}:\d{2}$/.test(time)) return json({ error: "time must use HH:MM 24-hour format" }, 400);
  if (!rewardPayload) return json({ error: "reward_link is required" }, 400);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !userData?.user) return json({ error: "Authentication required" }, 401);
  const user = userData.user;
  const creatorEmail = (user.email || "").toLowerCase();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,name")
    .eq("id", user.id)
    .maybeSingle();

  const creatorName = cleanString(profile?.name) || creatorEmail.split("@")[0] || "";

  const { data: bondzy, error: insertError } = await supabase
    .from("bondzies")
    .insert({
      type,
      status: "active",
      creator_id: user.id,
      creator_email: creatorEmail,
      creator_name: creatorName,
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
      reward_description: rewardDescription || (type === "promise" ? "Bondzy Penalty" : "Bondzy Reward"),
    })
    .select(
      "id,type,status,creator_id,creator_email,creator_name,recipient_email,recipient_id,recipient_name,location_name,location_address,location_lat,location_lng,date,time,timezone,grace_minutes,reward_description,created_at,redeemed_at",
    )
    .single();

  if (insertError || !bondzy) return json({ error: insertError?.message || "Could not create Bondzy" }, 500);

  const { data: claim } = await supabase
    .from("bondzy_claims")
    .select("claim_token")
    .eq("bondzy_id", bondzy.id)
    .maybeSingle();

  const bondzyUrl = claim?.claim_token
    ? `https://app.bondzy.com/?claim=${claim.claim_token}`
    : "https://app.bondzy.com";

  const brevoKey = Deno.env.get("BREVO_API_KEY");
  if (brevoKey) {
    try {
      await sendCreationEmails(brevoKey, bondzy, bondzyUrl);
    } catch (error) {
      console.error("Creation email failed:", error);
    }
  }

  return json(
    {
      success: true,
      bondzy_url: bondzyUrl,
      claim_token: claim?.claim_token || null,
      bondzy,
    },
    201,
  );
});
