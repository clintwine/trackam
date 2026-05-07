const repo = require("./handover.repository");
const shipmentsRepo = require("../shipments/shipments.repository");
const { query } = require("../../core/db/postgres");

const HANDOVER_ELIGIBLE_STATUSES = ["pending", "in_transit", "handed_over"];
const VALID_ACTOR_TYPES = ["ACTOR_SENDER", "ACTOR_COURIER", "ACTOR_HUB", "ACTOR_RECEIVER"];

async function initiateHandover(userId, { shipmentId, actorType = "ACTOR_COURIER" }) {
  if (!shipmentId) throw Object.assign(new Error("shipmentId is required"), { status: 400 });
  if (!VALID_ACTOR_TYPES.includes(actorType)) {
    throw Object.assign(new Error(`actorType must be one of: ${VALID_ACTOR_TYPES.join(", ")}`), { status: 400 });
  }

  const shipment = await shipmentsRepo.getById(shipmentId, userId);
  if (!shipment) throw Object.assign(new Error("Shipment not found"), { status: 404 });
  if (!HANDOVER_ELIGIBLE_STATUSES.includes(shipment.status)) {
    throw Object.assign(
      new Error(`Cannot initiate handover for a shipment with status '${shipment.status}'`),
      { status: 409 }
    );
  }

  const tokenRecord = await repo.createToken({ shipmentId, userId, actorType });
  return {
    token: tokenRecord.token,
    expiresAt: tokenRecord.expiresAt,
    shipmentId,
  };
}

async function getTokenInfo(token) {
  if (!token) throw Object.assign(new Error("token is required"), { status: 400 });
  const tokenRecord = await repo.getToken(token);

  if (!tokenRecord) throw Object.assign(new Error("Invalid or expired handover token"), { status: 404 });
  if (tokenRecord.usedAt) throw Object.assign(new Error("This handover has already been completed"), { status: 409 });
  if (new Date(tokenRecord.expiresAt) < new Date()) {
    throw Object.assign(new Error("Handover token has expired"), { status: 410 });
  }

  // Return shipment summary — strip sensitive data (no user PII)
  const result = await query(
    `SELECT id, goods_description, pickup_location, delivery_location, status, distance_km
     FROM shipments WHERE id = $1`,
    [tokenRecord.shipmentId]
  );
  const s = result.rows[0];
  if (!s) throw Object.assign(new Error("Shipment not found"), { status: 404 });

  return {
    token: tokenRecord.token,
    expiresAt: tokenRecord.expiresAt,
    giverActorType: tokenRecord.actorType,
    shipment: {
      id: s.id,
      goodsDescription: s.goods_description,
      pickupLocation: s.pickup_location,
      deliveryLocation: s.delivery_location,
      distanceKm: s.distance_km,
      status: s.status,
    },
  };
}

async function confirmHandover(body) {
  const { token, receiverName, receiverBvn, receiverPhone, receiverActorType, latitude, longitude } = body;

  if (!token || !receiverName || !receiverBvn || !receiverActorType) {
    throw Object.assign(
      new Error("token, receiverName, receiverBvn, and receiverActorType are required"),
      { status: 400 }
    );
  }
  if (!VALID_ACTOR_TYPES.includes(receiverActorType)) {
    throw Object.assign(new Error(`receiverActorType must be one of: ${VALID_ACTOR_TYPES.join(", ")}`), { status: 400 });
  }

  const tokenRecord = await repo.getToken(token);
  if (!tokenRecord) throw Object.assign(new Error("Invalid handover token"), { status: 404 });
  if (tokenRecord.usedAt) throw Object.assign(new Error("This handover has already been completed"), { status: 409 });
  if (new Date(tokenRecord.expiresAt) < new Date()) {
    throw Object.assign(new Error("Handover token has expired"), { status: 410 });
  }

  const event = await repo.createEvent({
    shipmentId: tokenRecord.shipmentId,
    tokenId: tokenRecord.id,
    giverUserId: tokenRecord.userId,
    giverActorType: tokenRecord.actorType,
    receiverName,
    receiverBvn,
    receiverPhone,
    receiverActorType,
    latitude,
    longitude,
  });

  await repo.markTokenUsed(tokenRecord.id);

  // Update shipment status and log the event
  await shipmentsRepo.updateStatus(tokenRecord.shipmentId, tokenRecord.userId, {
    newStatus: "handed_over",
    note: `Handed over to ${receiverName} (${receiverActorType.replace("ACTOR_", "").toLowerCase()}) · PoH: ${event.proofHash.slice(0, 12)}…`,
  });

  return {
    proofHash: event.proofHash,
    occurredAt: event.occurredAt,
    shipmentId: tokenRecord.shipmentId,
    receiverName,
    receiverActorType,
  };
}

async function getHandoverEvents(shipmentId, userId) {
  const shipment = await shipmentsRepo.getById(shipmentId, userId);
  if (!shipment) throw Object.assign(new Error("Shipment not found"), { status: 404 });
  return repo.listEvents(shipmentId);
}

module.exports = { initiateHandover, getTokenInfo, confirmHandover, getHandoverEvents };
