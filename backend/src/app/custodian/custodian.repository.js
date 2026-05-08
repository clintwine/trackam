const { query } = require("../../core/db/postgres");
const crypto = require("crypto");

const OTP_TTL_MINUTES = 10;
const SESSION_TTL_HOURS = 24;

function mapSession(row) {
  if (!row) return null;
  return {
    id: row.id,
    handoverEventId: row.handover_event_id,
    shipmentId: row.shipment_id,
    waybillId: row.waybill_id || null,
    phone: row.phone,
    receiverName: row.receiver_name,
    receiverActorType: row.receiver_actor_type,
    otpExpiresAt: row.otp_expires_at || null,
    sessionToken: row.session_token || null,
    sessionExpiresAt: row.session_expires_at || null,
    verifiedAt: row.verified_at || null,
    invalidatedAt: row.invalidated_at || null,
    createdAt: row.created_at,
  };
}

async function createSession({ handoverEventId, shipmentId, waybillId, phone, receiverName, receiverActorType }) {
  const result = await query(
    `INSERT INTO custodian_sessions
       (handover_event_id, shipment_id, waybill_id, phone, receiver_name, receiver_actor_type)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [handoverEventId, shipmentId, waybillId || null, phone, receiverName, receiverActorType]
  );
  return mapSession(result.rows[0]);
}

async function getSessionById(id) {
  const result = await query(`SELECT * FROM custodian_sessions WHERE id = $1`, [id]);
  return mapSession(result.rows[0]);
}

async function setOtp(sessionId, plainOtp) {
  const hash = crypto.createHash("sha256").update(plainOtp).digest("hex");
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await query(
    `UPDATE custodian_sessions SET otp_hash = $1, otp_expires_at = $2 WHERE id = $3`,
    [hash, expiresAt, sessionId]
  );
}

async function verifyOtpAndIssueToken(sessionId, plainOtp) {
  const session = await getSessionById(sessionId);
  if (!session) return null;
  if (!session.otpExpiresAt || new Date(session.otpExpiresAt) < new Date()) return null;

  const hash = crypto.createHash("sha256").update(plainOtp).digest("hex");
  const check = await query(
    `SELECT id FROM custodian_sessions WHERE id = $1 AND otp_hash = $2`,
    [sessionId, hash]
  );
  if (!check.rows[0]) return null;

  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

  await query(
    `UPDATE custodian_sessions
       SET session_token = $1, session_expires_at = $2, verified_at = NOW(), otp_hash = NULL
     WHERE id = $3`,
    [sessionToken, expiresAt, sessionId]
  );

  return { ...session, sessionToken, sessionExpiresAt: expiresAt };
}

// Find active (verified, not expired, not invalidated) sessions for a phone number.
// Used to re-send the custody link when the driver lost their SMS.
async function findActiveByPhone(phone) {
  const result = await query(
    `SELECT * FROM custodian_sessions
     WHERE phone = $1
       AND verified_at IS NULL             -- not yet verified (still pending pickup)
          OR (
            verified_at IS NOT NULL        -- or already verified but still live
            AND session_expires_at > NOW()
          )
     AND invalidated_at IS NULL
     ORDER BY created_at DESC
     LIMIT 5`,
    [phone]
  );
  return result.rows.map(mapSession);
}

// Cancel all active sessions for a shipment (called when ACTOR_RECEIVER confirms delivery)
async function invalidateForShipment(shipmentId) {
  await query(
    `UPDATE custodian_sessions
       SET invalidated_at = NOW()
     WHERE shipment_id = $1 AND invalidated_at IS NULL`,
    [shipmentId]
  );
}

// Cancel a specific session (called when the holder successfully passes custody)
async function invalidateById(sessionId) {
  await query(
    `UPDATE custodian_sessions SET invalidated_at = NOW() WHERE id = $1 AND invalidated_at IS NULL`,
    [sessionId]
  );
}

module.exports = {
  createSession, getSessionById, setOtp, verifyOtpAndIssueToken,
  findActiveByPhone, invalidateForShipment, invalidateById,
};
