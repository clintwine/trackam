const express = require("express");
const router = express.Router();
const localAuthMiddleware = require("../../core/middlewares/localAuth");
const asyncHandler = require("../../core/middlewares/asyncHandler");
const { query } = require("../../core/db/postgres");

router.use(localAuthMiddleware);

const ALLOWED_KEYS = [
  "fuel_price_per_litre",
  "fuel_efficiency_multiplier",
  "ghost_threshold_hours",
  "business_name",
  "business_city",
  "country",
];

const DEFAULTS = {
  fuel_price_per_litre: "950",
  fuel_efficiency_multiplier: "0.12",
  ghost_threshold_hours: "48",
  business_name: "",
  business_city: "",
  country: "ng",
};

async function ensureDefaults(userId) {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    await query(
      `INSERT INTO logistics_settings (user_id, key, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, key) DO NOTHING`,
      [userId, key, value]
    );
  }
}

router.get("/", asyncHandler(async (req, res) => {
  await ensureDefaults(req.user.uid);
  const result = await query(
    `SELECT key, value FROM logistics_settings WHERE user_id = $1`,
    [req.user.uid]
  );
  const settings = {};
  for (const row of result.rows) settings[row.key] = row.value;
  res.json(settings);
}));

router.patch("/", asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const updates = req.body;

  const invalid = Object.keys(updates).filter((k) => !ALLOWED_KEYS.includes(k));
  if (invalid.length) {
    return res.status(400).json({ error: `Unknown setting keys: ${invalid.join(", ")}` });
  }

  for (const [key, value] of Object.entries(updates)) {
    await query(
      `INSERT INTO logistics_settings (user_id, key, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [userId, key, String(value)]
    );
  }

  const result = await query(
    `SELECT key, value FROM logistics_settings WHERE user_id = $1`,
    [userId]
  );
  const settings = {};
  for (const row of result.rows) settings[row.key] = row.value;
  res.json(settings);
}));

module.exports = router;
