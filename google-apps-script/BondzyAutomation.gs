/************************************************************
 * THE POTTERY SPOTTERY
 * Bondzy Automation — Auto-create Reward Bondzies
 * from new Acuity appointments during qualifying windows.
 *
 * FILE: BondzyAutomation.gs
 * Add this as a new file in the same Apps Script project
 * as Code.gs. Do NOT modify Code.gs.
 ************************************************************/


/************************************************************
 * CONFIGURATION — edit this section as needed
 ************************************************************/

// Your Bondzy account email (must exist as a Bondzy account)
var BONDZY_CREATOR_EMAIL = 'rkurzban@gmail.com';

// The Bondzy API endpoint
var BONDZY_API_URL = 'https://wbbkutufcmrxjdbmhgbv.supabase.co/functions/v1/create-bondzy';

// Your studio details — used for every Bondzy
// To find lat/lng: go to Google Maps, right-click your studio, click the coordinates
var STUDIO_NAME    = 'The Pottery Spottery';
var STUDIO_ADDRESS = '123 Your Street, Your Town, PA 00000'; // ← UPDATE THIS
var STUDIO_LAT     = 40.0000;  // ← UPDATE THIS (right-click studio in Google Maps)
var STUDIO_LNG     = -75.0000; // ← UPDATE THIS

// What the reward says
var REWARD_DESCRIPTION = '$5 off your next visit';

// How many minutes of grace period around the appointment time
var GRACE_MINUTES = 10;

// How far back (in minutes) to look for new appointments each run.
// Should match how often the trigger fires (default: every 15 minutes).
var POLL_MINUTES = 15;

// -------------------------------------------------------
// BONDZY WINDOW CONDITIONS
// Controls which appointments qualify for a Bondzy.
//
// Format: day-of-week (0=Sun, 1=Mon, ... 3=Wed ... 6=Sat)
//   maps to an array of {start, end} hour ranges (24-hour).
//   An empty array [] means that day is closed / no Bondzies.
//
// Current setting: WEDNESDAY only, 12pm–8pm (testing window)
// -------------------------------------------------------
var BONDZY_WINDOWS = {
  0: [],                          // Sunday    — off
  1: [],                          // Monday    — off
  2: [],                          // Tuesday   — off
  3: [{ start: 12, end: 20 }],   // Wednesday — 12pm to 8pm ✓
  4: [],                          // Thursday  — off
  5: [],                          // Friday    — off
  6: []                           // Saturday  — off
};

// -------------------------------------------------------
// TESTING MODE
// While true, ALL Bondzies go to the address below
// instead of the actual customer. Set to false when
// you are ready to go live with real customers.
// -------------------------------------------------------
var TESTING_MODE = true;

// *** DELETE AFTER TESTING — replace with real customer email ***
var TESTING_RECIPIENT_EMAIL = 'rkurzban@gmail.com';
var TESTING_RECIPIENT_NAME  = 'Rob (Test)';
// *** END DELETE AFTER TESTING ***


/************************************************************
 * MAIN FUNCTION
 * Set this as the trigger: runs every 15 minutes.
 * In Apps Script: Triggers → Add Trigger →
 *   Function: checkNewAppointmentsForBondzy
 *   Event source: Time-driven → Minutes timer → Every 15 minutes
 ************************************************************/
function checkNewAppointmentsForBondzy() {
  var apiKey = PropertiesService.getScriptProperties().getProperty('BONDZY_API_KEY');
  if (!apiKey) {
    Logger.log('ERROR: BONDZY_API_KEY not set in Script Properties. Aborting.');
    return;
  }

  var appointments = getRecentAcuityAppointments_();
  if (!appointments || appointments.length === 0) {
    Logger.log('No new appointments found in the last ' + POLL_MINUTES + ' minutes.');
    return;
  }

  Logger.log('Found ' + appointments.length + ' new appointment(s). Checking Bondzy windows...');

  var processed = getProcessedIds_();
  var created = 0;

  appointments.forEach(function(appt) {
    var id = String(appt.id);

    // Skip if we already created a Bondzy for this appointment
    if (processed[id]) {
      Logger.log('Skipping appt ' + id + ' — Bondzy already created.');
      return;
    }

    var apptDate = new Date(appt.datetime);
    var dayOfWeek = apptDate.getDay();
    var hour = apptDate.getHours();

    // Check if this appointment falls in a qualifying window
    if (!qualifiesForBondzy_(dayOfWeek, hour)) {
      Logger.log('Skipping appt ' + id + ' — outside Bondzy window (' +
        ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek] + ' ' + hour + ':00).');
      return;
    }

    // Build recipient info
    // *** DELETE AFTER TESTING: the two lines below override the real customer ***
    var recipientEmail = TESTING_MODE ? TESTING_RECIPIENT_EMAIL : appt.email;
    var recipientName  = TESTING_MODE ? TESTING_RECIPIENT_NAME  : (appt.firstName + ' ' + appt.lastName);
    // *** END DELETE AFTER TESTING — in production, recipientEmail = appt.email ***

    // Format date and time for the Bondzy API
    var dateStr = Utilities.formatDate(apptDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var timeStr = Utilities.formatDate(apptDate, Session.getScriptTimeZone(), 'HH:mm');

    Logger.log('Creating Bondzy for appt ' + id + ': ' + recipientName +
      ' <' + recipientEmail + '> on ' + dateStr + ' at ' + timeStr);

    var success = createBondzy_(apiKey, recipientEmail, recipientName, dateStr, timeStr);

    if (success) {
      markProcessed_(processed, id);
      created++;
      Logger.log('✓ Bondzy created for appt ' + id);
    } else {
      Logger.log('✗ Bondzy creation FAILED for appt ' + id + ' — will retry next run.');
    }
  });

  Logger.log('Done. Created ' + created + ' Bondzy(s) this run.');
}


/************************************************************
 * HELPER: Fetch recent Acuity appointments
 ************************************************************/
function getRecentAcuityAppointments_() {
  var acuityUserId = PropertiesService.getScriptProperties().getProperty('ACUITY_USER_ID');
  var acuityApiKey = PropertiesService.getScriptProperties().getProperty('ACUITY_API_KEY');

  if (!acuityUserId || !acuityApiKey) {
    Logger.log('ERROR: ACUITY_USER_ID or ACUITY_API_KEY not set in Script Properties.');
    return [];
  }

  // Look back far enough to cover the polling window plus a small buffer
  var minDate = new Date(Date.now() - (POLL_MINUTES + 2) * 60 * 1000);
  var minDateStr = Utilities.formatDate(minDate, 'UTC', "yyyy-MM-dd'T'HH:mm:ss'Z'");

  var url = 'https://acuityscheduling.com/api/v1/appointments' +
    '?minDate=' + encodeURIComponent(minDateStr) +
    '&calendarID=' + ACUITY_CALENDAR_ID +
    '&max=50';

  var credentials = Utilities.base64Encode(acuityUserId + ':' + acuityApiKey);
  var options = {
    method: 'get',
    headers: { 'Authorization': 'Basic ' + credentials },
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() !== 200) {
      Logger.log('Acuity API error: ' + response.getResponseCode() + ' ' + response.getContentText());
      return [];
    }
    return JSON.parse(response.getContentText());
  } catch (e) {
    Logger.log('Exception calling Acuity API: ' + e.message);
    return [];
  }
}


/************************************************************
 * HELPER: Check if a day+hour falls in a Bondzy window
 ************************************************************/
function qualifiesForBondzy_(dayOfWeek, hour) {
  var windows = BONDZY_WINDOWS[dayOfWeek];
  if (!windows || windows.length === 0) return false;
  for (var i = 0; i < windows.length; i++) {
    if (hour >= windows[i].start && hour < windows[i].end) return true;
  }
  return false;
}


/************************************************************
 * HELPER: Call the Bondzy API to create a Reward Bondzy
 ************************************************************/
function createBondzy_(apiKey, recipientEmail, recipientName, dateStr, timeStr) {
  var payload = {
    type: 'reward',
    creator_email: BONDZY_CREATOR_EMAIL,
    recipient_email: recipientEmail,
    recipient_name: recipientName,
    location_name: STUDIO_NAME,
    location_address: STUDIO_ADDRESS,
    location_lat: STUDIO_LAT,
    location_lng: STUDIO_LNG,
    date: dateStr,
    time: timeStr,
    grace_minutes: GRACE_MINUTES,
    reward_description: REWARD_DESCRIPTION
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-api-key': apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(BONDZY_API_URL, options);
    if (response.getResponseCode() === 201) return true;
    Logger.log('Bondzy API error: ' + response.getResponseCode() + ' ' + response.getContentText());
    return false;
  } catch (e) {
    Logger.log('Exception calling Bondzy API: ' + e.message);
    return false;
  }
}


/************************************************************
 * HELPERS: Track which appointment IDs have been processed
 * Uses Script Properties so the memory survives between runs.
 ************************************************************/
function getProcessedIds_() {
  var raw = PropertiesService.getScriptProperties().getProperty('BONDZY_PROCESSED_IDS');
  return raw ? JSON.parse(raw) : {};
}

function markProcessed_(processed, id) {
  processed[id] = true;
  // Keep the stored list from growing forever — prune entries older than 90 days
  // (Acuity IDs are integers; we just track them as a set, no timestamps needed
  //  since the appointment minDate filter handles recency. Keep at most 500 entries.)
  var keys = Object.keys(processed);
  if (keys.length > 500) {
    var pruned = {};
    keys.slice(-400).forEach(function(k) { pruned[k] = true; });
    processed = pruned;
  }
  PropertiesService.getScriptProperties().setProperty('BONDZY_PROCESSED_IDS', JSON.stringify(processed));
}
