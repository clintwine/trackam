const { warn } = require("../logger");

// Simple in-memory fixed-window rate limiter per IP + route
const buckets = new Map();

function rateLimiter(req, res, next) {
  const windowMs =
    Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60_000;
  const maxRequestsPerWindow =
    Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 60;

  const key = `${req.ip}:${req.baseUrl || req.originalUrl}`;
  const now = Date.now();

  const bucket = buckets.get(key) || { count: 0, windowStart: now };

  if (now - bucket.windowStart > windowMs) {
    bucket.count = 0;
    bucket.windowStart = now;
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  if (bucket.count > maxRequestsPerWindow) {
    warn("rate_limited", {
      ip: req.ip,
      path: req.originalUrl,
      count: bucket.count,
    });
    return res
      .status(429)
      .json({ message: "Too many requests. Please try again later." });
  }

  return next();
}

module.exports = rateLimiter;
