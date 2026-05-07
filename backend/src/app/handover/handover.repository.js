const { query } = require("../../core/db/postgres");
const crypto = require("crypto");

const TOKEN_TTL_MINUTES = 30;

function mapToken(row) {
  if (!row) return null;
  return {
    id: row.id,
    shipmentId: row.shipment_id,
    userId: row.user_id,
    token: row.token,
    actorType: row.actor_type,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    createdAt: row.created_at,
  };
}

function mapEvent(row) {
  if (!row) return null;
  return {
    id: row.id,
    shipmentId: row.shipment_id,
    tokenId: row.token_id,
    giverUserId: row.giver_user_id,
    giverActorType: row.giver_actor_type,
    receiverName: row.receiver_name,
    receiverBvn: row.receiver_bvn,
    receiverPhone: row.receiver_phone,
    receiverActorType: row.receiver_actor_type,
    proofHash: row.proof_hash,
    latitude: row.latitude ? Number(row.latitude) : null,
    longitude: row.longitude ? Number(row.longitude) : null,
    occurredAt: row.occurred_at,
  };
}

async function createToken({ shipmentId, userId, actorType }) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);
  const result = await query(
    `INSERT INTO handover_tokens (shipment_id, user_id, token, actor_type, expires_at)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [shipmentId, userId, token, actorType, expiresAt]
  );
  return mapToken(result.rows[0]);
}

async function getToken(token) {
  const result = await query(
    `SELECT * FROM handover_tokens WHERE token = $1`,
    [token]
  );
  return mapToken(result.rows[0]);
}

async function markTokenUsed(tokenId) {
  await query(
    `UPDATE handover_tokens SET used_at = NOW() WHERE id = $1`,
    [tokenId]
  );
}

async function createEvent({
  shipmentId, tokenId, giverUserId, giverActorType,
  receiverName, receiverBvn, receiverPhone, receiverActorType,
  latitude, longitude,
}) {
  const timestamp = new Date().toISOString();
  const proofHash = crypto
    .createHash("sha256")
    .update(`${tokenId}:${shipmentId}:${receiverBvn}:${timestamp}`)
    .digest("hex");

  const result = await query(
    `INSERT INTO handover_events
       (shipment_id, token_id, giver_user_id, giver_actor_type,
        receiver_name, receiver_bvn, receiver_phone, receiver_actor_type,
        proof_hash, latitude, longitude)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [
      shipmentId, tokenId, giverUserId, giverActorType,
      receiverName, receiverBvn, receiverPhone || null, receiverActorType,
      proofHash, latitude || null, longitude || null,
    ]
  );
  return mapEvent(result.rows[0]);
}

async function listEvents(shipmentId) {
  const result = await query(
    `SELECT * FROM handover_events WHERE shipment_id = $1 ORDER BY occurred_at ASC`,
    [shipmentId]
  );
  return result.rows.map(mapEvent);
}

module.exports = { createToken, getToken, markTokenUsed, createEvent, listEvents };
