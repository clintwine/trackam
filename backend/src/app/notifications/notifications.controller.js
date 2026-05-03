const express = require("express");
const router = express.Router();
const localAuthMiddleware = require("../../core/middlewares/localAuth");
const asyncHandler = require("../../core/middlewares/asyncHandler");
const NotificationsService = require("./notifications.service");

router.use(localAuthMiddleware);

// List notifications for the current user
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const uid = req.user.uid;
    const notifications = await NotificationsService.listUserNotifications(uid);
    res.json(notifications);
  })
);

// Mark notifications as read
router.post(
  "/mark-read",
  asyncHandler(async (req, res) => {
    await NotificationsService.markNotificationsRead(req.body || {}, req.user.uid);
    res.json({ success: true });
  })
);

module.exports = router;
