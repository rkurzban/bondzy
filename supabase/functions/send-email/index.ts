import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildCreationMessage,
  type CreationEventType,
  sendBrevoMessage,
} from "../_shared/bondzy-email.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const isCreationEvent = (value: unknown): value is CreationEventType =>
  value === "recipient_created" || value === "creator_created";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const brevoKey = Deno.env.get("BREVO_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!brevoKey || !supabaseUrl || !serviceRoleKey) {
    return json({ error: "Email service is not configured" }, 500);
  }

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Authentication required" }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const eventType = body.event_type;
  const bondzyId = typeof body.bondzy_id === "string" ? body.bondzy_id : "";
  if (!isCreationEvent(eventType)) return json({ error: "Unsupported email event type" }, 400);
  if (!bondzyId) return json({ error: "Missing bondzy_id" }, 400);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !userData?.user) return json({ error: "Authentication required" }, 401);

  if (!await checkRateLimit(supabase, `send-email:${userData.user.id}`, 20)) {
    console.warn(`Rate limit exceeded: send-email for ${userData.user.id}`);
    return json({ error: "Too many requests. Please try again later." }, 429);
  }

  const { data: bondzy, error: bondzyError } = await supabase
    .from("bondzies")
    .select(
      "id,type,status,creator_id,creator_email,creator_name,recipient_email,recipient_name,location_name,location_address,date,time,timezone,grace_minutes,reward_description,redeemed_at",
    )
    .eq("id", bondzyId)
    .single();

  if (bondzyError || !bondzy) return json({ error: "Bondzy not found" }, 404);
  if (bondzy.creator_id !== userData.user.id) {
    return json({ error: "Only the Bondzy creator can send creation emails" }, 403);
  }

  const { data: claim } = await supabase
    .from("bondzy_claims")
    .select("claim_token")
    .eq("bondzy_id", bondzy.id)
    .maybeSingle();

  const bondzyUrl = claim?.claim_token
    ? `https://app.bondzy.com/?claim=${claim.claim_token}`
    : "https://app.bondzy.com";

  await sendBrevoMessage(brevoKey, buildCreationMessage(eventType, bondzy, bondzyUrl));
  return json({ success: true });
});
