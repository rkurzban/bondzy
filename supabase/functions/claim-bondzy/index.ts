import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  reward_link: string | null;
  created_at: string | null;
  redeemed_at: string | null;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const publicBondzy = (bondzy: Bondzy, includeRewardLink = false) => ({
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
  ...(includeRewardLink ? { reward_link: bondzy.reward_link } : {}),
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

  const claimToken =
    typeof body.claim_token === "string"
      ? body.claim_token.trim()
      : typeof body.token === "string"
        ? body.token.trim()
        : "";

  if (!claimToken) return json({ error: "Missing claim token" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Supabase secrets are not configured" }, 500);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: claim, error: claimError } = await supabase
    .from("bondzy_claims")
    .select("bondzy_id")
    .eq("claim_token", claimToken)
    .maybeSingle();

  if (claimError) return json({ error: "Claim lookup failed" }, 500);
  if (!claim) return json({ error: "Bondzy not found" }, 404);

  const { data: bondzyData, error: bondzyError } = await supabase
    .from("bondzies")
    .select(
      "id,type,status,creator_id,creator_email,creator_name,recipient_email,recipient_id,recipient_name,location_name,location_address,location_lat,location_lng,date,time,grace_minutes,timezone,reward_description,reward_link,created_at,redeemed_at",
    )
    .eq("id", claim.bondzy_id)
    .single();

  if (bondzyError || !bondzyData) return json({ error: "Bondzy not found" }, 404);
  const bondzy = bondzyData as Bondzy;

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  const { data: userData } = jwt ? await supabase.auth.getUser(jwt) : { data: { user: null } };
  const user = userData?.user || null;
  const userEmail = user?.email?.toLowerCase() || "";
  const isCreator = Boolean(user?.id && user.id === bondzy.creator_id);
  const isRecipient = Boolean(
    user &&
      ((bondzy.recipient_id && user.id === bondzy.recipient_id) ||
        (bondzy.recipient_email && bondzy.recipient_email.toLowerCase() === userEmail)),
  );

  if (bondzy.type === "promise") {
    if (!user) {
      return json(
        {
          error: "Sign in to view this Promise Bondzy",
          requires_auth: true,
        },
        401,
      );
    }

    if (!isCreator && !isRecipient) {
      return json({ error: "This Promise Bondzy is only visible to the creator and recipient" }, 403);
    }
  }

  const role = isCreator ? "creator" : "recipient";
  const includeRewardLink = bondzy.type === "promise" && bondzy.status === "forfeit" && isRecipient;

  return json({
    success: true,
    role,
    bondzy: publicBondzy(bondzy, includeRewardLink),
  });
});
