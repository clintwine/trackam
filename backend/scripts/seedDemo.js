const { Pool } = require("pg");
const dotenv = require("dotenv");
const { seedDemoAccounts } = require("./demoSeedData");

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required to run the staging demo seed script.");
  process.exit(1);
}

if (process.env.DEMO_SEED_ALLOWED !== "true") {
  console.error(
    "Refusing to seed demo accounts without DEMO_SEED_ALLOWED=true. This guard prevents accidental remote demo seeding."
  );
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function run() {
  try {
    const result = await seedDemoAccounts(pool);
    console.log("Demo account seed complete.");
    console.log("Demo accounts:");
    for (const account of result.accounts) {
      console.log(`- ${account.label}: ${account.email} / ${result.password}`);
    }
  } catch (err) {
    console.error("Seeding demo accounts failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
