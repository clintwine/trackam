const express = require("express");
const router = express.Router();
const localAuthMiddleware = require("../../core/middlewares/localAuth");
const asyncHandler = require("../../core/middlewares/asyncHandler");
const { query } = require("../../core/db/postgres");
const runsRepo = require("../runs/runs.repository");

async function getGhostThresholdHours(userId) {
  const r = await query(
    `SELECT value FROM logistics_settings WHERE user_id = $1 AND key = 'ghost_threshold_hours'`,
    [userId]
  );
  return parseInt(r.rows[0]?.value || "48", 10);
}

router.use(localAuthMiddleware);

// GET /api/logistics/dashboard/summary
// Run-centric dashboard snapshot: today, this month, exposure, alert counts.
router.get("/summary", asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  const ghostThresholdHours = await getGhostThresholdHours(userId);
  await runsRepo.flagDelaysAndGhosting(userId, ghostThresholdHours);

  const [today, month, exposure, alerts] = await Promise.all([
    // Today: active runs, runs dispatched today, waybills awaiting dispatch
    query(
      `SELECT
         (SELECT COUNT(*) FROM dispatch_runs
            WHERE user_id = $1 AND status IN ('loading','in_transit'))::int AS active_runs,
         (SELECT COUNT(*) FROM dispatch_runs
            WHERE user_id = $1 AND departed_at::date = NOW()::date)::int AS runs_dispatched,
         (SELECT COUNT(*) FROM shipments
            WHERE user_id = $1 AND run_id IS NULL AND status = 'pending')::int AS waybills_unassigned`,
      [userId]
    ),
    // Month: run-level aggregates
    query(
      `SELECT
         COUNT(*)::int                                                              AS runs_dispatched,
         COUNT(*) FILTER (WHERE status = 'completed')::int                          AS runs_completed,
         COUNT(*) FILTER (WHERE ghosting_flag = TRUE)::int                          AS ghosted_count,
         COALESCE(SUM(total_cost) FILTER (WHERE status != 'cancelled'), 0)::bigint  AS total_cost_kobo,
         COALESCE(AVG(total_cost) FILTER (WHERE status != 'cancelled'), 0)::bigint  AS avg_cost_kobo,
         ROUND(
           COUNT(*) FILTER (WHERE ghosting_flag = TRUE)::numeric
           / NULLIF(COUNT(*), 0) * 100, 1
         ) AS ghost_rate
       FROM dispatch_runs
       WHERE user_id = $1
         AND date_trunc('month', created_at) = date_trunc('month', NOW())`,
      [userId]
    ),
    // Exposure
    query(
      `SELECT
         COALESCE((
           SELECT SUM(s.shipment_value)
           FROM shipments s
           JOIN dispatch_runs dr ON dr.id = s.run_id
           WHERE dr.user_id = $1 AND dr.status IN ('loading','in_transit')
         ), 0)
         + COALESCE((
           SELECT SUM(total_cost)
           FROM dispatch_runs
           WHERE user_id = $1 AND status IN ('loading','in_transit')
         ), 0) AS value_at_risk_kobo,
         COALESCE((
           SELECT SUM(s.shipment_value)
           FROM shipments s
           JOIN dispatch_runs dr ON dr.id = s.run_id
           WHERE dr.user_id = $1 AND dr.ghosting_flag = TRUE
         ), 0) AS all_time_value_lost_kobo`,
      [userId]
    ),
    // Alert counts (split by reason)
    query(
      `SELECT
         COUNT(*) FILTER (WHERE delay_flag = TRUE)::int    AS delayed_count,
         COUNT(*) FILTER (WHERE ghosting_flag = TRUE)::int AS ghosting_count
       FROM dispatch_runs
       WHERE user_id = $1 AND status IN ('loading','in_transit')`,
      [userId]
    ),
  ]);

  const t = today.rows[0];
  const m = month.rows[0];
  const e = exposure.rows[0];
  const a = alerts.rows[0];

  res.json({
    today: {
      activeRuns:         t.active_runs,
      runsDispatched:     t.runs_dispatched,
      waybillsUnassigned: t.waybills_unassigned,
    },
    month: {
      runsDispatched:    m.runs_dispatched,
      runsCompleted:     m.runs_completed,
      ghostedCount:      m.ghosted_count,
      ghostRate:         parseFloat(m.ghost_rate || "0"),
      totalCostKobo:     parseInt(m.total_cost_kobo, 10),
      avgCostPerRunKobo: parseInt(m.avg_cost_kobo, 10),
    },
    exposure: {
      valueAtRiskKobo:      parseInt(e.value_at_risk_kobo, 10),
      allTimeValueLostKobo: parseInt(e.all_time_value_lost_kobo, 10),
    },
    alerts: {
      delayedCount:  a.delayed_count,
      ghostingCount: a.ghosting_count,
      total:         a.delayed_count + a.ghosting_count,
    },
  });
}));

// GET /api/logistics/dashboard/alerts
// Runs flagged as delayed or ghosting (active runs only).
router.get("/alerts", asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  const ghostThresholdHours = await getGhostThresholdHours(userId);
  await runsRepo.flagDelaysAndGhosting(userId, ghostThresholdHours);

  const result = await query(
    `SELECT dr.*, r.name AS rider_name,
            COALESCE((SELECT COUNT(*) FROM shipments s WHERE s.run_id = dr.id), 0)::int AS leg_count
     FROM dispatch_runs dr
     LEFT JOIN riders r ON r.id = dr.rider_id
     WHERE dr.user_id = $1
       AND (dr.delay_flag = TRUE OR dr.ghosting_flag = TRUE)
       AND dr.status IN ('loading', 'in_transit')
     ORDER BY dr.created_at DESC`,
    [userId]
  );

  res.json(result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    riderName: row.rider_name,
    status: row.status,
    legCount: row.leg_count,
    distanceKm: Number(row.distance_km || 0),
    totalCost: Number(row.total_cost || 0),
    delayFlag: row.delay_flag,
    ghostingFlag: row.ghosting_flag,
    expectedDeliveryDate: row.expected_delivery_date,
    lastStatusUpdateAt: row.last_status_update_at,
    createdAt: row.created_at,
  })));
}));

// GET /api/logistics/dashboard/top-riders
// Top 5 riders this month by run cost, with ghost rate.
router.get("/top-riders", asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  const result = await query(
    `SELECT
       r.id   AS rider_id,
       r.name AS rider_name,
       r.vehicle_type,
       COUNT(dr.id)::int AS runs_total,
       COUNT(dr.id) FILTER (WHERE dr.status = 'completed')::int AS runs_completed,
       COALESCE(SUM(dr.total_cost), 0)::bigint AS total_cost_kobo,
       ROUND(
         COUNT(dr.id) FILTER (WHERE dr.ghosting_flag = TRUE OR dr.status = 'cancelled')::numeric
         / NULLIF(COUNT(dr.id), 0) * 100, 1
       ) AS ghost_rate
     FROM riders r
     LEFT JOIN dispatch_runs dr
       ON dr.rider_id = r.id
       AND dr.user_id = $1
       AND date_trunc('month', dr.created_at) = date_trunc('month', NOW())
     WHERE r.user_id = $1 AND r.is_active = TRUE
     GROUP BY r.id, r.name, r.vehicle_type
     HAVING COUNT(dr.id) > 0
     ORDER BY runs_total DESC, total_cost_kobo DESC
     LIMIT 5`,
    [userId]
  );

  res.json(result.rows.map((r) => ({
    riderId:        r.rider_id,
    riderName:      r.rider_name,
    vehicleType:    r.vehicle_type,
    runsTotal:      r.runs_total,
    runsCompleted:  r.runs_completed,
    totalCostKobo:  parseInt(r.total_cost_kobo, 10),
    ghostRate:      parseFloat(r.ghost_rate || "0"),
  })));
}));

// GET /api/logistics/dashboard/costs
// Run-level cost breakdown by month and by rider (existing, kept for /reports later).
router.get("/costs", asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  const [byMonth, byRider] = await Promise.all([
    query(
      `SELECT
         to_char(date_trunc('month', created_at), 'Mon YYYY') AS month,
         date_trunc('month', created_at) AS month_start,
         COUNT(*) AS run_count,
         COALESCE(SUM(total_cost), 0) AS total_cost_kobo,
         COALESCE(SUM(fuel_cost), 0) AS fuel_cost_kobo,
         COALESCE(SUM(rider_fee), 0) AS rider_fee_kobo
       FROM dispatch_runs
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '6 months'
       GROUP BY date_trunc('month', created_at)
       ORDER BY month_start DESC`,
      [userId]
    ),
    query(
      `SELECT
         r.id AS rider_id,
         r.name AS rider_name,
         COUNT(dr.id) AS run_count,
         COALESCE(SUM(dr.total_cost), 0) AS total_cost_kobo,
         ROUND(
           COUNT(dr.id) FILTER (WHERE dr.ghosting_flag = TRUE OR dr.status = 'cancelled')::numeric
           / NULLIF(COUNT(dr.id), 0) * 100, 1
         ) AS ghost_rate
       FROM riders r
       LEFT JOIN dispatch_runs dr ON dr.rider_id = r.id AND dr.user_id = $1
       WHERE r.user_id = $1 AND r.is_active = TRUE
       GROUP BY r.id, r.name
       ORDER BY total_cost_kobo DESC`,
      [userId]
    ),
  ]);

  res.json({
    byMonth: byMonth.rows.map((r) => ({
      month: r.month,
      shipmentCount: parseInt(r.run_count, 10),
      totalCostKobo: parseInt(r.total_cost_kobo, 10),
      fuelCostKobo: parseInt(r.fuel_cost_kobo, 10),
      riderFeeKobo: parseInt(r.rider_fee_kobo, 10),
    })),
    byRider: byRider.rows.map((r) => ({
      riderId: r.rider_id,
      riderName: r.rider_name,
      shipmentCount: parseInt(r.run_count, 10),
      totalCostKobo: parseInt(r.total_cost_kobo, 10),
      ghostRate: parseFloat(r.ghost_rate || "0"),
    })),
  });
}));

module.exports = router;
