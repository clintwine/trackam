export type IdScheme =
  | "ng:bvn"
  | "gh:ghana-card"
  | "ke:national-id"
  | "za:said"
  | "rw:national-id";

export interface IdSchemeConfig {
  scheme: IdScheme;
  label: string;
  placeholder: string;
  hint: string;
  inputMode: "numeric" | "text";
  maxLength: number;
  pattern?: string;
}

export const ID_SCHEME_CONFIGS: Record<string, IdSchemeConfig> = {
  ng: {
    scheme: "ng:bvn",
    label: "BVN",
    placeholder: "11-digit BVN",
    hint: "Bank Verification Number — used for identity verification. Not shared publicly.",
    inputMode: "numeric",
    maxLength: 11,
    pattern: "\\d{11}",
  },
  gh: {
    scheme: "gh:ghana-card",
    label: "Ghana Card Number",
    placeholder: "GHA-XXXXXXXXX-X",
    hint: "Ghana National Identification Card number — used for identity verification.",
    inputMode: "text",
    maxLength: 15,
    pattern: "GHA-\\d{9}-\\d",
  },
  ke: {
    scheme: "ke:national-id",
    label: "National ID Number",
    placeholder: "7 or 8-digit National ID",
    hint: "Kenya National Identity Card number — used for identity verification.",
    inputMode: "numeric",
    maxLength: 8,
    pattern: "\\d{7,8}",
  },
  za: {
    scheme: "za:said",
    label: "SA ID Number",
    placeholder: "13-digit SA ID number",
    hint: "South African Identity Document number — used for identity verification.",
    inputMode: "numeric",
    maxLength: 13,
    pattern: "\\d{13}",
  },
  rw: {
    scheme: "rw:national-id",
    label: "National ID Number",
    placeholder: "16-digit National ID",
    hint: "Rwanda National Identity Card number — used for identity verification.",
    inputMode: "numeric",
    maxLength: 16,
    pattern: "\\d{16}",
  },
};

export const COUNTRY_OPTIONS = [
  { value: "ng", label: "Nigeria" },
  { value: "gh", label: "Ghana" },
  { value: "ke", label: "Kenya" },
  { value: "za", label: "South Africa" },
  { value: "rw", label: "Rwanda" },
] as const;

export function getIdSchemeConfig(country: string): IdSchemeConfig {
  return ID_SCHEME_CONFIGS[country] ?? ID_SCHEME_CONFIGS["ng"];
}

// ── Phone country codes ─────────────────────────────────────────────────────

export interface CountryPhoneConfig {
  code:        string; // ISO alpha-2 (lowercase)
  name:        string;
  flag:        string; // emoji
  dialCode:    string; // e.g. "+234"
  /** Length of the national subscriber number, excluding leading 0 if any. */
  nationalLength: number;
  /** Some countries use a leading "0" trunk prefix in local format (e.g. NG). */
  trunkPrefix: string;
}

export const COUNTRY_PHONE_CONFIGS: Record<string, CountryPhoneConfig> = {
  ng: { code: "ng", name: "Nigeria",      flag: "🇳🇬", dialCode: "+234", nationalLength: 10, trunkPrefix: "0" },
  gh: { code: "gh", name: "Ghana",        flag: "🇬🇭", dialCode: "+233", nationalLength: 9,  trunkPrefix: "0" },
  ke: { code: "ke", name: "Kenya",        flag: "🇰🇪", dialCode: "+254", nationalLength: 9,  trunkPrefix: "0" },
  za: { code: "za", name: "South Africa", flag: "🇿🇦", dialCode: "+27",  nationalLength: 9,  trunkPrefix: "0" },
  rw: { code: "rw", name: "Rwanda",       flag: "🇷🇼", dialCode: "+250", nationalLength: 9,  trunkPrefix: "0" },
};

export function getCountryPhoneConfig(country: string): CountryPhoneConfig {
  return COUNTRY_PHONE_CONFIGS[country] ?? COUNTRY_PHONE_CONFIGS["ng"];
}
