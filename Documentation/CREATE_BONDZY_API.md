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
5. Sends a notification email to the recipient via Brevo
6. Sends a confirmation email to the creator via Brevo
7. Returns the created Bondzy details as a JSON response

**Deployment steps taken:**
- Installed the Supabase CLI on Windows via Scoop
- Authenticated the CLI with `supabase login`
- Linked the CLI to the Bondzy Supabase project (`supabase link --project-ref wbbkutufcmrxjdbmhgbv`)
- Set two secrets in the Supabase dashboard: `BONDZY_API_KEY` and `BREVO_API_KEY` (the `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL` are injected automatically by Supabase)
- Deployed with `supabase functions deploy create-bondzy --no-verify-jwt`

---

## Endpoint Reference

### URL

```
POST https://wbbkutufcmrxjdbmhgbv.supabase.co/functions/v1/create-bondzy
```

### Authentication

Every request must include an `x-api-key` header containing the `BONDZY_API_KEY` secret. Requests without it, or with the wrong key, receive a `401 Unauthorized` response.

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
| `reward_link` | string | No | A URL or code for redeeming the reward (optional) |
| `grace_minutes` | number | No | Minutes of grace period around the scheduled time. Defaults to `10`. |

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
  "reward_description": "$5 off your next visit",
  "reward_link": "https://..."
}
```

### Successful Response

**Status: `201 Created`**

```json
{
  "success": true,
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
    "reward_description": "$5 off your next visit",
    "created_at": "2026-04-10T12:00:00Z"
  }
}
```

### Error Responses

| Status | Meaning |
|---|---|
| `401` | Missing or wrong `x-api-key` |
| `400` | Missing a required field, invalid `type` value, or `creator_email` not found in Bondzy |
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

The fields that vary per call are: `recipient_email`, `recipient_name`, `date`, `time`, `reward_description`.

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
    "reward_description": "$5 off your next visit"
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
    reward_description: rewardDescription
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

---

## Re-deploying After Code Changes

If the Edge Function code is ever updated, redeploy it with:

```powershell
cd C:\Users\rkurz\bondzy-project
git pull origin claude/bondzy-api-endpoint-BH3ci
supabase functions deploy create-bondzy --no-verify-jwt
```

---

*Documentation created April 3, 2026.*
