const { TRACKAM_DIR, BACKEND_DIR, FRONTEND_DIR, isInstalled } = require("./paths");
const { step, ok, fail, dim, run } = require("./helpers");

module.exports = function update() {
  if (!isInstalled()) {
    fail("Trackam is not installed. Run 'trackam setup' first.");
    process.exit(1);
  }

  step("Pulling latest code");
  run("git pull --ff-only", { cwd: TRACKAM_DIR });
  ok("Code updated");

  step("Installing dependencies");
  dim("Backend...");
  run("npm install", { cwd: BACKEND_DIR });
  ok("Backend dependencies");

  dim("Frontend...");
  run("npm install", { cwd: FRONTEND_DIR });
  ok("Frontend dependencies");

  step("Running migrations");
  try {
    run("npm run db:migrate", { cwd: BACKEND_DIR });
    ok("Migrations applied");
  } catch (err) {
    fail("Migration failed");
    dim(err.message);
  }

  console.log(`
  Update complete! Restart with:  trackam stop && trackam start
`);
};
