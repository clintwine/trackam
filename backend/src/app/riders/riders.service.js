const repo = require("./riders.repository");
const oliClient = require("../oli/oli.client");

const VALID_ID_TYPES = ["nin", "voters_card", "passport", "drivers_license"];

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

function validateIdInput({ govtIdType, govtIdNumber, govtIdPhoto }, { required = false } = {}) {
  // All three fields are optional at create; if any is provided, type + number
  // must come together. Photo is optional but strongly recommended.
  if (govtIdType === undefined && govtIdNumber === undefined && govtIdPhoto === undefined) {
    if (required) {
      throw Object.assign(new Error("Government ID is required."), { status: 400 });
    }
    return;
  }
  if (govtIdType && !VALID_ID_TYPES.includes(govtIdType)) {
    throw Object.assign(
      new Error(`govtIdType must be one of: ${VALID_ID_TYPES.join(", ")}`),
      { status: 400, field: "govtIdType" }
    );
  }
  if (govtIdType && !govtIdNumber) {
    throw Object.assign(
      new Error("ID number is required when an ID type is selected."),
      { status: 400, field: "govtIdNumber" }
    );
  }
  if (govtIdNumber && !govtIdType) {
    throw Object.assign(
      new Error("Select an ID type before entering an ID number."),
      { status: 400, field: "govtIdType" }
    );
  }
}

async function listRiders(userId) {
  return repo.list(userId);
}

async function listPendingVerification(userId) {
  return repo.listPendingVerification(userId);
}

async function getRider(id, userId, opts = {}) {
  const rider = await repo.getById(id, userId, opts);
  if (!rider) throw Object.assign(new Error("Rider not found"), { status: 404 });
  return rider;
}

async function createRider(userId, body) {
  const { name, phone, email, vehicleType, cityCoverage, baseFee = 0,
          govtIdType, govtIdNumber, govtIdPhoto } = body;
  if (!name || !phone || !email || !vehicleType || !cityCoverage) {
    throw Object.assign(new Error("name, phone, email, vehicleType, and cityCoverage are required"), { status: 400 });
  }
  const validTypes = ["bike", "tricycle", "van", "truck"];
  if (!validTypes.includes(vehicleType)) {
    throw Object.assign(new Error(`vehicleType must be one of: ${validTypes.join(", ")}`), { status: 400 });
  }
  validateIdInput({ govtIdType, govtIdNumber, govtIdPhoto });

  try {
    return await repo.create({
      userId, name, phone,
      email: String(email).trim().toLowerCase(),
      vehicleType, cityCoverage, baseFee,
      govtIdType, govtIdNumber, govtIdPhoto,
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
  validateIdInput(fields);

  let updated;
  try {
    updated = await repo.update(id, userId, fields);
  } catch (err) {
    throw mapUniqueViolation(err);
  }

  // If phone or email changed, push the new contact onto any active custody
  // sessions on OLI Switch so future OTPs / link resends reach the rider.
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

async function verifyRider(id, userId, verifiedBy) {
  const rider = await getRider(id, userId);
  if (!rider.govtIdType || !rider.govtIdNumber) {
    throw Object.assign(
      new Error("Rider has not submitted an ID yet — nothing to verify."),
      { status: 400 }
    );
  }
  if (rider.govtIdVerifiedAt) {
    return rider; // idempotent
  }
  return repo.recordVerification(id, userId, { verifiedBy, decision: "approve" });
}

async function rejectRider(id, userId, verifiedBy, rejectionReason) {
  const rider = await getRider(id, userId);
  if (!rider.govtIdType || !rider.govtIdNumber) {
    throw Object.assign(
      new Error("Rider has not submitted an ID yet — nothing to reject."),
      { status: 400 }
    );
  }
  const reason = String(rejectionReason || "").trim();
  if (!reason) {
    throw Object.assign(
      new Error("A rejection reason is required so the rider knows what to fix."),
      { status: 400, field: "rejectionReason" }
    );
  }
  return repo.recordVerification(id, userId, {
    verifiedBy, decision: "reject", rejectionReason: reason,
  });
}

async function deactivateRider(id, userId) {
  await getRider(id, userId);
  return repo.deactivate(id, userId);
}

module.exports = {
  listRiders, listPendingVerification, getRider,
  createRider, updateRider,
  verifyRider, rejectRider,
  deactivateRider,
};
