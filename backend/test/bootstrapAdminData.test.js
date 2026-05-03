const crypto = require("crypto");

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
}));

const bcrypt = require("bcrypt");
const { seedBootstrapAdmin } = require("../scripts/bootstrapAdminData");

describe("bootstrap admin seed", () => {
  let pool;

  beforeEach(() => {
    pool = {
      query: jest.fn(),
    };
    bcrypt.hash.mockReset();
    bcrypt.hash.mockResolvedValue("hashed-password");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("creates a new admin when the email is missing from users", async () => {
    jest.spyOn(crypto, "randomUUID").mockReturnValue("new-admin-id");
    pool.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({});

    const result = await seedBootstrapAdmin(pool, {
      email: "Admin@Example.com ",
      password: "secret-password",
      displayName: "Platform Admin",
      now: 1234,
    });

    expect(result).toEqual({
      id: "new-admin-id",
      email: "admin@example.com",
      displayName: "Platform Admin",
      roles: ["admin"],
      created: true,
    });
    expect(pool.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("FROM users"),
      ["admin@example.com"]
    );
    expect(pool.query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining("INSERT INTO users"),
      [
        "new-admin-id",
        "admin@example.com",
        "Platform Admin",
        ["admin"],
        true,
        1234,
        1234,
        "hashed-password",
      ]
    );
  });

  test("updates an existing user and preserves non-admin roles", async () => {
    pool.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{ id: "existing-user", roles: ["user", "driver"] }],
      })
      .mockResolvedValueOnce({});

    const result = await seedBootstrapAdmin(pool, {
      email: "ops@example.com",
      password: "secret-password",
      displayName: "Ops Admin",
      now: 5678,
    });

    expect(result).toEqual({
      id: "existing-user",
      email: "ops@example.com",
      displayName: "Ops Admin",
      roles: ["user", "driver", "admin"],
      created: false,
    });
    expect(pool.query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining("UPDATE users"),
      [
        "existing-user",
        "Ops Admin",
        ["user", "driver", "admin"],
        true,
        5678,
        "hashed-password",
      ]
    );
  });
});
