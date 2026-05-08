const express = require("express");
const router = express.Router();
const localAuthMiddleware = require("../../core/middlewares/localAuth");
const asyncHandler = require("../../core/middlewares/asyncHandler");
const HandoverService = require("./handover.service");
const sse = require("../../core/sse");

// ── Authenticated routes ───────────────────────────────────────────────────

router.post("/initiate", localAuthMiddleware, asyncHandler(async (req, res) => {
  const result = await HandoverService.initiateHandover(req.user.uid, req.body);
  res.status(201).json(result);
}));

router.get("/shipment/:shipmentId/events", localAuthMiddleware, asyncHandler(async (req, res) => {
  const events = await HandoverService.getHandoverEvents(req.params.shipmentId, req.user.uid);
  res.json(events);
}));

// SSE stream — operator dashboard subscribes here to get instant updates when a
// handover is confirmed on /scan. Cookie auth works because EventSource sends cookies.
router.get("/stream/:shipmentId", localAuthMiddleware, (req, res) => {
  const { shipmentId } = req.params;

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no", // prevent nginx from buffering the stream
  });
  res.flushHeaders();

  // Keep-alive comment every 25 s so proxies don't kill the connection
  const ping = setInterval(() => {
    try { res.write(": ping\n\n"); } catch { cleanup(); }
  }, 25_000);

  sse.subscribe(shipmentId, res);

  function cleanup() {
    clearInterval(ping);
    sse.unsubscribe(shipmentId, res);
  }

  req.on("close", cleanup);
});

// ── Public routes (token-gated) ────────────────────────────────────────────

router.get("/token/:token", asyncHandler(async (req, res) => {
  const info = await HandoverService.getTokenInfo(req.params.token);
  res.json(info);
}));

router.post("/confirm", asyncHandler(async (req, res) => {
  const result = await HandoverService.confirmHandover(req.body);
  res.status(201).json(result);
}));

module.exports = router;
