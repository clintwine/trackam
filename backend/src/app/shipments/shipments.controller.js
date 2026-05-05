const express = require("express");
const router = express.Router();
const localAuthMiddleware = require("../../core/middlewares/localAuth");
const asyncHandler = require("../../core/middlewares/asyncHandler");
const ShipmentsService = require("./shipments.service");

router.use(localAuthMiddleware);

router.get("/", asyncHandler(async (req, res) => {
  const { status, riderId, limit, offset } = req.query;
  const shipments = await ShipmentsService.listShipments(req.user.uid, {
    status,
    riderId,
    limit: limit ? parseInt(limit, 10) : 50,
    offset: offset ? parseInt(offset, 10) : 0,
  });
  res.json(shipments);
}));

router.get("/:id", asyncHandler(async (req, res) => {
  res.json(await ShipmentsService.getShipment(req.params.id, req.user.uid));
}));

router.get("/:id/log", asyncHandler(async (req, res) => {
  res.json(await ShipmentsService.getShipmentStatusLog(req.params.id, req.user.uid));
}));

router.post("/", asyncHandler(async (req, res) => {
  const shipment = await ShipmentsService.createShipment(req.user.uid, req.body);
  res.status(201).json(shipment);
}));

router.patch("/:id/status", asyncHandler(async (req, res) => {
  res.json(await ShipmentsService.updateShipmentStatus(req.params.id, req.user.uid, req.body));
}));

module.exports = router;
