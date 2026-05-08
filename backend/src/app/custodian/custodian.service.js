const jwt = require("jsonwebtoken");
const repo = require("./custodian.repository");
const handoverRepo = require("../handover/handover.repository");
const { query } = require("../../core/db/postgres");
const sms = require("../../core/sms");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const VALID_ACTOR_TYPES = ["ACTOR_SENDER", "ACTOR_COURIER", "ACTOR_HUB", "ACTOR_RECEIVER"];

async function createCustodianSession({ handoverEventId, shipmentId, waybillId, phone, receiverName, receiverActorType }) {
  if (!phone) return null;
  const session = await repo.createSession({ handoverEventId, shipmentId, waybillId, phone, receiverName, receiverActorType });
  const link = `${FRONTEND_URL}/handover/driver?ref=${session.id}`;
  await sms.sendSms(phone, `Trackam: You now hold custody of this package. To hand it over, visit: ${link}`);
  return session;
}

function normalizePhone(p) {
  return String(p || "").replace(/\s+/g, "").replace(/^\+234/, "0").replace(/^234/, "0");
}

async function requestOtp({ sessionId, phone }) {
  if (!sessionId || !phone) throw Object.assign(new Error("sessionId and phone are required"), { status: 400 });
  const session = await repo.getSessionById(sessionId);
  if (!session) throw Object.assign(new Error("Session not found"), { status: 404 });
  if (session.invalidatedAt) throw Object.assign(new Error("This handover session has been closed"), { status: 410 });
  if (normalizePhone(session.phone) !== normalizePhone(phone)) {
    throw Object.assign(new Error("Phone number does not match this handover session"), { status: 403 });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  await repo.setOtp(sessionId, otp);
  await sms.sendSms(phone, `Your Trackam handover code: ${otp}. Valid 10 minutes. Do not share.`);
  return { sent: true };
}

async function verifyOtp({ sessionId, otp }) {
  if (!sessionId || !otp) throw Object.assign(new Error("sessionId and otp are required"), { status: 400 });
  const result = await repo.verifyOtpAndIssueToken(sessionId, otp);
  if (!result) throw Object.assign(new Error("Invalid or expired OTP"), { status: 401 });

  const token = jwt.sign(
    {
      sub: result.id,
      type: "custodian",
      shipmentId: result.shipmentId,
      waybillId: result.waybillId,
      name: result.receiverName,
      phone: result.phone,
      actorType: result.receiverActorType,
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  return { token, name: result.receiverName, actorType: result.receiverActorType, shipmentId: result.shipmentId };
}

// Driver lost their SMS link — find their active session by phone and re-send.
async function resendLink(phone) {
  if (!phone) throw Object.assign(new Error("phone is required"), { status: 400 });
  const sessions = await repo.findActiveByPhone(phone);
  if (!sessions.length) {
    throw Object.assign(new Error("No active custody session found for this phone number"), { status: 404 });
  }
  // Re-send link for the most recent active session
  const session = sessions[0];
  const link = `${FRONTEND_URL}/handover/driver?ref=${session.id}`;
  await sms.sendSms(phone, `Trackam: Your custody link: ${link}`);
  return { sent: true, sessionId: session.id };
}

async function getCustodyInfo(sessionId) {
  const session = await repo.getSessionById(sessionId);
  if (!session) throw Object.assign(new Error("Session not found"), { status: 404 });
  if (session.invalidatedAt) throw Object.assign(new Error("This custody session has been closed"), { status: 410 });

  const res = await query(
    `SELECT s.goods_description, s.pickup_location, s.delivery_location, s.status,
            s.waybill_id, lw.waybill_number
     FROM shipments s
     LEFT JOIN lite_waybills lw ON lw.id = s.waybill_id
     WHERE s.id = $1`,
    [session.shipmentId]
  );
  const row = res.rows[0];
  if (!row) throw Object.assign(new Error("Shipment not found"), { status: 404 });

  return {
    sessionId: session.id,
    name: session.receiverName,
    actorType: session.receiverActorType,
    shipment: {
      goodsDescription: row.goods_description,
      pickupLocation: row.pickup_location,
      deliveryLocation: row.delivery_location,
      status: row.status,
    },
    waybillId: row.waybill_id || null,
    waybillNumber: row.waybill_number || null,
  };
}

async function initiateHandover(custodian, { actorType }) {
  if (!actorType || !VALID_ACTOR_TYPES.includes(actorType)) {
    throw Object.assign(new Error(`actorType must be one of: ${VALID_ACTOR_TYPES.join(", ")}`), { status: 400 });
  }

  const tokenRecord = await handoverRepo.createToken({
    shipmentId: custodian.shipmentId,
    userId: null,
    actorType,
    custodianSessionId: custodian.sessionId,
    giverName: custodian.name,
    giverPhone: custodian.phone,
  });

  return {
    token: tokenRecord.token,
    expiresAt: tokenRecord.expiresAt,
    shipmentId: custodian.shipmentId,
  };
}

module.exports = { createCustodianSession, requestOtp, verifyOtp, resendLink, getCustodyInfo, initiateHandover };
