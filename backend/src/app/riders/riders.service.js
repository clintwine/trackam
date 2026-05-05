const repo = require("./riders.repository");

async function listRiders(userId) {
  return repo.list(userId);
}

async function getRider(id, userId) {
  const rider = await repo.getById(id, userId);
  if (!rider) throw Object.assign(new Error("Rider not found"), { status: 404 });
  return rider;
}

async function createRider(userId, body) {
  const { name, phone, vehicleType, cityCoverage, baseFee = 0 } = body;
  if (!name || !phone || !vehicleType || !cityCoverage) {
    throw Object.assign(new Error("name, phone, vehicleType, and cityCoverage are required"), { status: 400 });
  }
  const validTypes = ["bike", "tricycle", "van", "truck"];
  if (!validTypes.includes(vehicleType)) {
    throw Object.assign(new Error(`vehicleType must be one of: ${validTypes.join(", ")}`), { status: 400 });
  }
  return repo.create({ userId, name, phone, vehicleType, cityCoverage, baseFee });
}

async function updateRider(id, userId, body) {
  await getRider(id, userId);
  return repo.update(id, userId, body);
}

async function deactivateRider(id, userId) {
  await getRider(id, userId);
  return repo.deactivate(id, userId);
}

module.exports = { listRiders, getRider, createRider, updateRider, deactivateRider };
