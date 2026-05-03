const express = require("express");
const router = express.Router();
const localAuthMiddleware = require("../../core/middlewares/localAuth");
const asyncHandler = require("../../core/middlewares/asyncHandler");
const {
  attachAuthz,
  requireAdmin,
  requireSelfOrAdmin,
} = require("../../core/middlewares/authz");
const UsersService = require("./users.service");

// Protect all user routes and attach RBAC context
router.use(localAuthMiddleware, attachAuthz);

// List users (admin-only)
router.get(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const users = await UsersService.listUsers();
    res.json(users);
  })
);

// Get a single user by id (admin or self)
router.get(
  "/:id",
  requireSelfOrAdmin("id"),
  asyncHandler(async (req, res) => {
    const user = await UsersService.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  })
);

// Upsert user document (admin or self)
router.put(
  "/:id",
  requireSelfOrAdmin("id"),
  asyncHandler(async (req, res) => {
    const user = await UsersService.upsertUser(req.params.id, req.body || {});
    res.json(user);
  })
);

module.exports = router;
