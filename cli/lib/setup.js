const fs = require("fs");
const path = require("path");
const { TRACKAM_DIR, BACKEND_DIR, FRONTEND_DIR, ENV_FILE, isInstalled } = require("./paths");
const { step, ok, warn, fail, dim, commandExists, run, prompt, generateSecret, isWin } = require("./helpers");

const REPO_URL = "https://github.com/Jeffreyon/trackam.git";

module.exports = async function setup() {
  console.log("\n  Trackam — Logistics Platform Setup\n");

  // ── 1. Check prerequisites ────────────────────────────────────────────

  step("Checking prerequisites");

  // Node
  if (!commandExists("node")) {
    fail("Node.js is not installed.");
    console.log(`\n  Install Node.js 18+: https://nodejs.org\n`);
    process.exit(1);
  }
  const nodeVersion = run("node -v", { silent: true });
  const nodeMajor = parseInt(nodeVersion.replace("v", ""), 10);
  if (nodeMajor < 18) {
    fail(`Node.js ${nodeVersion} is too old — Trackam requires v18+.`);
    process.exit(1);
  }
  ok(`Node.js ${nodeVersion}`);

  // npm
  if (!commandExists("npm")) {
    fail("npm is not installed (should come with Node.js).");
    process.exit(1);
  }
  ok(`npm ${run("npm -v", { silent: true })}`);

  // Git
  if (!commandExists("git")) {
    fail("Git is not installed.");
    if (isWin) {
      console.log(`\n  Install Git: https://git-scm.com/download/win\n`);
    } else {
      console.log(`\n  Install Git: sudo apt install git  (or brew install git)\n`);
    }
    process.exit(1);
  }
  ok(`Git ${run("git --version", { silent: true }).replace("git version ", "")}`);

  // PostgreSQL
  const hasPsql = commandExists("psql");
  if (!hasPsql) {
    warn("PostgreSQL (psql) not found on PATH.");
    dim("You'll need a running PostgreSQL instance. If it's remote, that's fine.");
    dim("Install locally: https://www.postgresql.org/download/");
  } else {
    ok("PostgreSQL client found");
  }

  // ── 2. Clone or update repo ───────────────────────────────────────────

  step("Setting up Trackam");

  if (isInstalled()) {
    warn(`Trackam already installed at ${TRACKAM_DIR}`);
    const action = await prompt("Overwrite and re-setup? (y/N)", "n");
    if (action.toLowerCase() !== "y") {
      console.log("\n  Aborted. Run 'trackam start' to start the existing install.\n");
      process.exit(0);
    }
  }

  if (fs.existsSync(TRACKAM_DIR) && fs.existsSync(path.join(TRACKAM_DIR, ".git"))) {
    dim("Pulling latest from GitHub...");
    run("git pull --ff-only", { cwd: TRACKAM_DIR, ignoreError: true });
    ok("Updated existing clone");
  } else {
    dim(`Cloning into ${TRACKAM_DIR}...`);
    run(`git clone ${REPO_URL} "${TRACKAM_DIR}"`);
    ok("Repository cloned");
  }

  // ── 3. Install dependencies ───────────────────────────────────────────

  step("Installing dependencies");

  dim("Backend...");
  run("npm install", { cwd: BACKEND_DIR });
  ok("Backend dependencies installed");

  dim("Frontend...");
  run("npm install", { cwd: FRONTEND_DIR });
  ok("Frontend dependencies installed");

  // ── 4. Configure environment ──────────────────────────────────────────

  step("Configuring environment");

  if (fs.existsSync(ENV_FILE)) {
    const overwrite = await prompt("A .env file already exists. Overwrite? (y/N)", "n");
    if (overwrite.toLowerCase() !== "y") {
      ok("Keeping existing .env");
      await runMigrations();
      finish();
      return;
    }
  }

  console.log();
  dim("We'll ask a few questions to configure your instance.");
  dim("Press Enter to accept the default values shown in parentheses.\n");

  const dbUrl = await prompt("PostgreSQL connection URL", "postgres://postgres@127.0.0.1:5432/trackam");
  const port = await prompt("Backend port", "4429");
  const frontendPort = await prompt("Frontend port", "3429");
  const adminEmail = await prompt("Admin email", "admin@yourcompany.com");
  const adminPassword = await prompt("Admin password", generateSecret(12).slice(0, 16));

  const jwtSecret = generateSecret(32);
  const frontendUrl = `http://127.0.0.1:${frontendPort}`;

  const envContent = `# Server
PORT=${port}
FRONTEND_URL=${frontendUrl}
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60

# PostgreSQL
DATABASE_URL=${dbUrl}

# Auth
JWT_SECRET=${jwtSecret}
JWT_EXPIRATION_SECONDS=3600

# Session cookies
SESSION_COOKIE_NAME=trackam_session
SESSION_COOKIE_MAX_AGE_DAYS=7
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_DOMAIN=

# Bootstrap admin
BOOTSTRAP_ADMIN_EMAIL=${adminEmail}
BOOTSTRAP_ADMIN_PASSWORD=${adminPassword}
BOOTSTRAP_ADMIN_DISPLAY_NAME=Admin

# Storage
STORAGE_DIRECTORY=storage
STORAGE_URL_PREFIX=http://127.0.0.1:${port}/storage

# OLI Switch (connects your operator account to the logistics network)
OLI_SWITCH_URL=https://oli-switch-production.up.railway.app
OLI_API_KEY=
OLI_OPERATOR_ID=
OLI_TRACKING_ENDPOINT=
`;

  fs.writeFileSync(ENV_FILE, envContent, "utf8");
  ok(".env written");

  // ── 5. Create database + run migrations ───────────────────────────────

  await createDatabase(dbUrl);
  await runMigrations();

  // ── 6. Seed admin ─────────────────────────────────────────────────────

  step("Creating admin account");
  try {
    run("npm run db:seed:bootstrap-admin", { cwd: BACKEND_DIR });
    ok(`Admin user: ${adminEmail}`);
  } catch {
    warn("Could not seed admin (may already exist)");
  }

  finish();
};

// ── Helpers ─────────────────────────────────────────────────────────────────

async function createDatabase(dbUrl) {
  step("Creating database");
  try {
    const url = new URL(dbUrl);
    const dbName = url.pathname.replace("/", "");
    // Strip the database from the URL to connect to the default 'postgres' db
    url.pathname = "/postgres";
    const baseUrl = url.toString();

    // Try createdb command first
    if (commandExists("createdb")) {
      run(`createdb -h ${url.hostname} -p ${url.port || 5432} -U ${url.username || "postgres"} ${dbName}`, { ignoreError: true, silent: true });
      ok(`Database "${dbName}" ready`);
    } else {
      // Fallback — try via psql
      dim("createdb not found, trying psql...");
      run(`psql "${baseUrl}" -c "CREATE DATABASE ${dbName}" 2>/dev/null || true`, { ignoreError: true, silent: true });
      ok(`Database "${dbName}" ready (may have already existed)`);
    }
  } catch {
    warn("Could not auto-create database. Make sure it exists before starting.");
    dim("Create it manually:  createdb trackam");
  }
}

async function runMigrations() {
  step("Running database migrations");
  try {
    run("npm run db:migrate", { cwd: BACKEND_DIR });
    ok("Migrations applied");
  } catch (err) {
    fail("Migration failed — check your DATABASE_URL and that PostgreSQL is running.");
    dim(err.message);
    dim("You can re-run migrations later: trackam update");
  }
}

function finish() {
  console.log(`
  ${"\x1b[32m\x1b[1m"}Setup complete!${"\x1b[0m"}

  Start Trackam:     trackam start
  Open in browser:   http://127.0.0.1:3429

  What happens next:
    1. Sign up on the web UI → your OLI Switch operator account is auto-created
    2. You'll be approved and receive an API key by email
    3. Paste the key in Settings → start dispatching

  ${"\x1b[2m"}Installed at: ~/trackam${"\x1b[0m"}
`);
}
