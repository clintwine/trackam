const express = require("express");
const router = express.Router();
const asyncHandler = require("../../core/middlewares/asyncHandler");
const WaybillService = require("./waybill.service");

// Create waybill + return JSON (public)
router.post("/", asyncHandler(async (req, res) => {
  const waybill = await WaybillService.generateWaybill(req.body);
  res.status(201).json(waybill);
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

// Get waybill JSON by ID (public — for scan page tracking view)
router.get("/:id", asyncHandler(async (req, res) => {
  const waybill = await WaybillService.getWaybill(req.params.id);
  // Strip phone numbers for public access
  const { senderPhone, receiverPhone, ...safe } = waybill;
  res.json(safe);
}));

module.exports = router;
