import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildRedemptionMessage, sendBrevoMessage } from "../_shared/bondzy-email.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Bondzy = {
  id: string;
  type: "reward" | "promise";
  status: "active" | "redeemed" | "forfeit";
  creator_id: string | null;
  creator_email: string | null;
  creator_name: string | null;
  recipient_email: string | null;
  recipient_id: string | null;
  recipient_name: string | null;
  location_name: string | null;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  date: string | null;
  time: string | null;
  grace_minutes: number | null;
  timezone: string | null;
  reward_description: string | null;
  created_at: string | null;
  redeemed_at: string | null;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const toNumber = (value: unknown) => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

const distanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const r = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const zonedParts = (date: Date, timezone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const byType = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const hour = byType.hour === "24" ? 0 : Number(byType.hour);

  return {
    year: Number(byType.year),
    month: Number(byType.month),
    day: Number(byType.day),
    hour,
    minute: Number(byType.minute),
    second: Number(byType.second),
  };
};

const wallClockMs = (parts: ReturnType<typeof zonedParts>) =>
  Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);

const timeWindow = (bondzy: Bondzy) => {
  if (!bondzy.date || !bondzy.time) return { ok: false, reason: "Bondzy is missing date or time" };

  const [year, month, day] = bondzy.date.split("-").map(Number);
  const [hour, minute] = bondzy.time.split(":").map(Number);
  const scheduled = Date.UTC(year, month - 1, day, hour, minute, 0);
  const now = wallClockMs(zonedParts(new Date(), bondzy.timezone || "UTC"));
  const start = scheduled - 10 * 60 * 1000;
  const end = scheduled + (bondzy.grace_minutes || 10) * 60 * 1000;

  if (now < start) return { ok: false, reason: "This Bondzy is not open yet" };
  if (now > end) return { ok: false, reason: "This Bondzy redemption window has closed" };
  return { ok: true, reason: null };
};

const publicBondzy = (bondzy: Bondzy) => ({
  id: bondzy.id,
  type: bondzy.type,
  status: bondzy.status,
  creator_id: bondzy.creator_id,
  creator_email: bondzy.creator_email,
  creator_name: bondzy.creator_name,
  recipient_email: bondzy.recipient_email,
  recipient_id: bondzy.recipient_id,
  recipient_name: bondzy.recipient_name,
  location_name: bondzy.location_name,
  location_address: bondzy.location_address,
  location_lat: bondzy.location_lat,
  location_lng: bondzy.location_lng,
  date: bondzy.date,
  time: bondzy.time,
  grace_minutes: bondzy.grace_minutes,
  timezone: bondzy.timezone,
  reward_description: bondzy.reward_description,
  created_at: bondzy.created_at,
  redeemed_at: bondzy.redeemed_at,
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  let bondzyId = typeof body.bondzy_id === "string" ? body.bondzy_id : "";
  const claimToken = typeof body.claim_token === "string" ? body.claim_token.trim() : "";
  const lat = toNumber(body.lat);
  const lng = toNumber(body.lng);
  const accuracy = toNumber(body.accuracy);

  if (!bondzyId && !claimToken) return json({ error: "Missing bondzy_id or claim_token" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Supabase secrets are not configured" }, 500);

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let hasValidClaimToken = false;
  if (claimToken) {
    const { data: claim, error: claimError } = await supabase
      .from("bondzy_claims")
      .select("bondzy_id")
      .eq("claim_token", claimToken)
      .maybeSingle();

    if (claimError) return json({ error: "Claim lookup failed" }, 500);
    if (!claim?.bondzy_id) return json({ error: "Bondzy not found" }, 404);
    if (bondzyId && bondzyId !== claim.bondzy_id) {
      return json({ error: "Claim token does not match this Bondzy" }, 400);
    }

    bondzyId = claim.bondzy_id;
    hasValidClaimToken = true;
  }

  if (!await checkRateLimit(supabase, `redeem:${bondzyId}`, 20)) {
    console.warn(`Rate limit exceeded: redeem-bondzy for bondzy ${bondzyId}`);
    return json({ error: "Too many requests. Please try again later." }, 429);
  }

  const { data: bondzyData, error: bondzyError } = await supabase
    .from("bondzies")
    .select(
      "id,type,status,creator_id,creator_email,creator_name,recipient_email,recipient_id,recipient_name,location_name,location_address,location_lat,location_lng,date,time,grace_minutes,timezone,reward_description,created_at,redeemed_at",
    )
    .eq("id", bondzyId)
    .single();

  if (bondzyError || !bondzyData) return json({ error: "Bondzy not found" }, 404);
  const bondzy = bondzyData as Bondzy;

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  const { data: userData } = jwt ? await supabase.auth.getUser(jwt) : { data: { user: null } };
  const user = userData?.user || null;
  const userEmail = user?.email?.toLowerCase() || "";
  const isRecipient = Boolean(
    user &&
      ((bondzy.recipient_id && user.id === bondzy.recipient_id) ||
        (bondzy.recipient_email && bondzy.recipient_email.toLowerCase() === userEmail)),
  );

  if (bondzy.type === "promise" && user?.id !== bondzy.creator_id) {
    return json({ error: "Only the creator can check in for a Promise Bondzy" }, 403);
  }

  if (bondzy.type === "reward" && !hasValidClaimToken && !isRecipient) {
    return json({ error: "Use the private claim link to redeem this Reward Bondzy" }, 403);
  }

  const { data: secret, error: secretError } = await supabase
    .from("bondzy_secrets")
    .select("reward_value")
    .eq("bondzy_id", bondzy.id)
    .maybeSingle();

  if (bondzy.status === "redeemed") {
    if (bondzy.type === "reward" && secretError) return json({ error: "Reward lookup failed" }, 500);
    return json({
      success: true,
      already_redeemed: true,
      bondzy: publicBondzy(bondzy),
      reward_value: bondzy.type === "reward" ? secret?.reward_value || null : null,
    });
  }

  if (bondzy.status !== "active") {
    return json({ error: `This Bondzy is ${bondzy.status}` }, 409);
  }

  if (lat === null || lng === null) return json({ error: "Missing GPS coordinates" }, 400);
  if (bondzy.location_lat === null || bondzy.location_lng === null) {
    return json({ error: "Bondzy is missing target coordinates" }, 409);
  }

  const window = timeWindow(bondzy);
  if (!window.ok) return json({ error: window.reason }, 409);

  const distance = distanceMeters(lat, lng, bondzy.location_lat, bondzy.location_lng);
  if (distance > 100) {
    return json(
      {
        error: "Not close enough to redeem",
        distance_meters: Math.round(distance),
        required_meters: 100,
      },
      409,
    );
  }

  const redeemedAt = new Date().toISOString();
  if (bondzy.type === "reward" && !secret?.reward_value) {
    return json({ error: "Reward is not available for this Bondzy" }, 409);
  }

  const { data: updatedData, error: updateError } = await supabase
    .from("bondzies")
    .update({ status: "redeemed", redeemed_at: redeemedAt })
    .eq("id", bondzy.id)
    .eq("status", "active")
    .select(
      "id,type,status,creator_id,creator_email,creator_name,recipient_email,recipient_id,recipient_name,location_name,location_address,location_lat,location_lng,date,time,grace_minutes,timezone,reward_description,created_at,redeemed_at",
    )
    .single();

  if (updateError || !updatedData) return json({ error: "Bondzy could not be redeemed" }, 409);
  const updated = updatedData as Bondzy;

  const brevoKey = Deno.env.get("BREVO_API_KEY");
  if (brevoKey) {
    try {
      const eventType = updated.type === "promise" ? "promise_kept" : "reward_redeemed";
      await sendBrevoMessage(brevoKey, buildRedemptionMessage(eventType, updated));
    } catch (error) {
      console.error("Redemption email failed:", error);
    }
  }

  return json({
    success: true,
    bondzy: publicBondzy(updated),
    reward_value: updated.type === "reward" ? secret?.reward_value || null : null,
    distance_meters: Math.round(distance),
    accuracy_meters: accuracy === null ? null : Math.round(accuracy),
  });
});
