const express = require("express");
const router = express.Router();
const asyncHandler = require("../../core/middlewares/asyncHandler");
const EventsService = require("./events.service");

// List events, optionally filtered by type
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { type } = req.query;
    const events = await EventsService.listEvents(type);
    res.json(events);
  })
);

// Create a new event
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const event = await EventsService.createEvent(req.body || {});
    res.status(201).json(event);
  })
);

module.exports = router;
