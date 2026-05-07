const express = require("express");
const router = express.Router();
const localAuthMiddleware = require("../../core/middlewares/localAuth");
const asyncHandler = require("../../core/middlewares/asyncHandler");
const HandoverService = require("./handover.service");

// ── Authenticated routes ───────────────────────────────────────────────────

router.post("/initiate", localAuthMiddleware, asyncHandler(async (req, res) => {
  const result = await HandoverService.initiateHandover(req.user.uid, req.body);
  res.status(201).json(result);
}));

router.get("/shipment/:shipmentId/events", localAuthMiddleware, asyncHandler(async (req, res) => {
  const events = await HandoverService.getHandoverEvents(req.params.shipmentId, req.user.uid);
  res.json(events);
}));

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
