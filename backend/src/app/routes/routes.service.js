const repo = require("./routes.repository");

async function listRoutes(userId) {
  return repo.list(userId);
}

async function getRoute(id, userId) {
  const route = await repo.getById(id, userId);
  if (!route) throw Object.assign(new Error("Route not found"), { status: 404 });
  return route;
}

async function createRoute(userId, body) {
  const { name, pickupLocation, deliveryLocation, distanceKm } = body;
  if (!name || !pickupLocation || !deliveryLocation || !distanceKm) {
    throw Object.assign(new Error("name, pickupLocation, deliveryLocation, and distanceKm are required"), { status: 400 });
  }
  if (distanceKm <= 0) {
    throw Object.assign(new Error("distanceKm must be greater than 0"), { status: 400 });
  }
  return repo.create({ userId, ...body });
}

async function updateRoute(id, userId, body) {
  await getRoute(id, userId);
  return repo.update(id, userId, body);
}

async function deleteRoute(id, userId) {
  await getRoute(id, userId);
  await repo.remove(id, userId);
}

module.exports = { listRoutes, getRoute, createRoute, updateRoute, deleteRoute };
