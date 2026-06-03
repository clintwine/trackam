const { query } = require("../../core/db/postgres");

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    phone: row.phone,
    email: row.email || null,
    vehicleType: row.vehicle_type,
    cityCoverage: row.city_coverage,
    baseFee: row.base_fee,
    isActive: row.is_active,
    ghostRate: row.ghost_rate !== undefined ? Number(row.ghost_rate) : null,
    totalShipments: row.total_shipments !== undefined ? Number(row.total_shipments) : null,

    // Government ID (captured once at onboarding, manually verified by admin).
    govtIdType: row.govt_id_type || null,
    govtIdNumber: row.govt_id_number || null,
    // Photo intentionally omitted from list payloads — exposed via getById and
    // a dedicated admin photo endpoint so we don't pay the base64 cost on every
    // riders list response.
    govtIdVerifiedAt: row.govt_id_verified_at || null,
    govtIdVerifiedBy: row.govt_id_verified_by || null,
    govtIdRejectionReason: row.govt_id_rejection_reason || null,
    // Computed verification state for UI badges.
    verificationState: deriveVerificationState(row),

    // Legacy — preserved on existing rows, never written by new code.
    bvn: row.bvn || null,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function deriveVerificationState(row) {
  if (!row.govt_id_type) return "missing";
  if (row.govt_id_verified_at) return "verified";
  if (row.govt_id_rejection_reason) return "rejected";
  return "pending";
}

// Same columns as mapRow, plus the base64 photo — used by getById and the
// admin review endpoint when the founder needs to actually see the document.
function mapRowWithPhoto(row) {
  const base = mapRow(row);
  if (!base) return null;
  return { ...base, govtIdPhoto: row.govt_id_photo || null };
}

async function list(userId) {
  const result = await query(
    `SELECT r.id, r.user_id, r.name, r.phone, r.email, r.vehicle_type,
            r.city_coverage, r.base_fee, r.is_active,
            r.govt_id_type, r.govt_id_number, r.govt_id_verified_at,
            r.govt_id_verified_by, r.govt_id_rejection_reason,
            r.bvn, r.created_at, r.updated_at,
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

async function listPendingVerification(userId) {
  const result = await query(
    `SELECT r.*,
            NULL::int AS total_shipments,
            NULL::numeric AS ghost_rate
     FROM riders r
     WHERE r.user_id = $1
       AND r.is_active = TRUE
       AND r.govt_id_type IS NOT NULL
       AND r.govt_id_verified_at IS NULL
       AND r.govt_id_rejection_reason IS NULL
     ORDER BY r.created_at DESC`,
    [userId]
  );
  return result.rows.map(mapRowWithPhoto);
}

async function getById(id, userId, { includePhoto = false } = {}) {
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
  const row = result.rows[0];
  return includePhoto ? mapRowWithPhoto(row) : mapRow(row);
}

async function create({
  userId, name, phone, email, vehicleType, cityCoverage, baseFee,
  govtIdType, govtIdNumber, govtIdPhoto,
}) {
  const result = await query(
    `INSERT INTO riders
       (user_id, name, phone, email, vehicle_type, city_coverage, base_fee,
        govt_id_type, govt_id_number, govt_id_photo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      userId, name, phone, email || null, vehicleType, cityCoverage, baseFee,
      govtIdType || null, govtIdNumber || null, govtIdPhoto || null,
    ]
  );
  return mapRow(result.rows[0]);
}

async function update(id, userId, fields) {
  const setClauses = [];
  const values = [];
  let i = 1;

  if (fields.name !== undefined)        { setClauses.push(`name = $${i++}`);          values.push(fields.name); }
  if (fields.phone !== undefined)       { setClauses.push(`phone = $${i++}`);         values.push(fields.phone); }
  if (fields.email !== undefined)       { setClauses.push(`email = $${i++}`);         values.push(fields.email || null); }
  if (fields.vehicleType !== undefined) { setClauses.push(`vehicle_type = $${i++}`);  values.push(fields.vehicleType); }
  if (fields.cityCoverage !== undefined){ setClauses.push(`city_coverage = $${i++}`); values.push(fields.cityCoverage); }
  if (fields.baseFee !== undefined)     { setClauses.push(`base_fee = $${i++}`);      values.push(fields.baseFee); }
  if (fields.isActive !== undefined)    { setClauses.push(`is_active = $${i++}`);     values.push(fields.isActive); }

  // Government ID: if any of these change, the rider returns to pending state
  // (verification must be redone after edits).
  let idEdited = false;
  if (fields.govtIdType !== undefined)   { setClauses.push(`govt_id_type = $${i++}`);   values.push(fields.govtIdType || null);   idEdited = true; }
  if (fields.govtIdNumber !== undefined) { setClauses.push(`govt_id_number = $${i++}`); values.push(fields.govtIdNumber || null); idEdited = true; }
  if (fields.govtIdPhoto !== undefined)  { setClauses.push(`govt_id_photo = $${i++}`);  values.push(fields.govtIdPhoto || null);  idEdited = true; }
  if (idEdited) {
    setClauses.push(`govt_id_verified_at = NULL`);
    setClauses.push(`govt_id_verified_by = NULL`);
    setClauses.push(`govt_id_rejection_reason = NULL`);
  }

  if (setClauses.length === 0) return getById(id, userId);

  setClauses.push(`updated_at = NOW()`);
  values.push(id, userId);

  const result = await query(
    `UPDATE riders SET ${setClauses.join(", ")} WHERE id = $${i++} AND user_id = $${i++} RETURNING *`,
    values
  );
  return mapRow(result.rows[0]);
}

// Admin action — record the verification decision.
async function recordVerification(id, userId, { verifiedBy, decision, rejectionReason = null }) {
  const result = await query(
    `UPDATE riders
        SET govt_id_verified_at = CASE WHEN $3 = 'approve' THEN NOW() ELSE NULL END,
            govt_id_verified_by = CASE WHEN $3 = 'approve' THEN $2 ELSE NULL END,
            govt_id_rejection_reason = CASE WHEN $3 = 'reject' THEN $4 ELSE NULL END,
            updated_at = NOW()
      WHERE id = $1 AND user_id = $5
      RETURNING *`,
    [id, verifiedBy, decision, rejectionReason, userId]
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

module.exports = {
  list, listPendingVerification, getById, create, update,
  recordVerification, deactivate,
};
