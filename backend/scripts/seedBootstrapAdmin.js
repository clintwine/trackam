const { Pool } = require("pg");
const dotenv = require("dotenv");
const { seedBootstrapAdmin } = require("./bootstrapAdminData");

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "DATABASE_URL is required to run the bootstrap admin seed script."
  );
  process.exit(1);
}

const bootstrapAdminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
const bootstrapAdminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const bootstrapAdminDisplayName = process.env.BOOTSTRAP_ADMIN_DISPLAY_NAME;

if (!bootstrapAdminEmail || !bootstrapAdminPassword) {
  console.error(
    "BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required to seed the bootstrap admin."
  );
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function run() {
  try {
    const result = await seedBootstrapAdmin(pool, {
      email: bootstrapAdminEmail,
      password: bootstrapAdminPassword,
      displayName: bootstrapAdminDisplayName,
    });

    console.log(
      `Bootstrap admin seed complete (${result.created ? "created" : "updated"}).`
    );
    console.log(`Bootstrap admin: ${result.email}`);
  } catch (err) {
    console.error("Bootstrap admin seed failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
