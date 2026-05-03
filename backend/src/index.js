const express = require("express");
const cors = require("cors");
const asyncHandler = require("./core/middlewares/asyncHandler");
const rateLimiter = require("./core/middlewares/rateLimiter");
const requestLogger = require("./core/middlewares/requestLogger");
const errorHandler = require("./core/middlewares/errorHandler");
const { query } = require("./core/db/postgres");
const { ensureStorageDir, storageDirectory } = require("./core/storage/localStorage");

const app = express();
const LOCAL_HOST_ALIASES = new Set(["localhost", "127.0.0.1"]);

function normalizeOrigin(origin) {
  try {
    const url = new URL(origin);
    return `${url.protocol}//${url.hostname}:${url.port || (url.protocol === "https:" ? "443" : "80")}`;
  } catch {
    return null;
  }
}

function buildAllowedOrigins(value) {
  const configured = String(value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const allowed = new Set();

  for (const origin of configured) {
    const normalized = normalizeOrigin(origin);
    if (!normalized) continue;
    allowed.add(normalized);

    try {
      const url = new URL(origin);
      if (LOCAL_HOST_ALIASES.has(url.hostname)) {
        for (const alias of LOCAL_HOST_ALIASES) {
          allowed.add(`${url.protocol}//${alias}:${url.port || (url.protocol === "https:" ? "443" : "80")}`);
        }
      }
    } catch {
      // Ignore malformed origins here and let the normalized set drive decisions.
    }
  }

  return allowed;
}

const allowedOrigins = buildAllowedOrigins(process.env.FRONTEND_URL);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.size === 0) {
        return callback(null, true);
      }

      const normalizedOrigin = normalizeOrigin(origin);
      if (normalizedOrigin && allowedOrigins.has(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(requestLogger);

ensureStorageDir();
app.use("/storage", express.static(storageDirectory));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get(
  "/ready",
  asyncHandler(async (req, res) => {
    await query("SELECT 1");
    res.json({ status: "ready" });
  })
);

app.use("/api/users", rateLimiter, require("./app/users/users.controller"));
app.use("/api/auth", require("./app/auth/auth.controller"));
app.use(
  "/api/notifications",
  rateLimiter,
  require("./app/notifications/notifications.controller")
);
app.use("/api/events", rateLimiter, require("./app/events/events.controller"));
app.use("/api/roles", require("./app/roles/roles.controller"));
app.use("/api/settings", require("./app/settings/settings.controller"));
app.use("/api/devices", rateLimiter, require("./app/devices/devices.controller"));
app.use("/api/sessions", rateLimiter, require("./app/sessions/sessions.controller"));

app.use("/", (req, res) => {
  res.send(
    "Backend API is up. Postgres-backed routes are available under /api/* (users, notifications, events, roles, settings, devices, sessions)."
  );
});

app.use(errorHandler);

module.exports = app;
