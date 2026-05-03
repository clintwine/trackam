const express = require("express");
const router = express.Router();
const asyncHandler = require("../../core/middlewares/asyncHandler");
const SettingsService = require("./settings.service");

// Get global settings document
router.get(
  "/global",
  asyncHandler(async (req, res) => {
    const settings = await SettingsService.getGlobalSettings();
    if (!settings) {
      return res.status(404).json({ message: "Global settings not found" });
    }
    res.json(settings);
  })
);

module.exports = router;
