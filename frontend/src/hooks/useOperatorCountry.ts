import { useEffect, useState } from "react";
import { logisticsSettingsApi } from "@/services/logistics";

// Module-level cache so multiple PhoneInputs across the dashboard share a single fetch.
let _cached: string | null = null;
let _inflight: Promise<string> | null = null;

function loadCountry(): Promise<string> {
  if (_cached) return Promise.resolve(_cached);
  if (_inflight) return _inflight;
  _inflight = logisticsSettingsApi.get()
    .then((s) => {
      _cached = s.country || "ng";
      return _cached;
    })
    .catch(() => "ng")
    .finally(() => { _inflight = null; });
  return _inflight;
}

/**
 * Returns the operator's ISO alpha-2 country code (lowercase, e.g. "ng")
 * derived from logistics_settings. Defaults to "ng" while loading or on error.
 */
export function useOperatorCountry(): string {
  const [country, setCountry] = useState<string>(_cached ?? "ng");

  useEffect(() => {
    if (_cached) {
      if (_cached !== country) setCountry(_cached);
      return;
    }
    let active = true;
    loadCountry().then((c) => { if (active) setCountry(c); });
    return () => { active = false; };
  }, []);

  return country;
}
