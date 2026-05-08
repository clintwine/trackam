const jwt = require("jsonwebtoken");
const { warn } = require("./logger");

const JWT_SECRET = process.env.JWT_SECRET;

function custodianAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No custodian token provided" });
  }
  const token = authHeader.split("Bearer ")[1].trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== "custodian") {
      return res.status(401).json({ message: "Invalid token type" });
    }
    req.custodian = {
      sessionId: decoded.sub,
      shipmentId: decoded.shipmentId,
      waybillId: decoded.waybillId || null,
      name: decoded.name,
      phone: decoded.phone,
      actorType: decoded.actorType,
    };
    return next();
  } catch (err) {
    warn("custodian_auth_error", { message: err.message });
    return res.status(401).json({ message: "Invalid or expired custodian session" });
  }
}

module.exports = custodianAuthMiddleware;
