const { query } = require("../../core/db/postgres");

function mapRow(row) {
  if (!row) return null;
  const { id, to_uid, title, body, created_at, read } = row;
  return {
    id,
    to: to_uid,
    title,
    body,
    createdAt: created_at,
    read: Boolean(read),
  };
}

async function listForUser(uid, limit = 50) {
  const result = await query(
    `SELECT id, to_uid, title, body, created_at, read
     FROM notifications
     WHERE to_uid = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [uid, limit]
  );
  return result.rows.map(mapRow).filter(Boolean);
}

async function markRead(ids, uid) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return 0;
  }
  const result = await query(
    `UPDATE notifications
     SET read = true
     WHERE id = ANY($1) AND to_uid = $2 AND read = false`,
    [ids, uid]
  );
  return result.rowCount || 0;
}

module.exports = {
  listForUser,
  markRead,
};
