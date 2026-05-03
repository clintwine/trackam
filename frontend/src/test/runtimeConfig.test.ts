import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertApiBaseUrl,
  getApiBaseUrl,
  MISSING_API_BASE_URL_MESSAGE,
} from "@/lib/runtimeConfig";

describe("runtimeConfig", () => {
  afterEach(() => {
    delete window.__APP_CONFIG__;
    vi.unstubAllEnvs();
  });

  it("prefers runtime config over build-time VITE_API_URL", () => {
    vi.stubEnv("VITE_API_URL", "https://build.example.com/");
    window.__APP_CONFIG__ = {
      VITE_API_URL: "https://runtime.example.com/",
    };

    expect(getApiBaseUrl()).toBe("https://runtime.example.com");
  });

  it("falls back to build-time VITE_API_URL when runtime config is absent", () => {
    vi.stubEnv("VITE_API_URL", "https://build.example.com/");

    expect(getApiBaseUrl()).toBe("https://build.example.com");
  });

  it("throws a clear error when no API base URL is configured", () => {
    vi.stubEnv("VITE_API_URL", "");

    expect(() => assertApiBaseUrl()).toThrow(
      MISSING_API_BASE_URL_MESSAGE
    );
  });
});
