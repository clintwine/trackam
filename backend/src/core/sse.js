// In-memory SSE subscriber store.
// Scoped to a single process; sufficient for Phase 1 (single Railway instance).

const shipmentClients = new Map(); // shipmentId -> Set<res>
const userClients = new Map();     // userId     -> Set<res>

// ── Shipment-level (operator watches a single shipment) ───────────────────────

function subscribe(shipmentId, res) {
  if (!shipmentClients.has(shipmentId)) shipmentClients.set(shipmentId, new Set());
  shipmentClients.get(shipmentId).add(res);
}

function unsubscribe(shipmentId, res) {
  const subs = shipmentClients.get(shipmentId);
  if (!subs) return;
  subs.delete(res);
  if (subs.size === 0) shipmentClients.delete(shipmentId);
}

function notify(shipmentId, data) {
  const subs = shipmentClients.get(shipmentId);
  if (!subs?.size) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of subs) {
    try { res.write(payload); } catch { subs.delete(res); }
  }
}

// ── User-level (operator receives custody notifications across all waybills) ──

function subscribeUser(userId, res) {
  if (!userClients.has(userId)) userClients.set(userId, new Set());
  userClients.get(userId).add(res);
}

function unsubscribeUser(userId, res) {
  const subs = userClients.get(userId);
  if (!subs) return;
  subs.delete(res);
  if (subs.size === 0) userClients.delete(userId);
}

function notifyUser(userId, data) {
  const subs = userClients.get(userId);
  if (!subs?.size) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of subs) {
    try { res.write(payload); } catch { subs.delete(res); }
  }
}

// Push a waybill handover event to every operator subscribed to that waybill.
// "Subscribed" = has a shipment linked to that waybill_id, or created the waybill.
async function notifyWaybillOperators(waybillId, data, db) {
  if (!waybillId) return;
  const result = await db.query(
    `SELECT DISTINCT user_id FROM shipments WHERE waybill_id = $1
     UNION
     SELECT claimed_by_user_id FROM lite_waybills
       WHERE id = $1 AND claimed_by_user_id IS NOT NULL`,
    [waybillId]
  );
  for (const { user_id } of result.rows) {
    if (user_id) notifyUser(user_id, data);
  }
}

module.exports = {
  subscribe, unsubscribe, notify,
  subscribeUser, unsubscribeUser, notifyUser,
  notifyWaybillOperators,
};
