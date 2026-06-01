/**
 * Long-lived phone-scoped token for the rider / staff "find my custody" flow.
 *
 * Stored in localStorage so a refresh (or returning to the page within the
 * 7-day TTL) lands the user straight on the session picker instead of having
 * to re-enter phone + OTP every time.
 *
 * The token is signed by OLI Switch and self-validates server-side. We don't
 * try to introspect it on the client — we just store, read, and clear it.
 */

const KEY = "trackam:custodian:phoneToken";

export function savePhoneToken(token: string): void {
  try { localStorage.setItem(KEY, token); } catch { /* private mode */ }
}

export function getPhoneToken(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function clearPhoneToken(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
