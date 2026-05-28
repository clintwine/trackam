/**
 * Local SSE pub/sub pool.
 * Keyed by userId; each entry is a Set of active Express response objects.
 * Used to push real-time events to authenticated operators (e.g. incoming
 * custody notifications forwarded from the OLI webhook handler).
 */

const HEARTBEAT_MS = 25_000;

/** @type {Map<string, Set<import("express").Response>>} */
const clients = new Map();

let heartbeatTimer = null;

function ensureHeartbeat() {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    for (const connections of clients.values()) {
      for (const res of connections) {
        try { res.write(": heartbeat\n\n"); } catch { /* closed */ }
      }
    }
  }, HEARTBEAT_MS);
  // Don't keep the Node process alive just for heartbeats
  heartbeatTimer.unref?.();
}

/**
 * Attach an Express response to the pool for `userId`.
 * Sets SSE headers and registers a cleanup listener on `close`.
 */
function subscribe(userId, res) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);
  ensureHeartbeat();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx response buffering
  res.flushHeaders?.();

  res.on("close", () => {
    const conns = clients.get(userId);
    if (conns) {
      conns.delete(res);
      if (conns.size === 0) clients.delete(userId);
    }
  });
}

/**
 * Push a JSON event to all active connections for `userId`.
 */
function publish(userId, data) {
  const conns = clients.get(userId);
  if (!conns || conns.size === 0) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of conns) {
    try { res.write(payload); } catch { /* ignore */ }
  }
}

module.exports = { subscribe, publish };
