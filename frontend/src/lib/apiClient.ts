import axios from "axios";
import { clearAuthToken, getAuthToken } from "@/lib/authToken";
import { assertApiBaseUrl, getApiBaseUrl } from "@/lib/runtimeConfig";

export const apiClient = axios.create({
  // Allow cookies (for Firebase session cookie set by backend)
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const apiBaseUrl = config.baseURL ?? getApiBaseUrl();
  config.baseURL = assertApiBaseUrl(apiBaseUrl);

  const token = getAuthToken();

  // Keep sending Authorization header if a token
  // is available, but the backend now prefers the
  // long-lived session cookie when present.
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Only treat 401s from our OWN auth endpoints as session failures.
// Proxied endpoints (OLI Switch: /api/wallet, /api/waybill, etc.) may
// return 401 for their own reasons (missing API key, etc.) — those
// should NOT nuke the user's valid session.
const AUTH_ENDPOINTS = ["/api/auth/"];

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const url = error.config?.url || "";
      const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => url.includes(ep));

      if (isAuthEndpoint) {
        clearAuthToken();
        if (typeof window !== "undefined") {
          const path = window.location.pathname;
          const PUBLIC_PREFIXES = ["/auth", "/scan", "/waybill", "/track", "/handover"];
          const isPublicRoute = path === "/" || PUBLIC_PREFIXES.some((p) => path.startsWith(p));
          if (!isPublicRoute) {
            window.location.href = "/auth/login";
          }
        }
      }
    }
    return Promise.reject(error);
  }
);
