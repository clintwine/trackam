const { query } = require("../../core/db/postgres");
const { v4: uuidv4 } = require("uuid");

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    payload: row.payload || {},
    createdAt: row.created_at,
  };
}

async function list(limit = 50, type) {
  let sql = `SELECT id, type, payload, created_at
             FROM events
             WHERE 1=1`;
  const params = [];
  if (type) {
    params.push(type);
    sql += ` AND type = $${params.length}`;
  }
  params.push(limit);
  sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;
  const result = await query(sql, params);
  return result.rows.map(mapRow).filter(Boolean);
}

async function create(event) {
  const id = uuidv4();
  const payload = event.payload || {};
  const createdAt = event.createdAt || Date.now();
  const result = await query(
    `INSERT INTO events (id, type, payload, created_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, type, payload, created_at`,
    [id, event.type, payload, createdAt]
  );
  return mapRow(result.rows[0]);
}

module.exports = {
  list,
  create,
};
