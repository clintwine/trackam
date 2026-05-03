const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const UsersService = require("../users/users.service");
const UsersRepository = require("../users/users.repository");
const SessionsRepository = require("../sessions/sessions.repository");
const DevicesRepository = require("../devices/devices.repository");
const EventsRepository = require("../events/events.repository");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION_SECONDS = Number(
  process.env.JWT_EXPIRATION_SECONDS || "3600"
);

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required for the local backend template");
}

function signPayload(payload, expiresInSeconds = JWT_EXPIRATION_SECONDS) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${Math.max(1, Math.floor(expiresInSeconds))}s`,
  });
}

async function signup({ email, password, profile = {} }) {
  const existing = await UsersService.getUserByEmail(email);
  if (existing) {
    throw new Error("Email already registered");
  }

  const uid = uuidv4();
  const passwordHash = await bcrypt.hash(password, 12);

  const userPayload = {
    email,
    displayName: profile.displayName,
    photoURL: profile.photoURL,
    roles: profile.roles || [],
    emailVerified: false,
    preferences: profile.preferences || {},
    passwordHash,
  };

  const user = await UsersService.upsertUser(uid, userPayload);

  const idToken = signPayload({
    sub: user.id,
    email: user.email,
    roles: user.roles,
    email_verified: user.emailVerified,
  });

  const verification = {
    message: "Email verification is a manual step in the local stack",
  };

  return {
    idToken,
    user,
    verification,
  };
}

async function login({ email, password, context = {} }) {
  const authRecord = await UsersRepository.getAuthRecordByEmail(email);
  if (!authRecord || !authRecord.passwordHash) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const passwordMatches = await bcrypt.compare(password, authRecord.passwordHash);
  if (!passwordMatches) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const user = await UsersService.getUser(authRecord.id);

  const idToken = signPayload({
    sub: user.id,
    email: user.email,
    roles: user.roles,
    email_verified: user.emailVerified,
  });

  await SessionsRepository.createSession(user.id, {
    ip: context.ip || null,
    userAgent: context.userAgent || null,
  });

  if (context.userAgent) {
    const deviceFingerprint = `${context.userAgent}${
      context.ip ? `|${context.ip}` : ""
    }`;
    await DevicesRepository.registerDevice(user.id, deviceFingerprint);
  }

  await EventsRepository.create({
    type: "auth.login",
    payload: {
      uid: user.id,
      ip: context.ip || null,
      userAgent: context.userAgent || null,
    },
  });

  return {
    idToken,
    user,
  };
}

async function forgotPassword({ email }) {
  // In the local stack we don't have an email service; respond with a hint.
  return {
    message:
      "Password reset isn’t hooked up in the local template. Update the password in the database or extend this flow to send emails.",
    email,
  };
}

async function resendVerification({ idToken }) {
  jwt.verify(idToken, JWT_SECRET);
  return {
    message:
      "Email verification tokens are managed manually in the local stack.",
  };
}

async function logout(uid) {
  await SessionsRepository.endRecentSessions(uid);
  return { success: true };
}

async function createSessionCookie(idToken, expiresInMs) {
  const decoded = jwt.verify(idToken, JWT_SECRET);
  const expiresIn =
    typeof expiresInMs === "number" && expiresInMs > 0
      ? expiresInMs
      : JWT_EXPIRATION_SECONDS * 1000;
  const sessionPayload = {
    sub: decoded.sub,
    email: decoded.email,
    roles: decoded.roles || [],
    email_verified: Boolean(decoded.email_verified),
  };
  const expiresInSeconds = Math.max(1, Math.floor(expiresIn / 1000));
  const sessionCookie = signPayload(sessionPayload, expiresInSeconds);
  return {
    sessionCookie,
    expiresIn,
  };
}

module.exports = {
  signup,
  login,
  forgotPassword,
  resendVerification,
  logout,
  createSessionCookie,
};

