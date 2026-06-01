/**
 * Backfill: push the current rider contact info from each operator's local
 * roster onto any active custody sessions on OLI Switch.
 *
 * Use this once after deploying the rider edit → switch sync feature, to
 * fix riders whose sessions were created before they had an email on file.
 * After this runs once, the live sync in riders.service.updateRider keeps
 * things in step going forward.
 *
 * Usage:
 *   node scripts/backfillRiderContacts.js
 *
 * The script:
 *  - Loads every active rider (grouped by operator user_id)
 *  - For each rider, calls POST /api/custodian/sessions/contact on the switch
 *  - Reports per-rider results and a final summary
 *
 * Safe to re-run — the switch endpoint is idempotent (it just rewrites the
 * contact columns on matching active sessions).
 */

require("dotenv").config();
const { query } = require("../src/core/db/postgres");
const oliClient = require("../src/app/oli/oli.client");

async function main() {
  console.log("[backfill] starting rider contact backfill…");

  const result = await query(
    `SELECT id, user_id, name, phone, email
       FROM riders
      WHERE is_active = TRUE
      ORDER BY user_id, name`,
    []
  );
  const riders = result.rows;
  if (riders.length === 0) {
    console.log("[backfill] no active riders found — nothing to do.");
    return;
  }

  console.log(`[backfill] ${riders.length} active rider(s) across the platform`);

  let pushedSessions = 0;
  let okRiders       = 0;
  let skipped        = 0;
  let failed         = 0;

  for (const rider of riders) {
    try {
      const res = await oliClient.post(rider.user_id, "/api/custodian/sessions/contact", {
        oldPhone: rider.phone,
        phone:    rider.phone,
        email:    rider.email,
      });
      if (res?.skipped) {
        skipped++;
        console.log(`  · skip   ${rider.name} (${rider.user_id}) — ${res.reason}`);
      } else {
        okRiders++;
        pushedSessions += res?.updated || 0;
        if (res?.updated > 0) {
          console.log(`  · push   ${rider.name} — updated ${res.updated} session(s)`);
        }
      }
    } catch (err) {
      failed++;
      console.error(`  · fail   ${rider.name} — ${err?.message || err}`);
    }
  }

  console.log("");
  console.log("[backfill] summary");
  console.log(`  riders processed : ${riders.length}`);
  console.log(`  sync ok          : ${okRiders}`);
  console.log(`  sessions updated : ${pushedSessions}`);
  console.log(`  skipped (no key) : ${skipped}`);
  console.log(`  failed           : ${failed}`);
}

main()
  .catch((err) => {
    console.error("[backfill] fatal:", err);
    process.exitCode = 1;
  })
  .finally(() => {
    // Force exit — pg pool keeps the event loop alive otherwise.
    setTimeout(() => process.exit(process.exitCode || 0), 100);
  });
