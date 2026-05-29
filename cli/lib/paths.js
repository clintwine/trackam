const path = require("path");
const os = require("os");
const fs = require("fs");

// Trackam installs into ~/trackam
const TRACKAM_DIR = path.join(os.homedir(), "trackam");
const BACKEND_DIR = path.join(TRACKAM_DIR, "backend");
const FRONTEND_DIR = path.join(TRACKAM_DIR, "frontend");
const PID_FILE = path.join(TRACKAM_DIR, ".trackam-pids.json");
const ENV_FILE = path.join(BACKEND_DIR, ".env");

function isInstalled() {
  return fs.existsSync(BACKEND_DIR) && fs.existsSync(FRONTEND_DIR);
}

module.exports = { TRACKAM_DIR, BACKEND_DIR, FRONTEND_DIR, PID_FILE, ENV_FILE, isInstalled };
