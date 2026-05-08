const { info } = require("./logger");

// Send an SMS. Set SMS_PROVIDER=termii and TERMII_API_KEY to enable real delivery.
// Falls back to console/log in all other environments.
async function sendSms(to, body) {
  if (process.env.SMS_PROVIDER === "termii") {
    return sendTermii(to, body);
  }
  info("sms_stub", { to, body });
}

async function sendTermii(to, body) {
  const resp = await fetch("https://api.ng.termii.com/api/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to,
      from: process.env.TERMII_SENDER_ID || "Trackam",
      sms: body,
      type: "plain",
      channel: "generic",
      api_key: process.env.TERMII_API_KEY,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Termii SMS failed (${resp.status}): ${text}`);
  }
}

module.exports = { sendSms };
