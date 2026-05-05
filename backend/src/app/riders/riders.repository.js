const { query } = require("../../core/db/postgres");

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    phone: row.phone,
    vehicleType: row.vehicle_type,
    cityCoverage: row.city_coverage,
    baseFee: row.base_fee,
    isActive: row.is_active,
    ghostRate: row.ghost_rate !== undefined ? Number(row.ghost_rate) : null,
    totalShipments: row.total_shipments !== undefined ? Number(row.total_shipments) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function list(userId) {
  const result = await query(
    `SELECT r.*,
            COUNT(s.id) FILTER (WHERE s.created_at >= NOW() - INTERVAL '90 days') AS total_shipments,
            ROUND(
              COUNT(s.id) FILTER (WHERE s.status IN ('ghosted', 'failed') AND s.created_at >= NOW() - INTERVAL '90 days')::numeric
              / NULLIF(COUNT(s.id) FILTER (WHERE s.created_at >= NOW() - INTERVAL '90 days'), 0) * 100,
              1
            ) AS ghost_rate
     FROM riders r
     LEFT JOIN shipments s ON s.rider_id = r.id
     WHERE r.user_id = $1 AND r.is_active = TRUE
     GROUP BY r.id
     ORDER BY r.name`,
    [userId]
  );
  return result.rows.map(mapRow);
}

async function getById(id, userId) {
  const result = await query(
    `SELECT r.*,
            COUNT(s.id) FILTER (WHERE s.created_at >= NOW() - INTERVAL '90 days') AS total_shipments,
            ROUND(
              COUNT(s.id) FILTER (WHERE s.status IN ('ghosted', 'failed') AND s.created_at >= NOW() - INTERVAL '90 days')::numeric
              / NULLIF(COUNT(s.id) FILTER (WHERE s.created_at >= NOW() - INTERVAL '90 days'), 0) * 100,
              1
            ) AS ghost_rate
     FROM riders r
     LEFT JOIN shipments s ON s.rider_id = r.id
     WHERE r.id = $1 AND r.user_id = $2
     GROUP BY r.id`,
    [id, userId]
  );
  return mapRow(result.rows[0]);
}

async function create({ userId, name, phone, vehicleType, cityCoverage, baseFee }) {
  const result = await query(
    `INSERT INTO riders (user_id, name, phone, vehicle_type, city_coverage, base_fee)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, name, phone, vehicleType, cityCoverage, baseFee]
  );
  return mapRow(result.rows[0]);
}

async function update(id, userId, fields) {
  const setClauses = [];
  const values = [];
  let i = 1;

  if (fields.name !== undefined) { setClauses.push(`name = $${i++}`); values.push(fields.name); }
  if (fields.phone !== undefined) { setClauses.push(`phone = $${i++}`); values.push(fields.phone); }
  if (fields.vehicleType !== undefined) { setClauses.push(`vehicle_type = $${i++}`); values.push(fields.vehicleType); }
  if (fields.cityCoverage !== undefined) { setClauses.push(`city_coverage = $${i++}`); values.push(fields.cityCoverage); }
  if (fields.baseFee !== undefined) { setClauses.push(`base_fee = $${i++}`); values.push(fields.baseFee); }
  if (fields.isActive !== undefined) { setClauses.push(`is_active = $${i++}`); values.push(fields.isActive); }

  if (setClauses.length === 0) return getById(id, userId);

  setClauses.push(`updated_at = NOW()`);
  values.push(id, userId);

  const result = await query(
    `UPDATE riders SET ${setClauses.join(", ")} WHERE id = $${i++} AND user_id = $${i++} RETURNING *`,
    values
  );
  return mapRow(result.rows[0]);
}

async function deactivate(id, userId) {
  const result = await query(
    `UPDATE riders SET is_active = FALSE, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId]
  );
  return mapRow(result.rows[0]);
}

module.exports = { list, getById, create, update, deactivate };
