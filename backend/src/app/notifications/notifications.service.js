const { z } = require("zod");
const NotificationsRepository = require("./notifications.repository");

const markReadSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

function toNotificationDTO(doc) {
  if (!doc) return null;
  const { id, title, body, createdAt, read } = doc;
  return {
    id,
    title,
    body,
    createdAt,
    read: Boolean(read),
  };
}

async function listUserNotifications(uid) {
  const docs = await NotificationsRepository.listForUser(uid);
  return docs.map(toNotificationDTO).filter(Boolean);
}

async function markNotificationsRead(payload, uid) {
  const { ids } = markReadSchema.parse(payload || {});
  return NotificationsRepository.markRead(ids, uid);
}

module.exports = {
  listUserNotifications,
  markNotificationsRead,
};
