/**
 * Thin server-to-server client for talking to OLI Switch from inside the
 * Trackam backend (not from a forwarded browser request).
 *
 * Resolves the operator's API key from oli_accounts (or falls back to the
 * deployment-wide OLI_API_KEY env var), then signs a fetch with the same
 * X-OLI-API-Key / X-OLI-User-ID headers the browser proxy sends.
 *
 * Use this for one-off operator-initiated pushes such as keeping rider
 * contact info in sync on the switch after a roster edit.
 */

const oliAccountRepo = require("./oli.account.repository");

const OLI_SWITCH_URL  = process.env.OLI_SWITCH_URL || "http://localhost:5000";
const OLI_API_KEY_ENV = process.env.OLI_API_KEY    || "";

async function resolveApiKey(userId) {
  if (userId) {
    try {
      const account = await oliAccountRepo.findByUserId(userId);
      if (account?.oli_api_key) return account.oli_api_key;
    } catch { /* fall through */ }
  }
  return OLI_API_KEY_ENV || null;
}

async function request(userId, method, path, body) {
  const apiKey = await resolveApiKey(userId);
  if (!apiKey) {
    return { skipped: true, reason: "no_api_key" };
  }

  const url = OLI_SWITCH_URL.replace(/\/$/, "") + path;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type":   "application/json",
      "x-oli-api-key":  apiKey,
      "x-oli-user-id":  userId || "",
    },
    body: body == null ? undefined : JSON.stringify(body),
  });

  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }

  if (!res.ok) {
    const msg = data?.message || `OLI Switch responded ${res.status}`;
    const err = new Error(`[oli.client] ${method} ${path} — ${msg}`);
    err.status = res.status;
    err.body   = data;
    throw err;
  }
  return data;
}

module.exports = {
  /** POST helper. Returns the parsed body or { skipped: true } if no API key. */
  post: (userId, path, body) => request(userId, "POST", path, body),
};
