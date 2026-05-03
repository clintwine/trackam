const express = require("express");
const request = require("supertest");

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const localAuthMiddleware = require("../src/core/middlewares/localAuth");

describe("localAuthMiddleware", () => {
  let app;

  beforeEach(() => {
    jwt.verify.mockReset();
    app = express();
    app.get("/secure", localAuthMiddleware, (req, res) => {
      res.json({ uid: req.user.uid });
    });
  });

  test("returns 401 when no token provided", async () => {
    const response = await request(app).get("/secure");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "No token provided" });
  });

  test("authenticates when bearer token is provided", async () => {
    jwt.verify.mockReturnValue({
      sub: "uid-123",
      email: "user@example.com",
      roles: ["user"],
      email_verified: true,
    });
    const response = await request(app)
      .get("/secure")
      .set("Authorization", "Bearer valid-token");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ uid: "uid-123" });
    expect(jwt.verify).toHaveBeenCalledWith("valid-token", "test-secret");
  });
});
