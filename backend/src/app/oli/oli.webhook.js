const express  = require("express");
const crypto   = require("crypto");
const router   = express.Router();
const { query } = require("../../core/db/postgres");
const ssePool  = require("../../core/sse");

const OLI_API_KEY = process.env.OLI_API_KEY || "";

function verifySignature(rawBody, header) {
  if (!header || !header.startsWith("sha256=")) return false;
  const expected = crypto
    .createHmac("sha256", OLI_API_KEY)
    .update(rawBody)
    .digest("hex");
  const received = header.slice("sha256=".length);
  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(received, "hex")
    );
  } catch {
    return false;
  }
}

// Mount with raw body parser so we can verify HMAC before JSON.parse
router.post(
  "/",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const sig  = req.headers["x-oli-signature"];
    const event = req.headers["x-oli-event"];

    if (!verifySignature(req.body, sig)) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    let payload;
    try {
      payload = JSON.parse(req.body.toString("utf8"));
    } catch {
      return res.status(400).json({ message: "Invalid JSON" });
    }

    // Acknowledge immediately — do async work after
    res.status(200).json({ received: true });

    handleEvent(event, payload).catch(() => {});
  }
);

async function handleEvent(event, payload) {
  switch (event) {
    case "handover.confirmed":
      return onHandoverConfirmed(payload);
    default:
      break;
  }
}

async function onHandoverConfirmed(payload) {
  const { shipmentId, waybillId, receiverName, receiverActorType, proofHash, occurredAt } = payload;
  if (!shipmentId) return;

  try {
    // Look up the operator user who owns this shipment locally so we can push
    // a targeted SSE event to their active dashboard session.
    const result = await query(
      `SELECT s.user_id, s.waybill_id, lw.waybill_number
       FROM shipments s
       LEFT JOIN lite_waybills lw ON lw.id = s.waybill_id
       WHERE s.id = $1
       LIMIT 1`,
      [shipmentId]
    );
    const row = result.rows[0];
    if (!row?.user_id) return;

    ssePool.publish(row.user_id, {
      type:              "waybill_handover",
      shipmentId,
      waybillId:         row.waybill_id || waybillId || null,
      waybillNumber:     row.waybill_number || null,
      receiverName,
      receiverActorType,
      proofHash,
      occurredAt,
      joinLegUrl:        null,
    });
  } catch (err) {
    console.error("[oli.webhook] onHandoverConfirmed SSE push failed:", err.message);
  }
}

module.exports = router;
