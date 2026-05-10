/**
 * Bondzy RLS smoke test.
 *
 * Required environment variables:
 * - SUPABASE_URL or VITE_SUPABASE_URL
 * - SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * This creates temporary users/rows, verifies access boundaries, and cleans up.
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY");
}

const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const stamp = Date.now();
const password = `BondzyRls-${stamp}!`;
const emails = {
  creator: `rls-creator-${stamp}@example.com`,
  recipient: `rls-recipient-${stamp}@example.com`,
  stranger: `rls-stranger-${stamp}@example.com`,
};

const createdUserIds = [];
let bondzyId = null;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function createUser(email, name) {
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error) throw error;
  createdUserIds.push(data.user.id);

  const { error: profileError } = await service.from("profiles").upsert({
    id: data.user.id,
    email,
    name,
  });
  if (profileError) throw profileError;
  return data.user;
}

async function signIn(email) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

async function selectBondzy(client, id) {
  return client.from("bondzies").select("id,creator_id,recipient_id").eq("id", id);
}

async function expectNoRows(label, result) {
  if (result.error) return;
  assert((result.data || []).length === 0, `${label}: expected no rows`);
}

async function cleanup() {
  if (bondzyId) await service.from("bondzies").delete().eq("id", bondzyId);
  for (const id of createdUserIds) {
    await service.from("profiles").delete().eq("id", id);
    await service.auth.admin.deleteUser(id);
  }
}

async function main() {
  try {
    const creator = await createUser(emails.creator, "RLS Creator");
    const recipient = await createUser(emails.recipient, "RLS Recipient");
    await createUser(emails.stranger, "RLS Stranger");

    const { data: bondzy, error: insertError } = await service
      .from("bondzies")
      .insert({
        type: "reward",
        status: "active",
        creator_id: creator.id,
        creator_email: emails.creator,
        creator_name: "RLS Creator",
        recipient_id: recipient.id,
        recipient_email: emails.recipient,
        recipient_name: "RLS Recipient",
        location_name: "RLS Test Location",
        location_address: "",
        location_lat: 40,
        location_lng: -75,
        date: "2099-01-01",
        time: "12:00",
        timezone: "America/New_York",
        grace_minutes: 10,
        reward_description: "RLS test reward",
      })
      .select("id")
      .single();
    if (insertError) throw insertError;
    bondzyId = bondzy.id;

    await expectNoRows("anon bondzies", await anon.from("bondzies").select("id").eq("id", bondzyId));
    await expectNoRows("anon profiles", await anon.from("profiles").select("id").eq("id", creator.id));
    await expectNoRows("anon secrets", await anon.from("bondzy_secrets").select("bondzy_id").limit(1));
    await expectNoRows("anon claims", await anon.from("bondzy_claims").select("bondzy_id").limit(1));

    const creatorClient = await signIn(emails.creator);
    const recipientClient = await signIn(emails.recipient);
    const strangerClient = await signIn(emails.stranger);

    const creatorRead = await selectBondzy(creatorClient, bondzyId);
    assert(!creatorRead.error && creatorRead.data.length === 1, "creator should read created Bondzy");

    const recipientRead = await selectBondzy(recipientClient, bondzyId);
    assert(!recipientRead.error && recipientRead.data.length === 1, "recipient should read received Bondzy");

    await expectNoRows("stranger bondzies", await selectBondzy(strangerClient, bondzyId));

    const recipientUpdate = await recipientClient
      .from("bondzies")
      .update({ status: "forfeit" })
      .eq("id", bondzyId)
      .select("id");
    await expectNoRows("recipient update", recipientUpdate);

    const creatorDelete = await creatorClient.from("bondzies").delete().eq("id", bondzyId).select("id");
    assert(!creatorDelete.error && creatorDelete.data.length === 1, "creator should delete created Bondzy");
    bondzyId = null;

    console.log("RLS smoke test passed.");
  } finally {
    await cleanup();
  }
}

main().catch(async (error) => {
  console.error(error.message || error);
  await cleanup();
  process.exit(1);
});
