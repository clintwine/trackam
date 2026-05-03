const { z } = require("zod");
const UsersRepository = require("./users.repository");

const userPayloadSchema = z
  .object({
    displayName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    photoURL: z.string().url().nullable().optional(),
    preferences: z
      .object({
        locale: z.string().optional(),
        theme: z.string().optional(),
      })
      .partial()
      .optional(),
    roles: z.array(z.string()).optional(),
    emailVerified: z.boolean().optional(),
    createdAt: z.number().optional(),
    updatedAt: z.number().optional(),
    passwordHash: z.string().optional(),
  })
  .passthrough();

function toUserDTO(doc) {
  if (!doc) return null;
  const {
    id,
    displayName,
    email,
    photoURL,
    preferences,
    roles,
  } = doc;

  return {
    id,
    displayName: displayName || null,
    email: email || null,
    photoURL: typeof photoURL === "string" ? photoURL : null,
    preferences: preferences || {},
    roles: roles || [],
    emailVerified: !!doc.emailVerified,
  };
}

async function listUsers() {
  const docs = await UsersRepository.list();
  return docs.map(toUserDTO).filter(Boolean);
}

async function getUser(id) {
  const doc = await UsersRepository.getById(id);
  return toUserDTO(doc);
}

async function getUserByEmail(email) {
  const doc = await UsersRepository.getByEmail(email);
  return toUserDTO(doc);
}

async function upsertUser(id, payload) {
  const parsed = userPayloadSchema.parse(payload || {});
  const data = {
    ...parsed,
    updatedAt: Date.now(),
  };
  const saved = await UsersRepository.upsert(id, data);
  return toUserDTO(saved);
}

module.exports = {
  listUsers,
  getUser,
  getUserByEmail,
  upsertUser,
};
