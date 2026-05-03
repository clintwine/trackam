const express = require("express");
const router = express.Router();
const localAuthMiddleware = require("../../core/middlewares/localAuth");
const asyncHandler = require("../../core/middlewares/asyncHandler");
const SessionsService = require("./sessions.service");

router.use(localAuthMiddleware);

// List sessions for current user
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const uid = req.user.uid;
    const sessions = await SessionsService.listUserSessions(uid);
    res.json(sessions);
  })
);

module.exports = router;
