import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/apiClient";
import { authClient } from "@/services/authClient";

vi.mock("@/lib/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe("authClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails closed when /api/auth/me does not return an auth payload", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: "<!doctype html>",
    } as never);

    await expect(authClient.getCurrentUser()).resolves.toEqual({
      authenticated: false,
      user: null,
      profile: null,
      isAdmin: false,
    });
  });

  it("hydrates the current user when /api/auth/me returns scaffold auth JSON", async () => {
    const user = { id: "user-1", email: "admin@example.com" };

    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        uid: "user-1",
        user,
        isAdmin: true,
      },
    } as never);

    await expect(authClient.getCurrentUser()).resolves.toEqual({
      authenticated: true,
      user,
      profile: user,
      isAdmin: true,
    });
  });
});
