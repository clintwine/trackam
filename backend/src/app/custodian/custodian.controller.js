const express = require("express");
const router = express.Router();
const asyncHandler = require("../../core/middlewares/asyncHandler");
const custodianAuth = require("../../core/custodianAuth");
const CustodianService = require("./custodian.service");

// ── Public (session-gated) ─────────────────────────────────────────────────

// Step 1 — driver enters phone, receives OTP SMS
router.post("/request-otp", asyncHandler(async (req, res) => {
  const result = await CustodianService.requestOtp(req.body);
  res.json(result);
}));

// Step 2 — driver submits OTP, receives a custodian JWT
router.post("/verify-otp", asyncHandler(async (req, res) => {
  const result = await CustodianService.verifyOtp(req.body);
  res.json(result);
}));

// Driver lost their SMS — find session by phone and re-send link
router.post("/resend-link", asyncHandler(async (req, res) => {
  const result = await CustodianService.resendLink(req.body.phone);
  res.json(result);
}));

// ── Custodian-authenticated ────────────────────────────────────────────────

// Current custody card (shipment details)
router.get("/me", custodianAuth, asyncHandler(async (req, res) => {
  const info = await CustodianService.getCustodyInfo(req.custodian.sessionId);
  res.json(info);
}));

// Generate a handover token (same flow as operator, but initiated by driver)
router.post("/initiate-handover", custodianAuth, asyncHandler(async (req, res) => {
  const result = await CustodianService.initiateHandover(req.custodian, req.body);
  res.status(201).json(result);
}));

module.exports = router;
