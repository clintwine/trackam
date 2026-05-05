const express = require("express");
const router = express.Router();
const localAuthMiddleware = require("../../core/middlewares/localAuth");
const asyncHandler = require("../../core/middlewares/asyncHandler");
const RoutesService = require("./routes.service");

router.use(localAuthMiddleware);

router.get("/", asyncHandler(async (req, res) => {
  res.json(await RoutesService.listRoutes(req.user.uid));
}));

router.get("/:id", asyncHandler(async (req, res) => {
  res.json(await RoutesService.getRoute(req.params.id, req.user.uid));
}));

router.post("/", asyncHandler(async (req, res) => {
  const route = await RoutesService.createRoute(req.user.uid, req.body);
  res.status(201).json(route);
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  res.json(await RoutesService.updateRoute(req.params.id, req.user.uid, req.body));
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  await RoutesService.deleteRoute(req.params.id, req.user.uid);
  res.status(204).end();
}));

module.exports = router;
