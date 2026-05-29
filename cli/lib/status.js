const fs = require("fs");
const { PID_FILE, isInstalled } = require("./paths");
const { ok, warn, fail, dim } = require("./helpers");

module.exports = function status() {
  console.log();

  if (!isInstalled()) {
    fail("Trackam is not installed. Run 'trackam setup'.");
    console.log();
    return;
  }

  ok("Trackam is installed");

  if (!fs.existsSync(PID_FILE)) {
    dim("Not running. Start with: trackam start");
    console.log();
    return;
  }

  let pids;
  try {
    pids = JSON.parse(fs.readFileSync(PID_FILE, "utf8"));
  } catch {
    warn("PID file is corrupted. Run 'trackam stop' then 'trackam start'.");
    console.log();
    return;
  }

  let anyAlive = false;
  for (const { name, pid } of pids) {
    const alive = isProcessAlive(pid);
    if (alive) {
      ok(`${name} is running (PID ${pid})`);
      anyAlive = true;
    } else {
      warn(`${name} is not running (PID ${pid} dead)`);
    }
  }

  if (!anyAlive) {
    dim("No processes alive. Run 'trackam start' to restart.");
    // Clean up stale PID file
    fs.unlinkSync(PID_FILE);
  }

  console.log();
};

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
