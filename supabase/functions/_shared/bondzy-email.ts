export type BondzyType = "reward" | "promise";
export type BondzyStatus = "active" | "redeemed" | "forfeit";

export type BondzyEmailRow = {
  id: string;
  type: BondzyType;
  status: BondzyStatus;
  creator_id: string | null;
  creator_email: string | null;
  creator_name: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  location_name: string | null;
  location_address: string | null;
  date: string | null;
  time: string | null;
  timezone: string | null;
  grace_minutes: number | null;
  reward_description: string | null;
  redeemed_at: string | null;
};

type BrevoMessage = {
  sender: { name: string; email: string };
  to: Array<{ email: string; name?: string }>;
  subject: string;
  textContent: string;
  htmlContent: string;
};

export type CreationEventType = "recipient_created" | "creator_created";
export type RedemptionEventType = "reward_redeemed" | "promise_kept";

const sender = { name: "Bondzy", email: "info@bondzy.com" };

export const htmlEscape = (value: string | null | undefined) =>
  (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const creatorName = (bondzy: BondzyEmailRow) =>
  bondzy.creator_name || (bondzy.creator_email || "").split("@")[0] || "Someone";

const dateLabel = (bondzy: BondzyEmailRow) => {
  if (!bondzy.date) return "the scheduled date";
  return new Date(`${bondzy.date}T00:00:00`).toLocaleDateString("en-US", {
    timeZone: bondzy.timezone || "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const timeLabel = (bondzy: BondzyEmailRow) => {
  if (!bondzy.time) return "the scheduled time";
  const [hours, minutes] = bondzy.time.split(":");
  const h = Number(hours);
  return `${h % 12 || 12}:${minutes || "00"} ${h >= 12 ? "PM" : "AM"}`;
};

const locationLabel = (bondzy: BondzyEmailRow) =>
  `${bondzy.location_name || "the location"}${bondzy.location_address ? `, ${bondzy.location_address}` : ""}`;

const shell = (heading: string, bodyHtml: string, accent = "#D4A843") => `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;">
  <div style="background:#1B2A4A;padding:20px 28px;text-align:center;border-radius:12px 12px 0 0;">
    <img src="https://app.bondzy.com/bondzymarkv2.png" alt="Bondzy" width="40" height="40" style="display:inline-block;vertical-align:middle;margin-right:10px;border:0;"/>
    <span style="color:#D4A843;font-size:22px;font-weight:700;vertical-align:middle;">Bondzy</span>
  </div>
  <div style="padding:28px;border:1px solid #E8ECF0;border-top:4px solid ${accent};">
    <h1 style="color:#1B2A4A;font-size:24px;line-height:1.25;margin:0 0 14px;">${htmlEscape(heading)}</h1>
    ${bodyHtml}
  </div>
  <div style="background:#F5F6F8;padding:18px;text-align:center;color:#5A6570;font-size:12px;border-radius:0 0 12px 12px;">
    Bondzy - No More Hoping. Make Things Happen.
  </div>
</div>`;

const detailsBlock = (bondzy: BondzyEmailRow) => `<div style="background:#F8F9FA;border:1px solid #E8ECF0;border-radius:10px;padding:16px;margin:18px 0;">
  <p style="margin:0 0 8px;color:#1B2A4A;font-size:14px;"><strong>Location:</strong> ${htmlEscape(bondzy.location_name)}</p>
  ${bondzy.location_address ? `<p style="margin:0 0 8px;color:#1B2A4A;font-size:14px;"><strong>Address:</strong> ${htmlEscape(bondzy.location_address)}</p>` : ""}
  <p style="margin:0 0 8px;color:#1B2A4A;font-size:14px;"><strong>When:</strong> ${htmlEscape(dateLabel(bondzy))} at ${htmlEscape(timeLabel(bondzy))}</p>
  <p style="margin:0;color:#1B2A4A;font-size:14px;"><strong>${bondzy.type === "promise" ? "Penalty" : "Reward"}:</strong> ${htmlEscape(bondzy.reward_description)}</p>
</div>`;

export async function sendBrevoMessage(brevoKey: string, message: Omit<BrevoMessage, "sender">) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": brevoKey, "Content-Type": "application/json" },
    body: JSON.stringify({ ...message, sender }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Brevo email failed (${response.status}): ${text}`);
  }
}

export function buildCreationMessage(
  eventType: CreationEventType,
  bondzy: BondzyEmailRow,
  bondzyUrl: string,
): Omit<BrevoMessage, "sender"> {
  const isPromise = bondzy.type === "promise";
  const creator = creatorName(bondzy);
  const safeUrl = htmlEscape(bondzyUrl);

  if (eventType === "recipient_created") {
    const subject = isPromise
      ? `${creator} made you a Promise Bondzy`
      : `${creator} has a Reward Bondzy for you`;
    const intro = isPromise
      ? `${creator} is committing to be somewhere at a specific time. If they do not show up, you receive the penalty.`
      : "Show up on time and verify your location to unlock your reward.";

    return {
      to: [{ email: bondzy.recipient_email || "", name: bondzy.recipient_name || undefined }],
      subject,
      textContent: `Hi ${bondzy.recipient_name || "there"},

${intro}

Where: ${locationLabel(bondzy)}
When: ${dateLabel(bondzy)} at ${timeLabel(bondzy)}
${isPromise ? "Penalty" : "Reward"}: ${bondzy.reward_description || ""}

Open Bondzy: ${bondzyUrl}`,
      htmlContent: shell(
        isPromise ? "A Promise Bondzy was made to you" : "You have a reward waiting",
        `<p style="color:#5A6570;font-size:15px;line-height:1.6;margin:0;">Hi ${htmlEscape(bondzy.recipient_name || "there")}, ${htmlEscape(intro)}</p>
        ${detailsBlock(bondzy)}
        <div style="text-align:center;"><a href="${safeUrl}" style="display:inline-block;background:#D4A843;color:#1B2A4A;padding:14px 34px;border-radius:9px;text-decoration:none;font-weight:800;">Open Bondzy</a></div>`,
      ),
    };
  }

  const subject = isPromise ? "Your Promise Bondzy is posted" : "Your Reward Bondzy is posted";
  return {
    to: [{ email: bondzy.creator_email || "" }],
    subject,
    textContent: `${subject}

Recipient: ${bondzy.recipient_name || ""} (${bondzy.recipient_email || ""})
Where: ${locationLabel(bondzy)}
When: ${dateLabel(bondzy)} at ${timeLabel(bondzy)}
${isPromise ? "Penalty" : "Reward"}: ${bondzy.reward_description || ""}

View Dashboard: https://app.bondzy.com`,
    htmlContent: shell(
      subject,
      `<p style="color:#5A6570;font-size:15px;line-height:1.6;margin:0;">Your Bondzy for ${htmlEscape(bondzy.recipient_name)} is active.</p>
      ${detailsBlock(bondzy)}
      <div style="text-align:center;"><a href="https://app.bondzy.com" style="display:inline-block;background:#1B2A4A;color:#ffffff;padding:14px 34px;border-radius:9px;text-decoration:none;font-weight:800;">View Dashboard</a></div>`,
      "#2E8B57",
    ),
  };
}

export function buildRedemptionMessage(
  eventType: RedemptionEventType,
  bondzy: BondzyEmailRow,
): Omit<BrevoMessage, "sender"> {
  const redeemedAt = bondzy.redeemed_at ? new Date(bondzy.redeemed_at).toLocaleString("en-US") : "just now";

  if (eventType === "promise_kept") {
    const creator = creatorName(bondzy);
    return {
      to: [{ email: bondzy.recipient_email || "", name: bondzy.recipient_name || undefined }],
      subject: `${creator} kept their promise`,
      textContent: `Good news, ${bondzy.recipient_name || "there"}.

${creator} checked in and kept their Promise Bondzy.

Location: ${locationLabel(bondzy)}
Scheduled: ${dateLabel(bondzy)} at ${timeLabel(bondzy)}
Checked in: ${redeemedAt}

The commitment was honored. No penalty triggered.`,
      htmlContent: shell(
        `${creator} kept their promise`,
        `<p style="color:#5A6570;font-size:15px;line-height:1.6;margin:0;">${htmlEscape(creator)} checked in and kept their Promise Bondzy.</p>
        ${detailsBlock(bondzy)}
        <p style="color:#5A6570;font-size:14px;line-height:1.6;margin:0;">Checked in: ${htmlEscape(redeemedAt)}</p>`,
        "#2E8B57",
      ),
    };
  }

  return {
    to: [{ email: bondzy.creator_email || "" }],
    subject: `${bondzy.recipient_name || "Your recipient"} claimed your Bondzy`,
    textContent: `Success. ${bondzy.recipient_name || "Your recipient"} showed up and claimed the reward.

Location: ${locationLabel(bondzy)}
Scheduled: ${dateLabel(bondzy)} at ${timeLabel(bondzy)}
Claimed: ${redeemedAt}
Reward: ${bondzy.reward_description || ""}

View Dashboard: https://app.bondzy.com`,
    htmlContent: shell(
      `${bondzy.recipient_name || "Your recipient"} claimed your Bondzy`,
      `<p style="color:#5A6570;font-size:15px;line-height:1.6;margin:0;">${htmlEscape(bondzy.recipient_name || "Your recipient")} successfully redeemed their Bondzy reward.</p>
      ${detailsBlock(bondzy)}
      <p style="color:#5A6570;font-size:14px;line-height:1.6;margin:0;">Claimed: ${htmlEscape(redeemedAt)}</p>`,
      "#2E8B57",
    ),
  };
}

export async function sendCreationEmails(brevoKey: string, bondzy: BondzyEmailRow, bondzyUrl: string) {
  await sendBrevoMessage(brevoKey, buildCreationMessage("recipient_created", bondzy, bondzyUrl));
  await sendBrevoMessage(brevoKey, buildCreationMessage("creator_created", bondzy, bondzyUrl));
}
