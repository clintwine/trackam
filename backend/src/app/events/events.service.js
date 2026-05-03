const { z } = require("zod");
const EventsRepository = require("./events.repository");

const createEventSchema = z.object({
  type: z.string().min(1),
  payload: z.record(z.any()).default({}),
});

function toEventDTO(doc) {
  if (!doc) return null;
  const { id, type, payload, createdAt } = doc;
  return { id, type, payload: payload || {}, createdAt };
}

async function listEvents(type) {
  const docs = await EventsRepository.list(50, type);
  return docs.map(toEventDTO).filter(Boolean);
}

async function createEvent(payload) {
  const parsed = createEventSchema.parse(payload || {});
  const saved = await EventsRepository.create({
    type: parsed.type,
    payload: parsed.payload,
  });
  return toEventDTO(saved);
}

module.exports = {
  listEvents,
  createEvent,
};
