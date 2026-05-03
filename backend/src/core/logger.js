function log(level, message, meta = {}) {
  // Basic structured logger around console.*
  const timestamp = new Date().toISOString();
  const payload = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";

  // eslint-disable-next-line no-console
  const target = level === "error" ? console.error : console.log;
  target(`[${timestamp}] [${level.toUpperCase()}] ${message}${payload}`);
}

function info(message, meta) {
  log("info", message, meta);
}

function warn(message, meta) {
  log("warn", message, meta);
}

function error(message, meta) {
  log("error", message, meta);
}

module.exports = {
  log,
  info,
  warn,
  error,
};

