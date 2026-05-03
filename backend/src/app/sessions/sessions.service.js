const SessionsRepository = require("./sessions.repository");

function toSessionDTO(doc) {
  if (!doc) return null;
  const { id, createdAt, ip, endedAt, userAgent } = doc;
  return {
    id,
    createdAt,
    ip,
    endedAt,
    userAgent,
  };
}

async function listUserSessions(uid) {
  const docs = await SessionsRepository.listForUser(uid);
  return docs.map(toSessionDTO).filter(Boolean);
}

module.exports = {
  listUserSessions,
};
