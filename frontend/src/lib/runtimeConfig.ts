export const MISSING_API_BASE_URL_MESSAGE =
  "Frontend API base URL is not configured. Set VITE_API_URL for this deployment.";

type RuntimeConfig = {
  VITE_API_URL?: string;
};

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeConfig;
  }
}

function normalizeApiBaseUrl(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return undefined;
  }

  return trimmedValue.replace(/\/+$/, "");
}

export function getRuntimeConfig(): RuntimeConfig {
  if (typeof window === "undefined") {
    return {};
  }

  return window.__APP_CONFIG__ ?? {};
}

export function getApiBaseUrl(): string | undefined {
  return (
    normalizeApiBaseUrl(getRuntimeConfig().VITE_API_URL) ??
    normalizeApiBaseUrl(import.meta.env.VITE_API_URL)
  );
}

export function assertApiBaseUrl(apiBaseUrl = getApiBaseUrl()): string {
  if (!apiBaseUrl) {
    throw new Error(MISSING_API_BASE_URL_MESSAGE);
  }

  return apiBaseUrl;
}
