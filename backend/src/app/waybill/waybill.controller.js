/**
 * Waybill local router — intercepts GET /api/waybill/mine so we can enrich
 * the OLI switch response with dispatch run data from the local trackam DB.
 *
 * All other /api/waybill/* routes fall through to the generic OLI proxy
 * that is mounted after this router in index.js.
 */

const express           = require("express");
const http              = require("http");
const https             = require("https");
const { URL }           = require("url");
const { query }         = require("../../core/db/postgres");
const localAuthOptional = require("../../core/middlewares/localAuthOptional");
const asyncHandler      = require("../../core/middlewares/asyncHandler");

const router = express.Router();

const OLI_SWITCH_URL = process.env.OLI_SWITCH_URL || "http://localhost:5000";
const OLI_API_KEY    = process.env.OLI_API_KEY    || "";

// ── Internal helper: call OLI switch with operator credentials ───────────────

function oliGet(path, userId) {
  const base       = new URL(OLI_SWITCH_URL);
  const httpModule = base.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const options = {
      hostname: base.hostname,
      port:     base.port || (base.protocol === "https:" ? 443 : 80),
      path,
      method:   "GET",
      headers: {
        "accept":        "application/json",
        "x-oli-api-key": OLI_API_KEY,
        "x-oli-user-id": userId || "",
      },
    };

    const req = httpModule.request(options, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          reject(new Error("Non-JSON response from OLI switch"));
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

// ── GET /api/waybill/mine ────────────────────────────────────────────────────
// Fetch waybills from OLI switch, enrich with local run data, return.

router.get("/mine", localAuthOptional, asyncHandler(async (req, res) => {
  const userId = req.user?.uid;

  // 1. Fetch from OLI switch
  let waybills;
  try {
    const { status, data } = await oliGet("/api/waybill/mine", userId);
    if (status !== 200) return res.status(status).json(data);
    waybills = data;
  } catch (err) {
    return res.status(502).json({ error: "OLI switch unavailable", detail: err.message });
  }

  if (!Array.isArray(waybills) || waybills.length === 0) {
    return res.json(waybills ?? []);
  }

  // 2. Collect shipment IDs to look up run assignment in local DB
  const shipmentIds = waybills.map((w) => w.shipmentId).filter(Boolean);

  if (shipmentIds.length === 0) {
    return res.json(waybills);
  }

  // 3. Query local DB for run info
  try {
    const result = await query(
      `SELECT
         s.id          AS shipment_id,
         dr.id         AS run_id,
         dr.name       AS run_name,
         dr.status     AS run_status
       FROM shipments s
       LEFT JOIN dispatch_runs dr ON dr.id = s.run_id
       WHERE s.id = ANY($1)`,
      [shipmentIds]
    );

    const runMap = {};
    for (const row of result.rows) {
      runMap[row.shipment_id] = {
        runId:     row.run_id     || null,
        runName:   row.run_name   || null,
        runStatus: row.run_status || null,
      };
    }

    // 4. Merge run data back into each waybill
    const enriched = waybills.map((w) => {
      const run = w.shipmentId ? (runMap[w.shipmentId] ?? null) : null;
      return {
        ...w,
        runId:     run?.runId     ?? null,
        runName:   run?.runName   ?? null,
        runStatus: run?.runStatus ?? null,
      };
    });

    return res.json(enriched);
  } catch {
    // DB failure is non-fatal — return unenriched data
    return res.json(waybills);
  }
}));

module.exports = router;
