const { query } = require("../../core/db/postgres");
const { v4: uuidv4 } = require("uuid");

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    uid: row.uid,
    createdAt: row.created_at,
    ip: row.ip,
    userAgent: row.user_agent,
    endedAt: row.ended_at,
  };
}

async function listForUser(uid, limit = 20) {
  const result = await query(
    `SELECT id, uid, created_at, ip, user_agent, ended_at
     FROM sessions
     WHERE uid = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [uid, limit]
  );
  return result.rows.map(mapRow).filter(Boolean);
}

async function createSession(uid, { ip = null, userAgent = null } = {}) {
  const id = uuidv4();
  const createdAt = Date.now();
  const result = await query(
    `INSERT INTO sessions (id, uid, ip, user_agent, created_at, ended_at)
     VALUES ($1, $2, $3, $4, $5, NULL)
     RETURNING id, uid, created_at, ip, user_agent, ended_at`,
    [id, uid, ip, userAgent, createdAt]
  );
  return mapRow(result.rows[0]);
}

async function endRecentSessions(uid, limit = 20) {
  const now = Date.now();
  await query(
    `WITH recent AS (
      SELECT id
      FROM sessions
      WHERE uid = $1 AND ended_at IS NULL
      ORDER BY created_at DESC
      LIMIT $2
    )
    UPDATE sessions
    SET ended_at = $3
    WHERE id IN (SELECT id FROM recent)`,
    [uid, limit, now]
  );
}

module.exports = {
  listForUser,
  createSession,
  endRecentSessions,
};
