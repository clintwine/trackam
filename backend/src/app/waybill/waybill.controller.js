const express = require("express");
const router = express.Router();
const localAuthMiddleware = require("../../core/middlewares/localAuth");
const asyncHandler = require("../../core/middlewares/asyncHandler");
const WaybillService = require("./waybill.service");
const sse = require("../../core/sse");

// ── Authenticated routes (literal paths — must come before /:id wildcard) ──

// List all waybills claimed by the operator
router.get("/mine", localAuthMiddleware, asyncHandler(async (req, res) => {
  const waybills = await WaybillService.getOperatorWaybills(req.user.uid);
  res.json(waybills);
}));

// SSE stream — operator receives incoming custody notifications across all their waybills
router.get("/stream/notifications", localAuthMiddleware, (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();

  const ping = setInterval(() => {
    try { res.write(": ping\n\n"); } catch { cleanup(); }
  }, 25_000);

  sse.subscribeUser(req.user.uid, res);

  function cleanup() {
    clearInterval(ping);
    sse.unsubscribeUser(req.user.uid, res);
  }

  req.on("close", cleanup);
});

// Operator claims a waybill using the physical claim token
router.post("/claim", localAuthMiddleware, asyncHandler(async (req, res) => {
  const result = await WaybillService.claimWaybill(req.user.uid, req.body);
  res.status(200).json(result);
}));

// Operator B joins a waybill leg using their received PoH hash as authorization
router.post("/:id/join-leg", localAuthMiddleware, asyncHandler(async (req, res) => {
  const result = await WaybillService.joinLeg(req.user.uid, req.params.id, req.body);
  res.status(201).json(result);
}));

// ── Public routes ──────────────────────────────────────────────────────────

// Sender phone OTP — step 1: request code
router.post("/request-sender-otp", asyncHandler(async (req, res) => {
  const result = await WaybillService.requestSenderOtp(req.body);
  res.json(result);
}));

// Sender phone OTP — step 2: verify code, get token
router.post("/verify-sender-otp", asyncHandler(async (req, res) => {
  const result = await WaybillService.verifySenderOtp(req.body);
  res.json(result);
}));

// Create lite waybill (public — requires sender phone verificationToken)
router.post("/", asyncHandler(async (req, res) => {
  const waybill = await WaybillService.generateWaybill(req.body);
  res.status(201).json(waybill);
}));

// Lookup by waybill number (public — for Quick Dispatch pre-fill)
// Must come before /:id to avoid "lookup" being treated as an ID
router.get("/lookup/:waybillNumber", asyncHandler(async (req, res) => {
  const waybill = await WaybillService.getWaybillByNumber(req.params.waybillNumber);
  const { senderPhone, receiverPhone, claimToken, claimedByUserId, ...safe } = waybill;
  res.json(safe);
}));

// Full custody chain (public — the OLI ledger read)
router.get("/:id/chain", asyncHandler(async (req, res) => {
  const chain = await WaybillService.getChain(req.params.id);
  res.json(chain);
}));

// Download PDF (public)
router.get("/:id/pdf", asyncHandler(async (req, res) => {
  const waybill = await WaybillService.getWaybill(req.params.id);
  const frontendUrl = process.env.FRONTEND_URL || "https://trackam.ng";
  const pdf = await WaybillService.generatePdf(waybill, frontendUrl);

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${waybill.waybillNumber}.pdf"`,
    "Content-Length": pdf.length,
  });
  res.send(pdf);
}));

// Get waybill JSON by ID (public — strips phone numbers)
router.get("/:id", asyncHandler(async (req, res) => {
  const waybill = await WaybillService.getWaybill(req.params.id);
  const { senderPhone, receiverPhone, claimToken, claimedByUserId, ...safe } = waybill;
  res.json(safe);
}));

module.exports = router;
