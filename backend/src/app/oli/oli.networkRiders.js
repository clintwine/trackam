/**
 * Push rider snapshots to OLI Switch's network-rider index.
 *
 * Called from riders.service on create / update / verify / reject. The
 * snapshot lets cross-operator handovers resolve "which verified rider
 * does this phone belong to?" — without this, a rider from operator A
 * couldn't authenticate against operator B's handover token.
 *
 * The govt_id_number is HMAC'd before push so OLI Switch never sees the
 * raw ID. The HMAC is one-way; OLI Switch just stores the hash and uses
 * it as an opaque identifier on the proof event.
 *
 * Fire-and-forget — never blocks the rider edit. Errors are logged but
 * don't propagate. Worst case: the next successful edit retries.
 */

const crypto = require("crypto");
const oliClient = require("./oli.client");

const HMAC_KEY = process.env.JWT_SECRET || "";

function hmacIdNumber(idNumber) {
  if (!idNumber || !HMAC_KEY) return null;
  return crypto
    .createHmac("sha256", HMAC_KEY)
    .update(String(idNumber).trim())
    .digest("hex");
}

function snapshotFromRider(rider) {
  return {
    externalRiderId:   rider.id,
    phone:             rider.phone,
    email:             rider.email || null,
    name:              rider.name,
    govtIdType:        rider.govtIdType || null,
    govtIdNumberHash:  hmacIdNumber(rider.govtIdNumber),
    verificationState: rider.verificationState || "missing",
    verifiedAt:        rider.govtIdVerifiedAt || null,
  };
}

async function sync(userId, rider) {
  if (!rider?.phone || !rider?.name) return;
  try {
    const result = await oliClient.post(userId, "/api/network-riders/sync", snapshotFromRider(rider));
    if (result?.skipped) {
      console.warn(`[network-riders] skipped sync for ${rider.name} — ${result.reason}`);
    }
  } catch (err) {
    console.error(`[network-riders] sync failed for ${rider.name}:`, err?.message || err);
  }
}

async function remove(userId, externalRiderId) {
  if (!externalRiderId) return;
  try {
    const result = await oliClient.del(userId, `/api/network-riders/${externalRiderId}`);
    if (result?.skipped) {
      console.warn(`[network-riders] skipped delete for ${externalRiderId} — ${result.reason}`);
    }
  } catch (err) {
    console.error(`[network-riders] delete failed for ${externalRiderId}:`, err?.message || err);
  }
}

module.exports = { sync, remove };
