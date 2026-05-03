const express = require("express");
const router = express.Router();
const localAuthMiddleware = require("../../core/middlewares/localAuth");
const asyncHandler = require("../../core/middlewares/asyncHandler");
const DevicesService = require("./devices.service");

router.use(localAuthMiddleware);

// List devices for current user
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const uid = req.user.uid;
    const devices = await DevicesService.listUserDevices(uid);
    res.json(devices);
  })
);

// Register a device for current user
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const uid = req.user.uid;
    const device = await DevicesService.registerUserDevice(uid, req.body || {});
    res.status(201).json(device);
  })
);

module.exports = router;
