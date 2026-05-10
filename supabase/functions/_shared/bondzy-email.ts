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

type DetailRow = {
  iconFile: string;
  iconAlt: string;
  label: string;
  valueHtml: string;
  highlight?: boolean;
};

export type CreationEventType = "recipient_created" | "creator_created";
export type RedemptionEventType = "reward_redeemed" | "promise_kept";

const sender = { name: "Bondzy", email: "info@bondzy.com" };

const NAVY = "#1B2A4A";
const GOLD = "#D4A843";
const GREEN = "#2E8B57";
const TEXT = "#0A1A3A";
const MUTED = "#4F5B6B";
const LINE = "#E3E8EF";
const SOFT = "#F7F9FC";
const ICON_BASE_URL = "https://app.bondzy.com/email-icons";

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
    weekday: "short",
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

const rewardLabel = (bondzy: BondzyEmailRow) =>
  bondzy.reward_description || (bondzy.type === "promise" ? "Bondzy Penalty" : "Bondzy Reward");

const graceLabel = (bondzy: BondzyEmailRow) => `${bondzy.grace_minutes ?? 10} minutes`;

const brandLine = () => `<div style="text-align:center;margin:0 0 34px;">
  <img src="https://app.bondzy.com/bondzymarkv2.png" alt="Bondzy" width="48" height="48" style="display:inline-block;vertical-align:middle;margin-right:14px;border:0;border-radius:8px;background:#21345C;"/>
  <span style="display:inline-block;vertical-align:middle;color:${GOLD};font-size:24px;font-weight:800;line-height:1;">Bondzy</span>
</div>`;

const iconUrl = (file: string) => `${ICON_BASE_URL}/${file}`;

const iconImage = (file: string, alt: string, size = 40) =>
  `<img src="${iconUrl(file)}" width="${size}" height="${size}" alt="${htmlEscape(alt)}" style="display:block;width:${size}px;height:${size}px;border:0;border-radius:${Math.round(size * 0.2)}px;"/>`;

const hero = (iconFile: string, iconAlt: string, headingHtml: string, subheadingHtml: string, accent = GOLD) => `<div style="background:${NAVY};padding:22px 34px 46px;text-align:center;border-radius:10px 10px 0 0;">
  ${brandLine()}
  <div style="width:76px;height:76px;margin:0 auto 26px;">${iconImage(iconFile, iconAlt, 76)}</div>
  <h1 style="color:#ffffff;font-size:34px;line-height:1.18;margin:0 0 12px;font-weight:900;">${headingHtml}</h1>
  <p style="color:${GOLD};font-size:18px;line-height:1.45;margin:0;">${subheadingHtml}</p>
</div>
<div style="height:4px;background:${accent};line-height:4px;font-size:4px;">&nbsp;</div>`;

const compactHero = (iconFile: string, iconAlt: string, headingHtml: string, subheadingHtml: string, accent = GREEN) => `<div style="background:${NAVY};padding:22px 34px 34px;text-align:center;border-radius:10px 10px 0 0;">
  ${brandLine()}
  <div style="width:58px;height:58px;margin:0 auto 20px;">${iconImage(iconFile, iconAlt, 58)}</div>
  <h1 style="color:#ffffff;font-size:28px;line-height:1.22;margin:0 0 10px;font-weight:900;">${headingHtml}</h1>
  <p style="color:${GOLD};font-size:16px;line-height:1.45;margin:0;">${subheadingHtml}</p>
</div>
<div style="height:4px;background:${accent};line-height:4px;font-size:4px;">&nbsp;</div>`;

const emailShell = (innerHtml: string) => `<div style="margin:0;padding:0;background:#ffffff;">
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;">
    ${innerHtml}
    <div style="background:#F4F6F9;padding:20px;text-align:center;color:${MUTED};font-size:13px;border:1px solid ${LINE};border-top:none;border-radius:0 0 10px 10px;">
      Bondzy - No More Hoping. Make Things Happen.
    </div>
  </div>
</div>`;

const contentSection = (innerHtml: string) => `<div style="padding:34px 32px 38px;border-left:1px solid ${LINE};border-right:1px solid ${LINE};background:#ffffff;">
  ${innerHtml}
</div>`;

const ctaButton = (href: string, labelHtml: string, variant: "gold" | "navy" = "gold") => {
  const background = variant === "gold" ? GOLD : NAVY;
  const color = variant === "gold" ? TEXT : "#ffffff";
  return `<div style="text-align:center;margin:28px 0 0;">
    <a href="${htmlEscape(href)}" style="display:inline-block;background:${background};color:${color};padding:16px 36px;border-radius:10px;text-decoration:none;font-weight:900;font-size:16px;line-height:1.2;">${labelHtml}</a>
  </div>`;
};

const detailTable = (rows: DetailRow[]) => `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0;border:1px solid ${LINE};border-radius:12px;overflow:hidden;margin:26px 0;background:${SOFT};">
  ${rows
    .map((row, index) => `<tr>
      <td style="padding:16px 18px;background:${row.highlight ? "#FFF9E8" : SOFT};border-top:${index === 0 ? "0" : `1px solid ${LINE}`};">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td width="58" valign="top" style="width:58px;">
              ${iconImage(row.iconFile, row.iconAlt)}
            </td>
            <td valign="top" style="padding-left:8px;">
              <div style="color:#8A93A3;font-size:12px;letter-spacing:1.2px;font-weight:900;text-transform:uppercase;line-height:1.2;margin:1px 0 4px;">${row.label}</div>
              <div style="color:${TEXT};font-size:16px;line-height:1.38;font-weight:800;">${row.valueHtml}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`)
    .join("")}
</table>`;

const scheduleRows = (bondzy: BondzyEmailRow, finalLabel: string, finalIconFile: string, finalIconAlt: string): DetailRow[] => [
  {
    iconFile: "location.png",
    iconAlt: "Location",
    label: "Go to",
    valueHtml: htmlEscape(locationLabel(bondzy)),
  },
  {
    iconFile: "calendar.png",
    iconAlt: "Calendar",
    label: "When",
    valueHtml: `${htmlEscape(dateLabel(bondzy))} at ${htmlEscape(timeLabel(bondzy))}`,
  },
  {
    iconFile: "clock.png",
    iconAlt: "Grace period",
    label: "Grace period",
    valueHtml: htmlEscape(graceLabel(bondzy)),
  },
  {
    iconFile: finalIconFile,
    iconAlt: finalIconAlt,
    label: finalLabel,
    valueHtml: htmlEscape(rewardLabel(bondzy)),
    highlight: true,
  },
];

const creatorRows = (bondzy: BondzyEmailRow): DetailRow[] => [
  {
    iconFile: "recipient.png",
    iconAlt: "Recipient",
    label: "Recipient",
    valueHtml: htmlEscape(
      `${bondzy.recipient_name || "Recipient"}${bondzy.recipient_email ? ` (${bondzy.recipient_email})` : ""}`,
    ),
  },
  ...scheduleRows(
    bondzy,
    bondzy.type === "promise" ? "Penalty" : "Reward",
    bondzy.type === "promise" ? "promise.png" : "reward.png",
    bondzy.type === "promise" ? "Penalty" : "Reward",
  ),
];

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
  const safeCreator = htmlEscape(creator);
  const safeRecipient = htmlEscape(bondzy.recipient_name || "there");

  if (eventType === "recipient_created") {
    const subject = isPromise
      ? `${creator} made you a Promise Bondzy`
      : `${creator} has a Reward Bondzy for you`;
    const intro = isPromise
      ? `${creator} is committing to be somewhere at a specific time. If they do not show up, you receive the penalty.`
      : "Show up on time for your appointment to claim your reward.";
    const heading = isPromise
      ? "Someone made you<br/>a Promise Bondzy."
      : "You've got a reward<br/>waiting for you.";
    const subheading = isPromise
      ? `${safeCreator} backed their word with Bondzy`
      : `${safeCreator} set one up just for you`;
    const details = isPromise
      ? detailTable([
          {
            iconFile: "recipient.png",
            iconAlt: "Commitment by",
            label: "Commitment by",
            valueHtml: safeCreator,
          },
          ...scheduleRows(bondzy, "Penalty if missed", "promise.png", "Penalty"),
        ])
      : detailTable(scheduleRows(bondzy, "Your reward", "reward.png", "Reward"));

    return {
      to: [{ email: bondzy.recipient_email || "", name: bondzy.recipient_name || undefined }],
      subject,
      textContent: `Hi ${bondzy.recipient_name || "there"},

${intro}

Where: ${locationLabel(bondzy)}
When: ${dateLabel(bondzy)} at ${timeLabel(bondzy)}
Grace period: ${graceLabel(bondzy)}
${isPromise ? "Penalty" : "Reward"}: ${rewardLabel(bondzy)}

Open Bondzy: ${bondzyUrl}`,
      htmlContent: emailShell(
        `${hero(isPromise ? "promise.png" : "reward.png", isPromise ? "Promise" : "Reward", heading, subheading)}
        ${contentSection(
          `<h2 style="color:${TEXT};font-size:24px;line-height:1.25;margin:0 0 12px;font-weight:900;">Hi ${safeRecipient}! &#128075;</h2>
          <p style="color:${MUTED};font-size:16px;line-height:1.55;margin:0;">${htmlEscape(intro)}</p>
          ${details}
          ${ctaButton(bondzyUrl, isPromise ? "View My Promise &rarr;" : "Claim My Reward &rarr;")}`,
        )}`,
      ),
    };
  }

  const subject = isPromise ? "Your Promise Bondzy is posted" : "Your Reward Bondzy is posted";
  const safeTarget = htmlEscape(bondzy.recipient_name || bondzy.recipient_email || "your recipient");

  return {
    to: [{ email: bondzy.creator_email || "" }],
    subject,
    textContent: `${subject}

Recipient: ${bondzy.recipient_name || ""} (${bondzy.recipient_email || ""})
Where: ${locationLabel(bondzy)}
When: ${dateLabel(bondzy)} at ${timeLabel(bondzy)}
Grace period: ${graceLabel(bondzy)}
${isPromise ? "Penalty" : "Reward"}: ${rewardLabel(bondzy)}

View Dashboard: https://app.bondzy.com`,
    htmlContent: emailShell(
      `${compactHero(
        isPromise ? "promise.png" : "reward.png",
        isPromise ? "Promise" : "Reward",
        htmlEscape(subject),
        `Your Bondzy for ${safeTarget} is active.`,
        GREEN,
      )}
      ${contentSection(
        `<p style="color:${MUTED};font-size:16px;line-height:1.55;margin:0;">Everything is posted and ready.</p>
        ${detailTable(creatorRows(bondzy))}
        ${ctaButton("https://app.bondzy.com", "View Dashboard", "navy")}`,
      )}`,
    ),
  };
}

export function buildRedemptionMessage(
  eventType: RedemptionEventType,
  bondzy: BondzyEmailRow,
): Omit<BrevoMessage, "sender"> {
  const redeemedAt = bondzy.redeemed_at ? new Date(bondzy.redeemed_at).toLocaleString("en-US") : "just now";
  const actionRows = (label: string): DetailRow[] => [
    {
      iconFile: "location.png",
      iconAlt: "Location",
      label: "Location",
      valueHtml: htmlEscape(locationLabel(bondzy)),
    },
    {
      iconFile: "calendar.png",
      iconAlt: "Scheduled",
      label: "Scheduled",
      valueHtml: `${htmlEscape(dateLabel(bondzy))} at ${htmlEscape(timeLabel(bondzy))}`,
    },
    {
      iconFile: "success.png",
      iconAlt: "Success",
      label,
      valueHtml: htmlEscape(redeemedAt),
      highlight: true,
    },
  ];

  if (eventType === "promise_kept") {
    const creator = creatorName(bondzy);
    const safeCreator = htmlEscape(creator);
    return {
      to: [{ email: bondzy.recipient_email || "", name: bondzy.recipient_name || undefined }],
      subject: `${creator} kept their promise`,
      textContent: `Good news, ${bondzy.recipient_name || "there"}.

${creator} checked in and kept their Promise Bondzy.

Location: ${locationLabel(bondzy)}
Scheduled: ${dateLabel(bondzy)} at ${timeLabel(bondzy)}
Checked in: ${redeemedAt}

The commitment was honored. No penalty triggered.`,
      htmlContent: emailShell(
        `${compactHero("success.png", "Success", `${safeCreator} kept their promise`, "The commitment was honored. No penalty triggered.", GREEN)}
        ${contentSection(
          `<p style="color:${MUTED};font-size:16px;line-height:1.55;margin:0;">Good news: ${safeCreator} checked in on time.</p>
          ${detailTable(actionRows("Checked in"))}`,
        )}`,
      ),
    };
  }

  const safeRecipient = htmlEscape(bondzy.recipient_name || "Your recipient");
  return {
    to: [{ email: bondzy.creator_email || "" }],
    subject: `${bondzy.recipient_name || "Your recipient"} claimed your Bondzy`,
    textContent: `Success. ${bondzy.recipient_name || "Your recipient"} showed up and claimed the reward.

Location: ${locationLabel(bondzy)}
Scheduled: ${dateLabel(bondzy)} at ${timeLabel(bondzy)}
Claimed: ${redeemedAt}
Reward: ${rewardLabel(bondzy)}

View Dashboard: https://app.bondzy.com`,
    htmlContent: emailShell(
      `${compactHero("success.png", "Success", `${safeRecipient} claimed your Bondzy`, "They showed up and claimed the reward.", GREEN)}
      ${contentSection(
        `<p style="color:${MUTED};font-size:16px;line-height:1.55;margin:0;">Success: ${safeRecipient} redeemed their Bondzy reward.</p>
        ${detailTable([...actionRows("Claimed"), {
          iconFile: "reward.png",
          iconAlt: "Reward",
          label: "Reward",
          valueHtml: htmlEscape(rewardLabel(bondzy)),
          highlight: true,
        }])}
        ${ctaButton("https://app.bondzy.com", "View Dashboard", "navy")}`,
      )}`,
    ),
  };
}

export async function sendCreationEmails(brevoKey: string, bondzy: BondzyEmailRow, bondzyUrl: string) {
  await sendBrevoMessage(brevoKey, buildCreationMessage("recipient_created", bondzy, bondzyUrl));
  await sendBrevoMessage(brevoKey, buildCreationMessage("creator_created", bondzy, bondzyUrl));
}
