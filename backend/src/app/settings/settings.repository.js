const { query } = require("../../core/db/postgres");

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    supportEmail: row.support_email,
    allowedRegions: row.allowed_regions || [],
  };
}

async function getGlobal() {
  const result = await query(
    `SELECT id, support_email, allowed_regions
     FROM settings
     WHERE id = 'global'`
  );
  return mapRow(result.rows[0]);
}

module.exports = {
  getGlobal,
};
