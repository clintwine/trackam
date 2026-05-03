const { query } = require("../../core/db/postgres");

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    description: row.description,
    permissions: row.permissions || [],
  };
}

async function list() {
  const result = await query(
    `SELECT id, description, permissions
     FROM roles
     ORDER BY id`
  );
  return result.rows.map(mapRow).filter(Boolean);
}

async function getById(id) {
  const result = await query(
    `SELECT id, description, permissions
     FROM roles
     WHERE id = $1`,
    [id]
  );
  return mapRow(result.rows[0]);
}

module.exports = {
  list,
  getById,
};
