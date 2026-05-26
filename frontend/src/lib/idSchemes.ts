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
