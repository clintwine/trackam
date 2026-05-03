const bcrypt = require("bcrypt");

const ADMIN_UID = "uid_local_admin";
const USER_UID = "uid_local_user";
const DEMO_PASSWORD = "password123";
const DEMO_ACCOUNTS = [
  {
    label: "Admin",
    id: ADMIN_UID,
    email: "admin@example.com",
    displayName: "Ada Lovelace",
    roles: ["admin"],
  },
  {
    label: "User",
    id: USER_UID,
    email: "user@example.com",
    displayName: "Eve User",
    roles: ["user"],
  },
];

async function ensureScaffoldRoles(pool) {
  await pool.query(
    `INSERT INTO roles (id, description, permissions)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO NOTHING`,
    ["admin", "Full admin privileges", ["*"]]
  );
  await pool.query(
    `INSERT INTO roles (id, description, permissions)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO NOTHING`,
    ["user", "Standard user", ["read:self", "write:self"]]
  );
}

async function seedDemoAccounts(pool, options = {}) {
  const now = options.now || Date.now();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  await ensureScaffoldRoles(pool);

  for (const account of DEMO_ACCOUNTS) {
    await pool.query(
      `INSERT INTO users (id, email, display_name, roles, email_verified, created_at, updated_at, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         display_name = EXCLUDED.display_name,
         roles = EXCLUDED.roles,
         email_verified = EXCLUDED.email_verified,
         updated_at = EXCLUDED.updated_at,
         password_hash = EXCLUDED.password_hash`,
      [
        account.id,
        account.email,
        account.displayName,
        account.roles,
        true,
        now,
        now,
        passwordHash,
      ]
    );
  }

  return {
    now,
    accounts: DEMO_ACCOUNTS,
    password: DEMO_PASSWORD,
  };
}

module.exports = {
  ADMIN_UID,
  USER_UID,
  DEMO_PASSWORD,
  DEMO_ACCOUNTS,
  ensureScaffoldRoles,
  seedDemoAccounts,
};
