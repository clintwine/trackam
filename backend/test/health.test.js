jest.mock("../src/core/db/postgres", () => ({
  query: jest.fn(),
}));

const request = require("supertest");
const app = require("../src");
const { query } = require("../src/core/db/postgres");

describe("Backend health endpoints", () => {
  beforeEach(() => {
    query.mockReset();
  });

  test("GET /health returns ok status", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  test("GET /ready runs SELECT 1 and returns ready", async () => {
    query.mockResolvedValue({ rows: [{ "?column?": 1 }] });
    const response = await request(app).get("/ready");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ready" });
    expect(query).toHaveBeenCalledWith("SELECT 1");
  });

  test("GET /ready returns 500 when query fails", async () => {
    query.mockRejectedValue(new Error("boom"));
    const response = await request(app).get("/ready");
    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({ message: "boom" });
    expect(query).toHaveBeenCalledWith("SELECT 1");
  });
});
