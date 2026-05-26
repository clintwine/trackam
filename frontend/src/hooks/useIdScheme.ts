import { useEffect, useState } from "react";
import { logisticsSettingsApi } from "@/services/logistics";
import { getIdSchemeConfig, type IdSchemeConfig } from "@/lib/idSchemes";

export function useIdScheme(): IdSchemeConfig {
  const [country, setCountry] = useState("ng");

  useEffect(() => {
    logisticsSettingsApi.get()
      .then((s) => { if (s.country) setCountry(s.country); })
      .catch(() => {});
  }, []);

  return getIdSchemeConfig(country);
}
