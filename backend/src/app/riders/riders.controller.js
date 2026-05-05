const express = require("express");
const router = express.Router();
const localAuthMiddleware = require("../../core/middlewares/localAuth");
const asyncHandler = require("../../core/middlewares/asyncHandler");
const RidersService = require("./riders.service");

router.use(localAuthMiddleware);

router.get("/", asyncHandler(async (req, res) => {
  const riders = await RidersService.listRiders(req.user.uid);
  res.json(riders);
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const rider = await RidersService.getRider(req.params.id, req.user.uid);
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
