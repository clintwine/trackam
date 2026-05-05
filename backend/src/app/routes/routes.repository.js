const { query } = require("../../core/db/postgres");

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    pickupLocation: row.pickup_location,
    deliveryLocation: row.delivery_location,
    distanceKm: row.distance_km,
    defaultRiderId: row.default_rider_id,
    defaultRiderFee: row.default_rider_fee,
    defaultGoodsDescription: row.default_goods_description,
    useCount: row.use_count,
    lastUsedAt: row.last_used_at,
    isActive: row.is_active,
    defaultRiderName: row.default_rider_name || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function list(userId) {
  const result = await query(
    `SELECT ro.*, r.name AS default_rider_name
     FROM routes ro
     LEFT JOIN riders r ON r.id = ro.default_rider_id
     WHERE ro.user_id = $1 AND ro.is_active = TRUE
     ORDER BY ro.use_count DESC, ro.name`,
    [userId]
  );
  return result.rows.map(mapRow);
}

async function getById(id, userId) {
  const result = await query(
    `SELECT ro.*, r.name AS default_rider_name
     FROM routes ro
     LEFT JOIN riders r ON r.id = ro.default_rider_id
     WHERE ro.id = $1 AND ro.user_id = $2`,
    [id, userId]
  );
  return mapRow(result.rows[0]);
}

async function create({ userId, name, pickupLocation, deliveryLocation, distanceKm, defaultRiderId, defaultRiderFee, defaultGoodsDescription }) {
  const result = await query(
    `INSERT INTO routes (user_id, name, pickup_location, delivery_location, distance_km, default_rider_id, default_rider_fee, default_goods_description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [userId, name, pickupLocation, deliveryLocation, distanceKm, defaultRiderId || null, defaultRiderFee || 0, defaultGoodsDescription || null]
  );
  return mapRow(result.rows[0]);
}

async function update(id, userId, fields) {
  const setClauses = [];
  const values = [];
  let i = 1;

  const colMap = {
    name: "name",
    pickupLocation: "pickup_location",
    deliveryLocation: "delivery_location",
    distanceKm: "distance_km",
    defaultRiderId: "default_rider_id",
    defaultRiderFee: "default_rider_fee",
    defaultGoodsDescription: "default_goods_description",
    isActive: "is_active",
  };

  for (const [key, col] of Object.entries(colMap)) {
    if (fields[key] !== undefined) {
      setClauses.push(`${col} = $${i++}`);
      values.push(fields[key]);
    }
  }

  if (setClauses.length === 0) return getById(id, userId);

  setClauses.push(`updated_at = NOW()`);
  values.push(id, userId);

  const result = await query(
    `UPDATE routes SET ${setClauses.join(", ")} WHERE id = $${i++} AND user_id = $${i++} RETURNING *`,
    values
  );
  return mapRow(result.rows[0]);
}

async function incrementUseCount(id) {
  await query(
    `UPDATE routes SET use_count = use_count + 1, last_used_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [id]
  );
}

async function remove(id, userId) {
  await query(`UPDATE routes SET is_active = FALSE, updated_at = NOW() WHERE id = $1 AND user_id = $2`, [id, userId]);
}

module.exports = { list, getById, create, update, incrementUseCount, remove };
