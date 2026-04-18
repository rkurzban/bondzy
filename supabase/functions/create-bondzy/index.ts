import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --- Authentication ---
  const apiKey = req.headers.get("x-api-key");
  const expectedKey = Deno.env.get("BONDZY_API_KEY");
  if (!expectedKey || apiKey !== expectedKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --- Parse body ---
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --- Validate required fields ---
  const required = [
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
  ];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  if (!["reward", "promise"].includes(body.type as string)) {
    return new Response(JSON.stringify({ error: "type must be 'reward' or 'promise'" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const type = body.type as string;
  const creatorEmail = body.creator_email as string;
  const recipientEmail = body.recipient_email as string;
  const recipientName = body.recipient_name as string;
  const locationName = body.location_name as string;
  const locationAddress = (body.location_address as string) || "";
  const locationLat = body.location_lat as number;
  const locationLng = body.location_lng as number;
  const date = body.date as string; // YYYY-MM-DD
  const time = body.time as string; // HH:MM
  const rewardLink = (body.reward_link as string) || "";
  const rewardDescription = body.reward_description as string;
  const graceMinutes = (body.grace_minutes as number) || 10;

  // --- Supabase client with service role key (bypasses RLS) ---
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // --- Look up creator's profile id ---
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", creatorEmail)
    .single();

  if (profileError || !profile) {
    return new Response(
      JSON.stringify({ error: `No Bondzy account found for creator email: ${creatorEmail}` }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // --- Insert the Bondzy ---
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
      grace_minutes: graceMinutes,
      reward_link: rewardLink,
      reward_description: rewardDescription,
    })
    .select()
    .single();

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --- Send emails via Brevo ---
  const brevoKey = Deno.env.get("BREVO_API_KEY");
  if (brevoKey) {
    const isPromise = type === "promise";
    const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const formattedTime = `${h % 12 || 12}:${minutes} ${ampm}`;

    // Email to recipient
    try {
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": brevoKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: { name: "Bondzy", email: "info@bondzy.com" },
          to: [{ email: recipientEmail, name: recipientName }],
          subject: isPromise
            ? `🤝 ${creatorEmail.split("@")[0]} made you a Promise Bondzy!`
            : "🎁 Someone has a Reward Bondzy for you!",
          textContent: isPromise
            ? `Hi ${recipientName}!\n\nSomeone made a Promise Bondzy to you — they're committing to be somewhere at a specific time. If they don't show up, you get the penalty!\n\nWho: ${creatorEmail}\nWhere: ${locationName}\nWhen: ${formattedDate} at ${formattedTime}\nPenalty if no-show: ${rewardDescription}\n\nIf they don't verify their GPS at the location in time, you'll automatically receive the penalty link.\n\nOpen Bondzy: https://app.bondzy.com\n\n---\nBondzy — No More Hoping. Make Things Happen.\nhttps://www.bondzy.com | info@bondzy.com`
            : `Hi ${recipientName}!\n\nShow up on time for your appointment to claim your reward.\n\nGo to: ${locationName}\nWhen: ${formattedDate} at ${formattedTime}\nGrace period: ${graceMinutes} minutes\nReward: ${rewardDescription}\n\nOpen Bondzy at the right place and time, verify your GPS, and the treasure is yours!\n\nOpen Bondzy: https://app.bondzy.com\n\n---\nBondzy — No More Hoping. Make Things Happen.\nhttps://www.bondzy.com | info@bondzy.com`,
          htmlContent: isPromise
            ? `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
                <div style="background:#1B2A4A;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
                  <img src="https://app.bondzy.com/bondzymarkv1.png" alt="Bondzy" width="44" height="44" style="display:inline-block;vertical-align:middle;margin-right:10px;border:0;"/><span style="color:#D4A843;font-size:22px;font-weight:bold;vertical-align:middle;font-family:Arial,sans-serif;">Bondzy</span>
                </div>
                <div style="background:#ffffff;padding:24px;border:1px solid #DDE1E6;">
                  <h2 style="color:#1B2A4A;margin:0 0 8px;">Hi ${recipientName}! 👋</h2>
                  <p style="color:#5A6570;font-size:15px;line-height:1.6;">Someone made a <strong>Promise Bondzy</strong> to you — they're committing to be somewhere at a specific time. If they don't show up, you get the penalty!</p>
                  <div style="background:#FFF8E7;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #D4A843;">
                    <p style="margin:4px 0;font-size:14px;">👤 <strong>Who:</strong> ${creatorEmail}</p>
                    <p style="margin:4px 0;font-size:14px;">📍 <strong>Where:</strong> ${locationName}</p>
                    <p style="margin:4px 0;font-size:14px;">📅 <strong>When:</strong> ${formattedDate} at ${formattedTime}</p>
                    <p style="margin:4px 0;font-size:14px;">⚠️ <strong>Penalty if no-show:</strong> ${rewardDescription}</p>
                  </div>
                  <p style="color:#5A6570;font-size:14px;line-height:1.6;">If they don't verify their GPS at the location in time, you'll automatically receive the penalty link.</p>
                  <div style="text-align:center;margin:20px 0;">
                    <a href="https://app.bondzy.com" style="background:#D4A843;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">Open Bondzy</a>
                  </div>
                </div>
                <div style="background:#F5F6F8;padding:20px 16px;text-align:center;color:#5A6570;font-size:12px;border-radius:0 0 12px 12px;">
                  <p style="margin:0 0 8px;font-weight:600;">Bondzy — No More Hoping. Make Things Happen.</p>
                  <p style="margin:8px 0 0;"><a href="https://www.bondzy.com" style="color:#1B2A4A;text-decoration:none;font-weight:600;">www.bondzy.com</a> · info@bondzy.com</p>
                </div>
              </div>`
            : `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;">
                <div style="background:#1B2A4A;padding:16px 28px;text-align:center;border-radius:12px 12px 0 0;">
                  <img src="https://app.bondzy.com/bondzymarkv1.png" alt="Bondzy" width="36" height="36" style="display:inline-block;vertical-align:middle;margin-right:8px;border:0;border-radius:6px;"/>
                  <span style="color:#D4A843;font-size:18px;font-weight:700;vertical-align:middle;font-family:Arial,sans-serif;">Bondzy</span>
                </div>
                <div style="background:#1B2A4A;padding:36px 28px 44px;text-align:center;">
                  <div style="display:inline-block;background:#ffffff;border-radius:50%;width:60px;height:60px;font-size:28px;line-height:60px;text-align:center;margin-bottom:18px;">🎁</div>
                  <h1 style="color:#ffffff;font-size:28px;margin:0 0 10px;font-weight:800;line-height:1.2;font-family:Arial,sans-serif;">You've got a reward<br/>waiting for you.</h1>
                  <p style="color:#D4A843;font-size:15px;margin:0;font-weight:500;">Someone set one up just for you</p>
                </div>
                <div style="height:4px;background:#D4A843;"></div>
                <div style="padding:32px 28px;background:#ffffff;border:1px solid #E8ECF0;border-top:none;">
                  <p style="font-size:19px;font-weight:700;color:#1B2A4A;margin:0 0 6px;font-family:Arial,sans-serif;">Hi ${recipientName}! 👋</p>
                  <p style="color:#5A6570;font-size:15px;line-height:1.65;margin:0 0 28px;">Show up on time for your appointment to claim your reward.</p>
                  <div style="background:#F8F9FA;border-radius:12px;border:1px solid #E8ECF0;overflow:hidden;margin-bottom:28px;">
                    <div style="padding:14px 16px;border-bottom:1px solid #E8ECF0;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                        <tr>
                          <td width="48" style="vertical-align:middle;padding-right:12px;">
                            <div style="width:36px;height:36px;background:#1B2A4A;border-radius:8px;text-align:center;line-height:36px;font-size:18px;">📍</div>
                          </td>
                          <td style="vertical-align:middle;">
                            <div style="font-size:10px;font-weight:700;color:#8E99A4;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:3px;">Go To</div>
                            <div style="font-size:14px;font-weight:600;color:#1B2A4A;">${locationName}</div>
                          </td>
                        </tr>
                      </table>
                    </div>
                    <div style="padding:14px 16px;border-bottom:1px solid #E8ECF0;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                        <tr>
                          <td width="48" style="vertical-align:middle;padding-right:12px;">
                            <div style="width:36px;height:36px;background:#1B2A4A;border-radius:8px;text-align:center;line-height:36px;font-size:18px;">📅</div>
                          </td>
                          <td style="vertical-align:middle;">
                            <div style="font-size:10px;font-weight:700;color:#8E99A4;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:3px;">When</div>
                            <div style="font-size:14px;font-weight:600;color:#1B2A4A;">${formattedDate} at ${formattedTime}</div>
                          </td>
                        </tr>
                      </table>
                    </div>
                    <div style="padding:14px 16px;border-bottom:1px solid #E8ECF0;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                        <tr>
                          <td width="48" style="vertical-align:middle;padding-right:12px;">
                            <div style="width:36px;height:36px;background:#1B2A4A;border-radius:8px;text-align:center;line-height:36px;font-size:18px;">⏰</div>
                          </td>
                          <td style="vertical-align:middle;">
                            <div style="font-size:10px;font-weight:700;color:#8E99A4;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:3px;">Grace Period</div>
                            <div style="font-size:14px;font-weight:600;color:#1B2A4A;">${graceMinutes} minutes</div>
                          </td>
                        </tr>
                      </table>
                    </div>
                    <div style="padding:14px 16px;background:#FFFBEF;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                        <tr>
                          <td width="48" style="vertical-align:middle;padding-right:12px;">
                            <div style="width:36px;height:36px;background:#D4A843;border-radius:8px;text-align:center;line-height:36px;font-size:18px;">🎁</div>
                          </td>
                          <td style="vertical-align:middle;">
                            <div style="font-size:10px;font-weight:700;color:#B8892A;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:3px;">Your Reward</div>
                            <div style="font-size:15px;font-weight:700;color:#1B2A4A;">${rewardDescription}</div>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </div>
                  <p style="color:#5A6570;font-size:14px;line-height:1.6;margin:0 0 24px;text-align:center;">Open the app when you're at ${locationName} and verify your location to unlock your reward.</p>
                  <div style="text-align:center;">
                    <a href="https://app.bondzy.com" style="display:inline-block;background:#D4A843;color:#1B2A4A;padding:15px 44px;border-radius:10px;text-decoration:none;font-weight:800;font-size:16px;letter-spacing:0.3px;font-family:Arial,sans-serif;">Claim My Reward →</a>
                  </div>
                </div>
                <div style="background:#F5F6F8;padding:24px 28px;text-align:center;color:#8E99A4;font-size:12px;border-radius:0 0 12px 12px;border:1px solid #E8ECF0;border-top:none;">
                  <p style="margin:0 0 4px;font-weight:700;color:#5A6570;font-size:13px;">Bondzy — No More Hoping. Make Things Happen.</p>
                  <p style="margin:0 0 10px;line-height:1.5;">GPS-verified accountability for real-world commitments.</p>
                  <p style="margin:0;"><a href="https://www.bondzy.com" style="color:#1B2A4A;text-decoration:none;font-weight:700;">www.bondzy.com</a> · <a href="mailto:info@bondzy.com" style="color:#8E99A4;text-decoration:none;">info@bondzy.com</a></p>
                </div>
              </div>`,
        }),
      });
    } catch (e) {
      console.error("Recipient email failed:", e);
    }

    // Email to creator
    try {
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": brevoKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: { name: "Bondzy", email: "info@bondzy.com" },
          to: [{ email: creatorEmail }],
          subject: isPromise ? "🤝 Your Promise Bondzy is posted!" : "✅ Your Bondzy is posted!",
          textContent: `${isPromise ? "🤝 Promise Bondzy Posted!" : "✅ Bondzy Posted Successfully!"}\n\n${
            isPromise
              ? `Your Promise Bondzy to ${recipientName} is now active. You must check in at the location on time, or they receive the penalty.`
              : `Your Reward Bondzy for ${recipientName} is now active. They've received an email notification.`
          }\n\nRecipient: ${recipientName} (${recipientEmail})\nLocation: ${locationName}\nDate & Time: ${formattedDate} at ${formattedTime}\n${
            isPromise ? "Penalty" : "Reward"
          }: ${rewardDescription}\n\n${
            isPromise
              ? `Remember to check in at ${locationName} on time!`
              : `We'll notify you when ${recipientName} redeems their Bondzy!`
          }\n\nView Dashboard: https://app.bondzy.com\n\n---\nBondzy — No More Hoping. Make Things Happen.\nhttps://www.bondzy.com | info@bondzy.com`,
          htmlContent: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
              <div style="background:#1B2A4A;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
                <img src="https://app.bondzy.com/bondzymarkv1.png" alt="Bondzy" width="44" height="44" style="display:inline-block;vertical-align:middle;margin-right:10px;border:0;"/><span style="color:#D4A843;font-size:22px;font-weight:bold;vertical-align:middle;font-family:Arial,sans-serif;">Bondzy</span>
              </div>
              <div style="background:#ffffff;padding:24px;border:1px solid #DDE1E6;">
                <h2 style="color:#1B2A4A;margin:0 0 8px;">${isPromise ? "🤝 Promise Bondzy Posted!" : "✅ Bondzy Posted Successfully!"}</h2>
                <p style="color:#5A6570;font-size:15px;line-height:1.6;">${
                  isPromise
                    ? `Your Promise Bondzy to <strong>${recipientName}</strong> is now active. You must check in at the location on time, or they receive the penalty.`
                    : `Your Reward Bondzy for <strong>${recipientName}</strong> is now active. They've received an email notification.`
                }</p>
                <div style="background:#E8F5E9;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #2E8B57;">
                  <p style="margin:4px 0;font-size:14px;">👤 <strong>Recipient:</strong> ${recipientName} (${recipientEmail})</p>
                  <p style="margin:4px 0;font-size:14px;">📍 <strong>Location:</strong> ${locationName}</p>
                  <p style="margin:4px 0;font-size:14px;">📅 <strong>Date & Time:</strong> ${formattedDate} at ${formattedTime}</p>
                  <p style="margin:4px 0;font-size:14px;">${isPromise ? "⚠️" : "🎁"} <strong>${isPromise ? "Penalty" : "Reward"}:</strong> ${rewardDescription}</p>
                </div>
                <p style="color:#5A6570;font-size:14px;line-height:1.6;">${
                  isPromise
                    ? `Remember to check in at ${locationName} on time!`
                    : `We'll notify you when ${recipientName} redeems their Bondzy!`
                }</p>
                <div style="text-align:center;margin:20px 0;">
                  <a href="https://app.bondzy.com" style="background:#1B2A4A;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">View in Dashboard</a>
                </div>
              </div>
              <div style="background:#F5F6F8;padding:20px 16px;text-align:center;color:#5A6570;font-size:12px;border-radius:0 0 12px 12px;">
                <p style="margin:0 0 8px;font-weight:600;">Bondzy — No More Hoping. Make Things Happen.</p>
                <p style="margin:8px 0 0;"><a href="https://www.bondzy.com" style="color:#1B2A4A;text-decoration:none;font-weight:600;">www.bondzy.com</a> · info@bondzy.com</p>
              </div>
            </div>`,
        }),
      });
    } catch (e) {
      console.error("Creator email failed:", e);
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      bondzy: {
        id: bondzy.id,
        type: bondzy.type,
        status: bondzy.status,
        creator_email: bondzy.creator_email,
        recipient_email: bondzy.recipient_email,
        recipient_name: bondzy.recipient_name,
        location_name: bondzy.location_name,
        date: bondzy.date,
        time: bondzy.time,
        reward_description: bondzy.reward_description,
        created_at: bondzy.created_at,
      },
    }),
    {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
