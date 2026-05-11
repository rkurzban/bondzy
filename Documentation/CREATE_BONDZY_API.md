# Bondzy API: Create Bondzy Endpoint

## What This Is

The `create-bondzy` endpoint is a server-side API that allows any authorized script or service to create a Bondzy programmatically — without going through the Bondzy web app. The primary use case is automated Bondzy creation triggered by external systems, such as a Google Calendar script that rewards customers for booking on a certain day.

---

## How It Was Built (Summary)

The Bondzy app is a pure frontend application — it runs entirely in the browser with no backend server. To enable programmatic creation, we needed to add a server-side component. We chose a **Supabase Edge Function**, which is a small piece of server code that runs inside the existing Supabase project (no new server or hosting required).

The Edge Function (`supabase/functions/create-bondzy/index.ts`) does the following when called:

1. Checks that the request includes a valid API key (`x-api-key` header)
2. Validates all required fields in the request body
3. Looks up the creator's account in the `profiles` table by email
4. Inserts a new row into the `bondzies` table using Supabase's service-role key
5. For Reward Bondzies, requires a reward payload and inserts it as `reward_link`
6. The Phase 1 reward-security trigger moves active Reward payloads into `bondzy_secrets` and clears `bondzies.reward_link`
7. The Phase 2 claim-token trigger creates a private shared-link token in `bondzy_claims`
8. Optionally sends notification emails via Brevo unless `send_email` is explicitly `false`
9. Returns the created Bondzy details and a `bondzy_url` as a JSON response

**Deployment steps taken:**
- Installed the Supabase CLI on Windows via Scoop
- Authenticated the CLI with `supabase login`
- Linked the CLI to the Bondzy Supabase project (`supabase link --project-ref wbbkutufcmrxjdbmhgbv`)
- Set two secrets in the Supabase dashboard: `BONDZY_API_KEY` and `BREVO_API_KEY` (the `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL` are injected automatically by Supabase)
- `BONDZY_API_KEY` is a random shared password for this endpoint. It is not the Brevo key, Google Places key, Supabase anon key, or Supabase service-role key.
- `BREVO_API_KEY` must come from Brevo's **API keys & MCP** tab and should start with `xkeysib-`. Do not use an SMTP key that starts with `xsmtpsib-`.
- Deployed with `supabase functions deploy create-bondzy --no-verify-jwt`

---

## Endpoint Reference

### URL

```
POST https://wbbkutufcmrxjdbmhgbv.supabase.co/functions/v1/create-bondzy
```

### Authentication

Every request must include an `x-api-key` header containing the `BONDZY_API_KEY` secret. Requests without it, or with the wrong key, receive a `401 Unauthorized` response.

This is separate from `BREVO_API_KEY`. `BONDZY_API_KEY` only authenticates external callers to this Bondzy endpoint; it does not send email.

```
x-api-key: <your BONDZY_API_KEY>
```

### Headers

| Header | Value |
|---|---|
| `x-api-key` | Your BONDZY_API_KEY secret |
| `Content-Type` | `application/json` |

### Request Body

Send a JSON object with the following fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | string | Yes | `"reward"` or `"promise"` |
| `creator_email` | string | Yes | Email of the Bondzy creator. Must match an existing Bondzy account. |
| `recipient_email` | string | Yes | Email address the Bondzy is sent to. |
| `recipient_name` | string | Yes | Display name of the recipient (used in emails). |
| `location_name` | string | Yes | Human-readable name of the location (e.g. `"The Pottery Spot"`) |
| `location_address` | string | No | Full street address (optional but recommended) |
| `location_lat` | number | Yes | Latitude of the location (decimal degrees) |
| `location_lng` | number | Yes | Longitude of the location (decimal degrees) |
| `date` | string | Yes | Date in `YYYY-MM-DD` format (e.g. `"2026-04-10"`) |
| `time` | string | Yes | Time in `HH:MM` 24-hour format (e.g. `"14:00"` for 2:00 PM) |
| `reward_description` | string | Yes | Human-readable description of the reward (e.g. `"$5 off your next visit"`) |
| `reward_link` | string | Yes | The private reward or Promise penalty payload revealed only through a server-approved path. Despite the name, this can be a URL, promo code, or plain text string. |
| `reward_payload` | string | No | Alias for `reward_link`; supported for API callers, but prefer `reward_link` for now. |
| `payload` | string | No | Alias for `reward_link`; supported for API callers, but prefer `reward_link` for now. |
| `timezone` | string | No | IANA timezone for the appointment window. Defaults to `"America/New_York"`. |
| `grace_minutes` | number | No | Minutes of grace period around the scheduled time. Defaults to `10`. |
| `send_email` | boolean | No | Defaults to `true`. Set to `false` when the business sends its own email, such as The Pottery Spottery SendGrid flow. |

`reward_link` is required for both Reward and Promise Bondzies. The value is not intended to remain visible in `bondzies`; database triggers store it privately in `bondzy_secrets`.

### Example Request Body

```json
{
  "type": "reward",
  "creator_email": "studio@thepotteryspot.com",
  "recipient_email": "customer@example.com",
  "recipient_name": "Jane Smith",
  "location_name": "The Pottery Spot",
  "location_address": "123 Main Street, Anytown, NY 10001",
  "location_lat": 40.7128,
  "location_lng": -74.0060,
  "date": "2026-04-10",
  "time": "14:00",
  "timezone": "America/New_York",
  "reward_description": "$5 off your next visit",
  "reward_link": "POTTERY5",
  "send_email": false
}
```

### Successful Response

**Status: `201 Created`**

```json
{
  "success": true,
  "bondzy_url": "https://app.bondzy.com/?claim=private-claim-token",
  "bondzy": {
    "id": "uuid-of-new-bondzy",
    "type": "reward",
    "status": "active",
    "creator_email": "studio@thepotteryspot.com",
    "recipient_email": "customer@example.com",
    "recipient_name": "Jane Smith",
    "location_name": "The Pottery Spot",
    "date": "2026-04-10",
    "time": "14:00",
    "timezone": "America/New_York",
    "reward_description": "$5 off your next visit",
    "created_at": "2026-04-10T12:00:00Z"
  }
}
```

### Error Responses

| Status | Meaning |
|---|---|
| `401` | Missing or wrong `x-api-key` |
| `400` | Missing a required field, missing `reward_link` for a Reward Bondzy, invalid `type` value, or `creator_email` not found in Bondzy |
| `500` | Database error on insert |

---

## For Studio Use: Fixed Parameters

When calling this API from a studio automation script (e.g. Google Calendar), the following fields will always be the same and can be hardcoded in the script:

| Field | Value |
|---|---|
| `creator_email` | Your studio's Bondzy account email |
| `location_name` | The name of the studio |
| `location_address` | The studio's street address |
| `location_lat` | The studio's latitude |
| `location_lng` | The studio's longitude |

The fields that vary per call are: `recipient_email`, `recipient_name`, `date`, `time`, `reward_description`, and optionally `reward_link` if each appointment receives a different code.

To find your studio's exact latitude and longitude, go to Google Maps, right-click on your studio's location, and the coordinates will appear at the top of the context menu. Click them to copy.

---

## Example: Calling the API from PowerShell (for testing)

```powershell
Invoke-RestMethod -Method POST `
  -Uri "https://wbbkutufcmrxjdbmhgbv.supabase.co/functions/v1/create-bondzy" `
  -Headers @{ "x-api-key" = "YOUR_BONDZY_API_KEY"; "Content-Type" = "application/json" } `
  -Body '{
    "type": "reward",
    "creator_email": "studio@thepotteryspot.com",
    "recipient_email": "customer@example.com",
    "recipient_name": "Jane Smith",
    "location_name": "The Pottery Spot",
    "location_address": "123 Main Street, Anytown, NY 10001",
    "location_lat": 40.7128,
    "location_lng": -74.0060,
    "date": "2026-04-10",
    "time": "14:00",
    "timezone": "America/New_York",
    "reward_description": "$5 off your next visit",
    "reward_link": "POTTERY5",
    "send_email": false
  }'
```

## Example: Calling the API from Google Apps Script

This is the pattern to use when automating Bondzy creation from Google Calendar:

```javascript
function createBondzy(recipientEmail, recipientName, date, time, rewardDescription) {
  var url = "https://wbbkutufcmrxjdbmhgbv.supabase.co/functions/v1/create-bondzy";
  var payload = {
    type: "reward",
    creator_email: "studio@thepotteryspot.com",  // your studio's Bondzy account
    recipient_email: recipientEmail,
    recipient_name: recipientName,
    location_name: "The Pottery Spot",
    location_address: "123 Main Street, Anytown, NY 10001",
    location_lat: 40.7128,
    location_lng: -74.0060,
    date: date,   // "YYYY-MM-DD"
    time: time,   // "HH:MM"
    timezone: "America/New_York",
    reward_description: rewardDescription,
    reward_link: "POTTERY5",
    send_email: false
  };
  var options = {
    method: "post",
    contentType: "application/json",
    headers: { "x-api-key": "YOUR_BONDZY_API_KEY" },
    payload: JSON.stringify(payload)
  };
  var response = UrlFetchApp.fetch(url, options);
  Logger.log(response.getContentText());
}
```

### The Pottery Spottery Notes - May 8, 2026

The Google Apps Script caller was updated to send:

```javascript
reward_description: REWARD_DESCRIPTION,
reward_link: REWARD_LINK,
timezone: 'America/New_York',
send_email: false
```

`REWARD_LINK` can be plain text for now, such as:

```javascript
var REWARD_LINK = 'You got the reward!';
```

This is intentionally stored privately in `bondzy_secrets.reward_value` and revealed only after successful redemption. The current field name is historical; future cleanup can rename the API-facing concept to `reward_payload` or `reward_value`.

---

## Re-deploying After Code Changes

If the Edge Function code is ever updated, redeploy it with:

```powershell
cd C:\Users\rkurz\bondzy-project
git pull
supabase functions deploy create-bondzy --no-verify-jwt
```

---

## Known Follow-Up

Promise Bondzies still deserve a separate review. Phase 1 focused on Reward Bondzies. Promise penalties use a different reveal path, so they should be tightened deliberately instead of mixed into the Reward API change.

---

---

### scripts/create-bondzy.js — May 11, 2026

The `scripts/create-bondzy.js` one-off script was rewritten to call this API endpoint instead of talking directly to Supabase and Brevo. Previously it had its own inline email builder that produced a different-looking email from the one generated by the web app. Now it routes through the same edge function and shared email template.

**Environment variables changed:**

| Removed | Added |
|---------|-------|
| `SUPABASE_SERVICE_ROLE_KEY` | `BONDZY_API_KEY` |
| `BREVO_API_KEY` | *(not needed)* |

`SUPABASE_URL` and `CREATOR_EMAIL` are unchanged.

Before running the script, edit the `BONDZY` config block at the top of the file and fill in `rewardLink` with the actual reward value for that Bondzy (promo code, PayPal link, plain text, etc.).

---

*Documentation created April 3, 2026. Updated May 9, 2026 for Phase 2 claim-token links. Updated May 11, 2026 for scripts/create-bondzy.js rewrite.*
