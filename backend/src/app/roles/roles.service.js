const RolesRepository = require("./roles.repository");

function toRoleDTO(doc) {
  if (!doc) return null;
  const { id, description, permissions } = doc;
  return {
    id,
    description,
    permissions: permissions || [],
  };
}

async function listRoles() {
  const docs = await RolesRepository.list();
  return docs.map(toRoleDTO).filter(Boolean);
}

async function getRole(id) {
  const doc = await RolesRepository.getById(id);
  return toRoleDTO(doc);
}

module.exports = {
  listRoles,
  getRole,
};
