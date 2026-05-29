const { spawn } = require("child_process");
const fs = require("fs");
const { BACKEND_DIR, FRONTEND_DIR, PID_FILE, isInstalled } = require("./paths");
const { step, ok, fail, dim, isWin } = require("./helpers");

module.exports = function start() {
  if (!isInstalled()) {
    fail("Trackam is not installed yet. Run 'trackam setup' first.");
    process.exit(1);
  }

  // Check if already running
  if (fs.existsSync(PID_FILE)) {
    try {
      const pids = JSON.parse(fs.readFileSync(PID_FILE, "utf8"));
      const alive = pids.some((p) => isProcessAlive(p.pid));
      if (alive) {
        fail("Trackam is already running. Run 'trackam stop' first, or 'trackam status' to check.");
        process.exit(1);
      }
    } catch {
      // Stale PID file — remove it
    }
    fs.unlinkSync(PID_FILE);
  }

  step("Starting Trackam");

  const pids = [];

  // Start backend
  dim("Starting backend...");
  const backend = spawn("npm", ["run", "dev"], {
    cwd: BACKEND_DIR,
    stdio: "ignore",
    detached: !isWin,
    shell: true,
    windowsHide: true,
  });
  backend.unref();
  pids.push({ name: "backend", pid: backend.pid });
  ok(`Backend started (PID ${backend.pid})`);

  // Start frontend
  dim("Starting frontend...");
  const frontend = spawn("npm", ["run", "dev"], {
    cwd: FRONTEND_DIR,
    stdio: "ignore",
    detached: !isWin,
    shell: true,
    windowsHide: true,
  });
  frontend.unref();
  pids.push({ name: "frontend", pid: frontend.pid });
  ok(`Frontend started (PID ${frontend.pid})`);

  // Save PIDs
  fs.writeFileSync(PID_FILE, JSON.stringify(pids, null, 2), "utf8");

  console.log(`
  Trackam is running!

    Frontend:  http://127.0.0.1:3429
    Backend:   http://127.0.0.1:4429

  Stop with:  trackam stop
`);
};

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
