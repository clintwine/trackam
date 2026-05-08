const repo = require("./handover.repository");
const shipmentsRepo = require("../shipments/shipments.repository");
const custodianRepo = require("../custodian/custodian.repository");
const { query } = require("../../core/db/postgres");
const sse = require("../../core/sse");

const HANDOVER_ELIGIBLE_STATUSES = ["pending", "in_transit", "handed_over", "disputed"];
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
  return { token: tokenRecord.token, expiresAt: tokenRecord.expiresAt, shipmentId };
}

async function getTokenInfo(token) {
  if (!token) throw Object.assign(new Error("token is required"), { status: 400 });
  const tokenRecord = await repo.getToken(token);

  if (!tokenRecord) throw Object.assign(new Error("Invalid or expired handover token"), { status: 404 });
  if (tokenRecord.usedAt) throw Object.assign(new Error("This handover has already been completed"), { status: 409 });
  if (new Date(tokenRecord.expiresAt) < new Date()) {
    throw Object.assign(new Error("Handover token has expired"), { status: 410 });
  }

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
    giverName: tokenRecord.giverName || null,
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

  if (!token || !receiverName || !receiverActorType) {
    throw Object.assign(new Error("token, receiverName, and receiverActorType are required"), { status: 400 });
  }
  // BVN required for all actors except the final receiver (B2C deliveries)
  if (receiverActorType !== "ACTOR_RECEIVER" && !receiverBvn) {
    throw Object.assign(new Error("receiverBvn is required for non-receiver handovers"), { status: 400 });
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

  const shipmentRow = await query(
    `SELECT waybill_id FROM shipments WHERE id = $1`,
    [tokenRecord.shipmentId]
  );
  const waybillId = shipmentRow.rows[0]?.waybill_id || null;

  const event = await repo.createEvent({
    shipmentId: tokenRecord.shipmentId,
    waybillId,
    tokenId: tokenRecord.id,
    giverUserId: tokenRecord.userId,
    giverActorType: tokenRecord.actorType,
    giverName: tokenRecord.giverName,
    giverPhone: tokenRecord.giverPhone,
    custodianSessionId: tokenRecord.custodianSessionId,
    receiverName,
    receiverBvn: receiverBvn || null,
    receiverPhone,
    receiverActorType,
    latitude,
    longitude,
  });

  await repo.markTokenUsed(tokenRecord.id);

  // Invalidate the giver's custodian session as soon as custody is passed
  if (tokenRecord.custodianSessionId) {
    await custodianRepo.invalidateById(tokenRecord.custodianSessionId);
  }

  const note = `Handed over to ${receiverName} (${receiverActorType.replace("ACTOR_", "").toLowerCase()}) · PoH: ${event.proofHash.slice(0, 12)}…`;

  if (receiverActorType === "ACTOR_RECEIVER") {
    // Final delivery — mark every shipment leg on this waybill as delivered
    if (waybillId) {
      await shipmentsRepo.deliverAllByWaybill(waybillId);
    } else {
      // Waybill-less shipment: just mark this one
      if (tokenRecord.userId) {
        await shipmentsRepo.updateStatus(tokenRecord.shipmentId, tokenRecord.userId, { newStatus: "delivered", note });
      } else {
        await shipmentsRepo.systemUpdateStatus(tokenRecord.shipmentId, { newStatus: "delivered", note });
      }
    }
    // Invalidate ALL open custodian sessions for this shipment
    await custodianRepo.invalidateForShipment(tokenRecord.shipmentId);
  } else {
    if (tokenRecord.userId) {
      await shipmentsRepo.updateStatus(tokenRecord.shipmentId, tokenRecord.userId, { newStatus: "handed_over", note });
    } else {
      await shipmentsRepo.systemUpdateStatus(tokenRecord.shipmentId, { newStatus: "handed_over", note });
    }
  }

  // Real-time: operator dashboard watching this specific shipment
  sse.notify(tokenRecord.shipmentId, {
    type: "handover_confirmed",
    proofHash: event.proofHash,
    occurredAt: event.occurredAt,
    receiverName,
    receiverActorType,
  });

  // Build join-leg deep link so the next operator can claim their leg in one click
  const joinLegUrl = (waybillId && ["ACTOR_HUB", "ACTOR_COURIER"].includes(receiverActorType))
    ? `/dashboard?join=${waybillId}&poh=${event.proofHash}`
    : null;

  // Real-time: all operators subscribed to this waybill (incoming custody alerts)
  await sse.notifyWaybillOperators(waybillId, {
    type: "waybill_handover",
    waybillId,
    shipmentId: tokenRecord.shipmentId,
    proofHash: event.proofHash,
    occurredAt: event.occurredAt,
    receiverName,
    receiverActorType,
    joinLegUrl,
  }, { query });

  // Create a custodian session for non-final receivers who provided a phone (couriers / hubs)
  if (receiverPhone && ["ACTOR_COURIER", "ACTOR_HUB"].includes(receiverActorType)) {
    const { createCustodianSession } = require("../custodian/custodian.service");
    await createCustodianSession({
      handoverEventId: event.id,
      shipmentId: tokenRecord.shipmentId,
      waybillId,
      phone: receiverPhone,
      receiverName,
      receiverActorType,
    }).catch(() => {});
  }

  return {
    proofHash: event.proofHash,
    occurredAt: event.occurredAt,
    shipmentId: tokenRecord.shipmentId,
    receiverName,
    receiverActorType,
    joinLegUrl,
  };
}

async function getHandoverEvents(shipmentId, userId) {
  const shipment = await shipmentsRepo.getById(shipmentId, userId);
  if (!shipment) throw Object.assign(new Error("Shipment not found"), { status: 404 });
  return repo.listEvents(shipmentId);
}

module.exports = { initiateHandover, getTokenInfo, confirmHandover, getHandoverEvents };
