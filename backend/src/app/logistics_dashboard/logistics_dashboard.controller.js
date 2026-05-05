const express = require("express");
const router = express.Router();
const localAuthMiddleware = require("../../core/middlewares/localAuth");
const asyncHandler = require("../../core/middlewares/asyncHandler");
const { query } = require("../../core/db/postgres");

router.use(localAuthMiddleware);

// GET /api/logistics/dashboard/summary
// Today's counts + this-month snapshot
router.get("/summary", asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  const [today, month, alerts] = await Promise.all([
    query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'pending') AS pending,
         COUNT(*) FILTER (WHERE status = 'in_transit') AS in_transit,
         COUNT(*) FILTER (WHERE status = 'delivered') AS delivered
       FROM shipments
       WHERE user_id = $1 AND created_at::date = NOW()::date`,
      [userId]
    ),
    query(
      `SELECT
         COUNT(*) AS total_shipments,
         COUNT(*) FILTER (WHERE status = 'ghosted') AS ghosted_count,
         COUNT(*) FILTER (WHERE status = 'delivered') AS delivered_count,
         COALESCE(SUM(total_cost) FILTER (WHERE status != 'failed'), 0) AS total_cost_kobo,
         COALESCE(SUM(total_cost) FILTER (WHERE status = 'delivered'), 0) AS delivered_cost_kobo,
         ROUND(
           COUNT(*) FILTER (WHERE status = 'ghosted')::numeric
           / NULLIF(COUNT(*), 0) * 100, 1
         ) AS ghost_rate
       FROM shipments
       WHERE user_id = $1
         AND date_trunc('month', created_at) = date_trunc('month', NOW())`,
      [userId]
    ),
    query(
      `SELECT COUNT(*) AS count
       FROM shipments
       WHERE user_id = $1 AND (delay_flag = TRUE OR ghosting_flag = TRUE)
         AND status IN ('pending', 'in_transit')`,
      [userId]
    ),
  ]);

  const t = today.rows[0];
  const m = month.rows[0];

  res.json({
    today: {
      pending: parseInt(t.pending, 10),
      inTransit: parseInt(t.in_transit, 10),
      delivered: parseInt(t.delivered, 10),
    },
    month: {
      totalShipments: parseInt(m.total_shipments, 10),
      deliveredCount: parseInt(m.delivered_count, 10),
      ghostedCount: parseInt(m.ghosted_count, 10),
      ghostRate: parseFloat(m.ghost_rate || "0"),
      totalCostKobo: parseInt(m.total_cost_kobo, 10),
    },
    alertCount: parseInt(alerts.rows[0].count, 10),
  });
}));

// GET /api/logistics/dashboard/alerts
// Shipments flagged as delayed or ghosting risk
router.get("/alerts", asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  const result = await query(
    `SELECT s.*, r.name AS rider_name
     FROM shipments s
     LEFT JOIN riders r ON r.id = s.rider_id
     WHERE s.user_id = $1
       AND (s.delay_flag = TRUE OR s.ghosting_flag = TRUE)
       AND s.status IN ('pending', 'in_transit')
     ORDER BY s.created_at DESC`,
    [userId]
  );

  res.json(result.rows.map((row) => ({
    id: row.id,
    goodsDescription: row.goods_description,
    pickupLocation: row.pickup_location,
    deliveryLocation: row.delivery_location,
    riderName: row.rider_name,
    status: row.status,
    riskScore: row.risk_score,
    delayFlag: row.delay_flag,
    ghostingFlag: row.ghosting_flag,
    expectedDeliveryDate: row.expected_delivery_date,
    lastStatusUpdateAt: row.last_status_update_at,
    createdAt: row.created_at,
  })));
}));

// GET /api/logistics/dashboard/costs
// Cost breakdown by month and by rider
router.get("/costs", asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  const [byMonth, byRider] = await Promise.all([
    query(
      `SELECT
         to_char(date_trunc('month', created_at), 'Mon YYYY') AS month,
         date_trunc('month', created_at) AS month_start,
         COUNT(*) AS shipment_count,
         COALESCE(SUM(total_cost), 0) AS total_cost_kobo,
         COALESCE(SUM(fuel_cost), 0) AS fuel_cost_kobo,
         COALESCE(SUM(rider_fee), 0) AS rider_fee_kobo
       FROM shipments
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '6 months'
       GROUP BY date_trunc('month', created_at)
       ORDER BY month_start DESC`,
      [userId]
    ),
    query(
      `SELECT
         r.id AS rider_id,
         r.name AS rider_name,
         COUNT(s.id) AS shipment_count,
         COALESCE(SUM(s.total_cost), 0) AS total_cost_kobo,
         ROUND(
           COUNT(s.id) FILTER (WHERE s.status IN ('ghosted','failed'))::numeric
           / NULLIF(COUNT(s.id), 0) * 100, 1
         ) AS ghost_rate
       FROM riders r
       LEFT JOIN shipments s ON s.rider_id = r.id AND s.user_id = $1
       WHERE r.user_id = $1 AND r.is_active = TRUE
       GROUP BY r.id, r.name
       ORDER BY total_cost_kobo DESC`,
      [userId]
    ),
  ]);

  res.json({
    byMonth: byMonth.rows.map((r) => ({
      month: r.month,
      shipmentCount: parseInt(r.shipment_count, 10),
      totalCostKobo: parseInt(r.total_cost_kobo, 10),
      fuelCostKobo: parseInt(r.fuel_cost_kobo, 10),
      riderFeeKobo: parseInt(r.rider_fee_kobo, 10),
    })),
    byRider: byRider.rows.map((r) => ({
      riderId: r.rider_id,
      riderName: r.rider_name,
      shipmentCount: parseInt(r.shipment_count, 10),
      totalCostKobo: parseInt(r.total_cost_kobo, 10),
      ghostRate: parseFloat(r.ghost_rate || "0"),
    })),
  });
}));

module.exports = router;
