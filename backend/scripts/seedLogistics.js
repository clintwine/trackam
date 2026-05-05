/**
 * Seed realistic Trackam demo data for uid_local_admin.
 * Run: npm run db:seed:logistics
 *
 * Creates: 5 riders, 6 routes, 30 shipments spread across the past 45 days
 * with varied statuses — including delayed, ghosted, and high-risk flagged.
 *
 * Uses SQL date arithmetic (NOW() - INTERVAL) so timestamps are always
 * in the DB's timezone, avoiding JS UTC-offset issues.
 */

const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const USER_ID = "uid_local_admin";

async function q(text, params) {
  return pool.query(text, params);
}

async function run() {
  console.log("Seeding Trackam logistics demo data…");

  // ── Cleanup ───────────────────────────────────────────────────────────────
  await q(`DELETE FROM shipment_status_log WHERE shipment_id IN (SELECT id FROM shipments WHERE user_id = $1)`, [USER_ID]);
  await q(`DELETE FROM shipments WHERE user_id = $1`, [USER_ID]);
  await q(`DELETE FROM routes WHERE user_id = $1`, [USER_ID]);
  await q(`DELETE FROM riders WHERE user_id = $1`, [USER_ID]);
  await q(`DELETE FROM logistics_settings WHERE user_id = $1`, [USER_ID]);
  console.log("  ✓ cleared old data");

  // ── Settings ─────────────────────────────────────────────────────────────
  const settings = [
    ["fuel_price_per_litre", "1150"],
    ["fuel_efficiency_multiplier", "0.12"],
    ["ghost_threshold_hours", "48"],
    ["business_name", "Tunde Accessories"],
    ["business_city", "Lagos"],
  ];
  for (const [key, value] of settings) {
    await q(
      `INSERT INTO logistics_settings (id, user_id, key, value)
       VALUES (gen_random_uuid()::text, $1, $2, $3)`,
      [USER_ID, key, value]
    );
  }
  console.log("  ✓ settings");

  // ── Riders ────────────────────────────────────────────────────────────────
  const riders = [
    { id: "rider_ibrahim",  name: "Ibrahim Musa",     phone: "08031234567", vehicle_type: "truck",    city_coverage: "Lagos, Onitsha, Aba",          base_fee: 4500000 },
    { id: "rider_emeka",    name: "Emeka Okafor",     phone: "08058889991", vehicle_type: "van",      city_coverage: "Lagos, Ibadan, Abeokuta",      base_fee: 1800000 },
    { id: "rider_fatima",   name: "Fatima Aliyu",     phone: "08077651234", vehicle_type: "bike",     city_coverage: "Lagos Island, Victoria Island", base_fee: 350000 },
    { id: "rider_chukwu",   name: "Chukwuemeka Eze",  phone: "08100002222", vehicle_type: "van",      city_coverage: "Lagos, Benin, Asaba",          base_fee: 2200000 },
    { id: "rider_segun",    name: "Segun Adeyemi",    phone: "08155556789", vehicle_type: "tricycle", city_coverage: "Mushin, Oshodi, Ikeja",        base_fee: 280000 },
  ];

  for (const r of riders) {
    await q(
      `INSERT INTO riders (id, user_id, name, phone, vehicle_type, city_coverage, base_fee, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
      [r.id, USER_ID, r.name, r.phone, r.vehicle_type, r.city_coverage, r.base_fee]
    );
  }
  console.log("  ✓ riders");

  // ── Routes ────────────────────────────────────────────────────────────────
  const routes = [
    { id: "route_onitsha", name: "Onitsha Run",     pickup: "Balogun Market, Lagos",  delivery: "Onitsha Main Market",     km: 520, rider: "rider_ibrahim", fee: 4500000, goods: "Phone accessories",          useCount: 14 },
    { id: "route_ibadan",  name: "Ibadan Drop",     pickup: "Trade Fair, Lagos",       delivery: "Dugbe Market, Ibadan",    km: 145, rider: "rider_emeka",   fee: 1800000, goods: "Phone cases & chargers",     useCount: 9  },
    { id: "route_island",  name: "Island Delivery", pickup: "Alaba Int'l Market",      delivery: "Victoria Island",         km: 22,  rider: "rider_fatima",  fee: 350000,  goods: "Earphones & cables",         useCount: 21 },
    { id: "route_benin",   name: "Benin Express",   pickup: "Balogun Market, Lagos",  delivery: "Oba Market, Benin City",  km: 310, rider: "rider_chukwu",  fee: 2200000, goods: "Wholesale accessories",       useCount: 7  },
    { id: "route_oshodi",  name: "Oshodi Local",    pickup: "Ikeja warehouse",         delivery: "Oshodi Under Bridge",     km: 8,   rider: "rider_segun",   fee: 280000,  goods: "Retail stock",               useCount: 33 },
    { id: "route_aba",     name: "Aba Long Haul",   pickup: "Balogun Market, Lagos",  delivery: "Ariaria Market, Aba",     km: 610, rider: "rider_ibrahim", fee: 5200000, goods: "Bulk accessories",           useCount: 5  },
  ];

  for (const r of routes) {
    await q(
      `INSERT INTO routes (id, user_id, name, pickup_location, delivery_location, distance_km, default_rider_id, default_rider_fee, default_goods_description, use_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [r.id, USER_ID, r.name, r.pickup, r.delivery, r.km, r.rider, r.fee, r.goods, r.useCount]
    );
  }
  console.log("  ✓ routes");

  // ── Shipments ─────────────────────────────────────────────────────────────
  // fuel cost: 1150 * 0.12 = 138 NGN/km, stored in kobo (×100)
  function fuel(km) { return Math.round(km * 0.12 * 1150) * 100; }

  // All dates computed via SQL NOW() - INTERVAL to stay in DB timezone.
  // created_at / updated_at = NOW() - daysAgo days
  // expected_delivery_date = NOW()::date + expectedOffset days

  const shipments = [
    // ── Today: live activity ──────────────────────────────────────────────
    { id: "ship_01", route: "route_oshodi",  rider: "rider_segun",   km: 8,   fee: 280000,  status: "pending",   daysAgo: 0, expectedOffset: 0,  actual: null,  goods: "Retail top-up — 4 boxes",             riskScore: "low",    riskPts: 0,  shipmentValue:   8000000, recipientName: "Alhaji Bello Usman",  recipientPhone: "08023451122" },
    { id: "ship_02", route: "route_island",  rider: "rider_fatima",  km: 22,  fee: 350000,  status: "in_transit",daysAgo: 0, expectedOffset: 0,  actual: null,  goods: "Earphones — 60 pcs",                  riskScore: "low",    riskPts: 10, shipmentValue:  15000000, recipientName: "Mrs Chioma Obi",      recipientPhone: "08134567890" },
    { id: "ship_03", route: "route_ibadan",  rider: "rider_emeka",   km: 145, fee: 1800000, status: "in_transit",daysAgo: 0, expectedOffset: 1,  actual: null,  goods: "Chargers — 300 units",                riskScore: "medium", riskPts: 30, shipmentValue: 120000000, recipientName: "Kunle Adeyinka",      recipientPhone: "08056781234" },

    // ── This week: a mix ───────────────────────────────────────────────────
    { id: "ship_04", route: "route_oshodi",  rider: "rider_segun",   km: 8,   fee: 280000,  status: "delivered", daysAgo: 1, expectedOffset: -1, actual: -1,    goods: "Retail stock — 3 boxes",              riskScore: "low",    riskPts: 0,  shipmentValue:   6000000, recipientName: "Musa Ibrahim",        recipientPhone: "07061234567" },
    { id: "ship_05", route: "route_island",  rider: "rider_fatima",  km: 22,  fee: 350000,  status: "delivered", daysAgo: 1, expectedOffset: -1, actual: -1,    goods: "Premium earphones — 40 pcs",          riskScore: "low",    riskPts: 10, shipmentValue:  25000000, recipientName: "Ngozi Eze",           recipientPhone: "08112345678" },
    { id: "ship_06", route: "route_onitsha", rider: "rider_ibrahim", km: 520, fee: 4500000, status: "delivered", daysAgo: 2, expectedOffset: -2, actual: -2,    goods: "Phone accessories — 200 units",       riskScore: "high",   riskPts: 55, shipmentValue: 380000000, recipientName: "Adeola Fashola",      recipientPhone: "08033334444" },
    { id: "ship_07", route: "route_ibadan",  rider: "rider_emeka",   km: 145, fee: 1800000, status: "delivered", daysAgo: 3, expectedOffset: -3, actual: -3,    goods: "Phone cases — 500 units",             riskScore: "medium", riskPts: 30, shipmentValue: 145000000, recipientName: "Emeka Nwachukwu",    recipientPhone: "08145556666" },
    { id: "ship_08", route: "route_benin",   rider: "rider_chukwu",  km: 310, fee: 2200000, status: "delivered", daysAgo: 4, expectedOffset: -4, actual: -4,    goods: "Wholesale accessories — bulk",        riskScore: "high",   riskPts: 50, shipmentValue: 200000000, recipientName: "Sule Maikano",        recipientPhone: "07034567890" },

    // ── Alerts: delayed + ghosting risk ────────────────────────────────────
    { id: "ship_09", route: "route_aba",     rider: "rider_ibrahim", km: 610, fee: 5200000, status: "in_transit",daysAgo: 6, expectedOffset: -3, actual: null,  goods: "Accessories — Container B",           riskScore: "high",   riskPts: 70, shipmentValue: 520000000, recipientName: "Chief Okwu Onuoha",  recipientPhone: "08067891234", delay: true },
    { id: "ship_10", route: "route_benin",   rider: "rider_chukwu",  km: 310, fee: 2200000, status: "in_transit",daysAgo: 5, expectedOffset: -2, actual: null,  goods: "Benin wholesale — overdue batch",     riskScore: "high",   riskPts: 50, shipmentValue: 180000000, recipientName: "Tunde Bakare",        recipientPhone: "08090001111", delay: true, ghost: true },

    // ── Past month history ─────────────────────────────────────────────────
    { id: "ship_11", route: "route_onitsha", rider: "rider_ibrahim", km: 520, fee: 4500000, status: "delivered", daysAgo: 8,  expectedOffset: -8,  actual: -8,  goods: "Accessories Q2 — 200 units",          riskScore: "high",   riskPts: 55, shipmentValue: 350000000, recipientName: "Aminu Garba",         recipientPhone: "08022223333" },
    { id: "ship_12", route: "route_ibadan",  rider: "rider_emeka",   km: 145, fee: 1800000, status: "delivered", daysAgo: 9,  expectedOffset: -9,  actual: -9,  goods: "Cases — 400 units",                   riskScore: "medium", riskPts: 30, shipmentValue: 110000000, recipientName: "Stella Aniebo",       recipientPhone: "08144445555" },
    { id: "ship_13", route: "route_island",  rider: "rider_fatima",  km: 22,  fee: 350000,  status: "delivered", daysAgo: 10, expectedOffset: -10, actual: -10, goods: "Cables — 100 pcs",                    riskScore: "low",    riskPts: 10, shipmentValue:  30000000, recipientName: "Chidi Okonkwo",       recipientPhone: "08056667777" },
    { id: "ship_14", route: "route_oshodi",  rider: "rider_segun",   km: 8,   fee: 280000,  status: "delivered", daysAgo: 11, expectedOffset: -11, actual: -11, goods: "Local drop — 5 boxes",                riskScore: "low",    riskPts: 0,  shipmentValue:   5000000, recipientName: "Remi Adewale",        recipientPhone: "07045678901" },
    { id: "ship_15", route: "route_benin",   rider: "rider_chukwu",  km: 310, fee: 2200000, status: "delivered", daysAgo: 13, expectedOffset: -13, actual: -13, goods: "Wholesale batch 3",                   riskScore: "high",   riskPts: 50, shipmentValue: 220000000, recipientName: "Ibrahim Sule",        recipientPhone: "08099990000" },
    { id: "ship_16", route: "route_aba",     rider: "rider_ibrahim", km: 610, fee: 5200000, status: "ghosted",   daysAgo: 15, expectedOffset: -13, actual: -12, goods: "Aba long haul — missing",             riskScore: "high",   riskPts: 70, shipmentValue: 480000000, recipientName: "Fatou Diallo",        recipientPhone: "08111112222" },
    { id: "ship_17", route: "route_onitsha", rider: "rider_ibrahim", km: 520, fee: 4500000, status: "delivered", daysAgo: 17, expectedOffset: -17, actual: -17, goods: "Phone accessories — restock",         riskScore: "high",   riskPts: 55, shipmentValue: 360000000, recipientName: "Nneka Obiora",        recipientPhone: "08033334445" },
    { id: "ship_18", route: "route_island",  rider: "rider_fatima",  km: 22,  fee: 350000,  status: "delivered", daysAgo: 18, expectedOffset: -18, actual: -18, goods: "Island drop — headphones",            riskScore: "low",    riskPts: 10, shipmentValue:  45000000, recipientName: "Babatunde Ojo",       recipientPhone: "08156789012" },
    { id: "ship_19", route: "route_ibadan",  rider: "rider_emeka",   km: 145, fee: 1800000, status: "delivered", daysAgo: 19, expectedOffset: -19, actual: -19, goods: "Ibadan restocking",                   riskScore: "medium", riskPts: 30, shipmentValue:  95000000, recipientName: "Ahmed Aliyu",         recipientPhone: "07067890123" },
    { id: "ship_20", route: "route_oshodi",  rider: "rider_segun",   km: 8,   fee: 280000,  status: "delivered", daysAgo: 20, expectedOffset: -20, actual: -20, goods: "Local drop — 6 boxes",                riskScore: "low",    riskPts: 0,  shipmentValue:   7000000, recipientName: "Patience Ike",        recipientPhone: "08088889999" },
    { id: "ship_21", route: "route_onitsha", rider: "rider_ibrahim", km: 520, fee: 4500000, status: "delivered", daysAgo: 22, expectedOffset: -22, actual: -22, goods: "Q2 opening stock — Onitsha",          riskScore: "high",   riskPts: 55, shipmentValue: 410000000, recipientName: "Okonkwo David",       recipientPhone: "08022221111" },
    { id: "ship_22", route: "route_benin",   rider: "rider_chukwu",  km: 310, fee: 2200000, status: "delivered", daysAgo: 23, expectedOffset: -23, actual: -23, goods: "Benin mid-month batch",               riskScore: "high",   riskPts: 50, shipmentValue: 175000000, recipientName: "Hajiya Maryam",       recipientPhone: "08144443333" },
    { id: "ship_23", route: "route_aba",     rider: "rider_ibrahim", km: 610, fee: 5200000, status: "ghosted",   daysAgo: 25, expectedOffset: -23, actual: -22, goods: "Bulk accessories — Container A",      riskScore: "high",   riskPts: 70, shipmentValue: 560000000, recipientName: "Samuel Osei",         recipientPhone: "08056665555" },
    { id: "ship_24", route: "route_island",  rider: "rider_fatima",  km: 22,  fee: 350000,  status: "delivered", daysAgo: 26, expectedOffset: -26, actual: -26, goods: "Island run — earphones",              riskScore: "low",    riskPts: 10, shipmentValue:  38000000, recipientName: "Toyin Adesanya",      recipientPhone: "07045674321" },
    { id: "ship_25", route: "route_ibadan",  rider: "rider_emeka",   km: 145, fee: 1800000, status: "delivered", daysAgo: 27, expectedOffset: -27, actual: -27, goods: "Chargers batch 2",                    riskScore: "medium", riskPts: 30, shipmentValue:  88000000, recipientName: "Festus Obiechina",    recipientPhone: "08099998888" },
    { id: "ship_26", route: "route_oshodi",  rider: "rider_segun",   km: 8,   fee: 280000,  status: "delivered", daysAgo: 28, expectedOffset: -28, actual: -28, goods: "Local stock",                         riskScore: "low",    riskPts: 0,  shipmentValue:   9000000, recipientName: "Aisha Umar",          recipientPhone: "08111110000" },
    { id: "ship_27", route: "route_onitsha", rider: "rider_ibrahim", km: 520, fee: 4500000, status: "delivered", daysAgo: 30, expectedOffset: -30, actual: -30, goods: "Phone accessories — March run",       riskScore: "high",   riskPts: 55, shipmentValue: 290000000, recipientName: "Chukwudi Eze",        recipientPhone: "08033336666" },
    { id: "ship_28", route: "route_benin",   rider: "rider_chukwu",  km: 310, fee: 2200000, status: "delivered", daysAgo: 33, expectedOffset: -33, actual: -33, goods: "Wholesale batch 1",                   riskScore: "high",   riskPts: 50, shipmentValue: 160000000, recipientName: "Seun Olawale",        recipientPhone: "08156780000" },
    { id: "ship_29", route: "route_aba",     rider: "rider_ibrahim", km: 610, fee: 5200000, status: "delivered", daysAgo: 36, expectedOffset: -36, actual: -35, goods: "Bulk run — April",                    riskScore: "high",   riskPts: 70, shipmentValue: 500000000, recipientName: "Mallam Yusuf",        recipientPhone: "07067891234" },
    { id: "ship_30", route: "route_island",  rider: "rider_fatima",  km: 22,  fee: 350000,  status: "failed",    daysAgo: 40, expectedOffset: -40, actual: -39, goods: "Cables — lost parcel",                riskScore: "low",    riskPts: 10, shipmentValue:  22000000, recipientName: "Ngozi Anyanwu",       recipientPhone: "08088880000" },
  ];

  const routeMap = Object.fromEntries(routes.map(r => [r.id, r]));

  for (const s of shipments) {
    const fuelCost = fuel(s.km);
    const totalCost = fuelCost + s.fee;

    // last_status_update_at: for delayed/ghost rows, use 3 days ago; otherwise same as created_at
    const lastUpdateExpr = (s.delay || s.ghost)
      ? `NOW() - INTERVAL '3 days'`
      : `NOW() - INTERVAL '${s.daysAgo} days'`;

    const actualDeliveryExpr = s.actual !== null
      ? `(NOW() - INTERVAL '${s.daysAgo} days')::date + INTERVAL '${Math.abs(s.actual)} days'`
      : "NULL";

    await q(
      `INSERT INTO shipments
         (id, user_id, route_id, rider_id, goods_description,
          pickup_location, delivery_location, distance_km,
          rider_fee, fuel_cost, total_cost, status,
          risk_score, risk_score_points, risk_score_reasons,
          shipment_value,
          recipient_name, recipient_phone,
          expected_delivery_date,
          actual_delivery_date,
          last_status_update_at,
          delay_flag, ghosting_flag,
          created_at, updated_at)
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
         $16, $17, $18,
         (NOW()::date + INTERVAL '${s.expectedOffset} days')::date,
         ${s.actual !== null ? `(NOW()::date + INTERVAL '${s.actual} days')::date` : "NULL"},
         ${lastUpdateExpr},
         $19, $20,
         NOW() - INTERVAL '${s.daysAgo} days',
         NOW() - INTERVAL '${s.daysAgo} days'
       )`,
      [
        s.id, USER_ID, s.route, s.rider, s.goods,
        routeMap[s.route].pickup, routeMap[s.route].delivery,
        s.km, s.fee, fuelCost, totalCost, s.status,
        s.riskScore, s.riskPts, [],
        s.shipmentValue || 0,
        s.recipientName || null, s.recipientPhone || null,
        s.delay ? true : false,
        s.ghost ? true : false,
      ]
    );

    // Status log entries
    const logs = [];
    if (["in_transit","delivered","failed","ghosted"].includes(s.status)) {
      logs.push({ old: "pending",    new: "in_transit", offsetHours: s.daysAgo * 24 - 2 });
    }
    if (["delivered","failed","ghosted"].includes(s.status)) {
      logs.push({ old: "in_transit", new: s.status,     offsetHours: s.daysAgo * 24 - 8 });
    }

    for (const l of logs) {
      await q(
        `INSERT INTO shipment_status_log (id, shipment_id, old_status, new_status, changed_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, NOW() - INTERVAL '${l.offsetHours} hours')`,
        [s.id, l.old, l.new]
      );
    }
    // Initial "pending" log entry
    await q(
      `INSERT INTO shipment_status_log (id, shipment_id, old_status, new_status, note, changed_at)
       VALUES (gen_random_uuid()::text, $1, NULL, 'pending', 'Shipment created', NOW() - INTERVAL '${s.daysAgo * 24} hours')`,
      [s.id]
    );
  }
  console.log("  ✓ shipments + status logs");
  console.log("\nDone. Dashboard is now buzzing 🚛");
}

run()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => pool.end());
