const express = require("express");
const router = express.Router();
const localAuthMiddleware = require("../../core/middlewares/localAuth");
const asyncHandler = require("../../core/middlewares/asyncHandler");
const {
  attachAuthz,
  requireAdmin,
} = require("../../core/middlewares/authz");
const RolesService = require("./roles.service");

// All role metadata endpoints are admin-only
router.use(localAuthMiddleware, attachAuthz, requireAdmin);

// List all roles
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const roles = await RolesService.listRoles();
    res.json(roles);
  })
);

// Get a single role
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const role = await RolesService.getRole(req.params.id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }
    res.json(role);
  })
);

module.exports = router;
