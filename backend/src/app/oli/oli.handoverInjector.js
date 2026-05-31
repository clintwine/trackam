/**
 * Middleware that injects the assigned rider's phone number into bulk
 * handover initiation requests, so OLI Switch can enforce that only the
 * assigned rider (identified by phone) confirms custody.
 *
 * Intercepts POST /api/handover/initiate-bulk. When the body contains a
 * runId, looks up the run's rider and adds expectedReceiverPhone before
 * the request is forwarded to OLI Switch.
 */

const { query } = require("../../core/db/postgres");

module.exports = async function injectRiderPhone(req, res, next) {
  try {
    const isBulkInit = req.method === "POST" && req.path.endsWith("/initiate-bulk");
    if (!isBulkInit || !req.body || !req.user?.uid) return next();

    const { runId } = req.body;
    if (!runId) return next();

    const result = await query(
      `SELECT r.phone
       FROM dispatch_runs dr
       JOIN riders r ON r.id = dr.rider_id
       WHERE dr.id = $1 AND dr.user_id = $2`,
      [runId, req.user.uid]
    );
    const phone = result.rows[0]?.phone;
    if (phone) {
      req.body = { ...req.body, expectedReceiverPhone: phone };
    }
  } catch (err) {
    // Don't block the proxy on lookup errors — just log and continue
    console.warn("[oli.handoverInjector] phone lookup failed:", err.message);
  }
  next();
};
