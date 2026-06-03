const express = require("express");
const router = express.Router();
const localAuthMiddleware = require("../../core/middlewares/localAuth");
const { attachAuthz, requireAdmin } = require("../../core/middlewares/authz");
const asyncHandler = require("../../core/middlewares/asyncHandler");
const RidersService = require("./riders.service");

router.use(localAuthMiddleware);

// ── Verification queue (admin-only) ───────────────────────────────────────
// IMPORTANT: this MUST come before /:id so /pending isn't matched as an id.

router.get("/pending-verification",
  attachAuthz, requireAdmin,
  asyncHandler(async (req, res) => {
    const riders = await RidersService.listPendingVerification(req.user.uid);
    res.json(riders);
  })
);

router.post("/:id/verify",
  attachAuthz, requireAdmin,
  asyncHandler(async (req, res) => {
    const rider = await RidersService.verifyRider(req.params.id, req.user.uid, req.user.uid);
    res.json(rider);
  })
);

router.post("/:id/reject",
  attachAuthz, requireAdmin,
  asyncHandler(async (req, res) => {
    const rider = await RidersService.rejectRider(
      req.params.id, req.user.uid, req.user.uid, req.body?.rejectionReason
    );
    res.json(rider);
  })
);

// ── CRUD ─────────────────────────────────────────────────────────────────

router.get("/", asyncHandler(async (req, res) => {
  const riders = await RidersService.listRiders(req.user.uid);
  res.json(riders);
}));

router.get("/:id", asyncHandler(async (req, res) => {
  // includePhoto=1 returns the base64 ID photo too — used by the verification
  // review modal. We don't gate this on admin because the founder owns all
  // their riders' data; non-admins fetching a rider just get the photo too,
  // which is fine (they uploaded it).
  const includePhoto = req.query.includePhoto === "1" || req.query.includePhoto === "true";
  const rider = await RidersService.getRider(req.params.id, req.user.uid, { includePhoto });
  res.json(rider);
}));

router.post("/", asyncHandler(async (req, res) => {
  const rider = await RidersService.createRider(req.user.uid, req.body);
  res.status(201).json(rider);
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const rider = await RidersService.updateRider(req.params.id, req.user.uid, req.body);
  res.json(rider);
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  await RidersService.deactivateRider(req.params.id, req.user.uid);
  res.status(204).end();
}));

module.exports = router;
