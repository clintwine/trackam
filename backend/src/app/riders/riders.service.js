const repo = require("./riders.repository");
const oliClient = require("../oli/oli.client");

/**
 * Map Postgres unique-violation errors on (user_id, phone) and
 * (user_id, email) into clean 409s the frontend can surface inline.
 */
function mapUniqueViolation(err) {
  if (err && err.code === "23505") {
    if (err.constraint === "uniq_riders_user_phone" || /phone/i.test(err.detail || "")) {
      return Object.assign(
        new Error("Another rider on your team is already using this phone number."),
        { status: 409, field: "phone" }
      );
    }
    if (err.constraint === "uniq_riders_user_email" || /email/i.test(err.detail || "")) {
      return Object.assign(
        new Error("Another rider on your team is already using this email."),
        { status: 409, field: "email" }
      );
    }
  }
  return err;
}

async function listRiders(userId) {
  return repo.list(userId);
}

async function getRider(id, userId) {
  const rider = await repo.getById(id, userId);
  if (!rider) throw Object.assign(new Error("Rider not found"), { status: 404 });
  return rider;
}

async function createRider(userId, body) {
  const { name, phone, email, vehicleType, cityCoverage, baseFee = 0 } = body;
  if (!name || !phone || !email || !vehicleType || !cityCoverage) {
    throw Object.assign(new Error("name, phone, email, vehicleType, and cityCoverage are required"), { status: 400 });
  }
  const validTypes = ["bike", "tricycle", "van", "truck"];
  if (!validTypes.includes(vehicleType)) {
    throw Object.assign(new Error(`vehicleType must be one of: ${validTypes.join(", ")}`), { status: 400 });
  }
  try {
    return await repo.create({
      userId, name, phone,
      email: String(email).trim().toLowerCase(),
      vehicleType, cityCoverage, baseFee,
    });
  } catch (err) {
    throw mapUniqueViolation(err);
  }
}

async function updateRider(id, userId, body) {
  const before = await getRider(id, userId);
  const fields = { ...body };
  if (fields.email !== undefined && fields.email !== null) {
    fields.email = String(fields.email).trim().toLowerCase();
  }

  let updated;
  try {
    updated = await repo.update(id, userId, fields);
  } catch (err) {
    throw mapUniqueViolation(err);
  }

  // If phone or email changed, push the new contact onto any active custody
  // sessions on OLI Switch so future OTPs / link resends reach the rider.
  // Fire-and-forget — if the switch is unreachable, the rider edit still
  // succeeds. The next successful edit will retry.
  const phoneChanged = updated.phone && updated.phone !== before.phone;
  const emailChanged = (updated.email || null) !== (before.email || null);
  if (phoneChanged || emailChanged) {
    oliClient.post(userId, "/api/custodian/sessions/contact", {
      oldPhone: before.phone,
      phone:    updated.phone,
      email:    updated.email,
    }).then((result) => {
      if (result?.skipped) {
        console.warn(`[riders] OLI sync skipped for ${updated.name} — ${result.reason}`);
      } else if (result?.updated > 0) {
        console.log(`[riders] OLI sync — pushed contact to ${result.updated} session(s) for ${updated.name}`);
      }
    }).catch((err) => {
      console.error(`[riders] OLI sync failed for ${updated.name}:`, err?.message || err);
    });
  }

  return updated;
}

async function deactivateRider(id, userId) {
  await getRider(id, userId);
  return repo.deactivate(id, userId);
}

module.exports = { listRiders, getRider, createRider, updateRider, deactivateRider };
