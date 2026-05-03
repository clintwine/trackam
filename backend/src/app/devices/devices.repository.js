const { query } = require("../../core/db/postgres");

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    uid: row.uid,
    deviceId: row.device_id,
    lastSeen: row.last_seen,
    isCurrent: Boolean(row.is_current),
  };
}

async function listForUser(uid) {
  const result = await query(
    `SELECT id, uid, device_id, last_seen, is_current
     FROM devices
     WHERE uid = $1
     ORDER BY last_seen DESC`,
    [uid]
  );
  return result.rows.map(mapRow).filter(Boolean);
}

async function registerDevice(uid, deviceId) {
  const now = Date.now();
  const safeDeviceId = String(deviceId || "").replace(/[^a-zA-Z0-9_-]/g, "_");
  const docId = `${uid}__${safeDeviceId || "device"}`;

  await query(
    `INSERT INTO devices (id, uid, device_id, last_seen, is_current)
     VALUES ($1, $2, $3, $4, true)
     ON CONFLICT (id) DO UPDATE SET
       device_id = EXCLUDED.device_id,
       last_seen = EXCLUDED.last_seen,
       is_current = true`,
    [docId, uid, deviceId, now]
  );

  await query(
    `UPDATE devices
     SET is_current = false
     WHERE uid = $1 AND id <> $2 AND is_current = true`,
    [uid, docId]
  );

  const result = await query(
    `SELECT id, uid, device_id, last_seen, is_current
     FROM devices
     WHERE id = $1`,
    [docId]
  );

  return mapRow(result.rows[0]);
}

module.exports = {
  listForUser,
  registerDevice,
};
