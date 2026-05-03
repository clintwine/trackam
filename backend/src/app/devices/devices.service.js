const { z } = require("zod");
const DevicesRepository = require("./devices.repository");

const registerDeviceInputSchema = z.object({
  deviceId: z.string().min(1),
});

function toDeviceDTO(doc) {
  if (!doc) return null;
  const { id, deviceId, lastSeen, isCurrent } = doc;
  return {
    id,
    deviceId,
    lastSeen,
    isCurrent,
  };
}

async function listUserDevices(uid) {
  const docs = await DevicesRepository.listForUser(uid);
  return docs.map(toDeviceDTO).filter(Boolean);
}

async function registerUserDevice(uid, payload) {
  const parsed = registerDeviceInputSchema.parse(payload || {});
  const saved = await DevicesRepository.registerDevice(uid, parsed.deviceId);
  return toDeviceDTO(saved);
}

module.exports = {
  listUserDevices,
  registerUserDevice,
};
