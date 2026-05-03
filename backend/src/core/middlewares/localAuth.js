const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const { warn } = require("../logger");

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "local_session";
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required for the local backend template");
}

function extractToken(req) {
  const rawCookieHeader = req.headers.cookie || "";
  if (rawCookieHeader) {
    const cookies = cookie.parse(rawCookieHeader);
    if (cookies[SESSION_COOKIE_NAME]) {
      return cookies[SESSION_COOKIE_NAME];
    }
  }

  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.split("Bearer ")[1].trim();
  }

  return null;
}

function localAuthMiddleware(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      uid: decoded.sub,
      email: decoded.email,
      roles: Array.isArray(decoded.roles) ? decoded.roles : [],
      email_verified: Boolean(decoded.email_verified),
    };
    return next();
  } catch (err) {
    warn("local_auth_error", { message: err.message });
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = localAuthMiddleware;
