const { Pool } = require("pg");
const { seedDemoAccounts, USER_UID } = require("./demoSeedData");
const dotenv = require("dotenv");
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required to run the local seed script.");
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function run() {
  const now = Date.now();

  try {
    await seedDemoAccounts(pool, { now });

    await pool.query(
      `INSERT INTO settings (id, support_email, allowed_regions)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      ["global", "support@example.com", ["NG"]]
    );

    await pool.query(
      `INSERT INTO notifications (id, to_uid, title, body, created_at, read)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      ["notif_1", USER_UID, "Welcome", "Welcome to the shared fabric", now, false]
    );

    await pool.query(
      `INSERT INTO events (id, type, payload, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      ["evt_1", "user.created", { uid: USER_UID }, now]
    );

    await pool.query(
      `INSERT INTO devices (id, uid, device_id, last_seen, is_current)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      ["device_1", USER_UID, "device-abc-1", now, true]
    );

    await pool.query(
      `INSERT INTO sessions (id, uid, ip, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      ["session_1", USER_UID, "127.0.0.1", "seed", now]
    );

    console.log("Local database seed complete.");
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
