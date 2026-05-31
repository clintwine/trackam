/**
 * PhoneInput — phone field with a country prefix chip (flag + dial code).
 *
 * The country is fixed to the operator's configured country from
 * logistics_settings (set during install). The operator changes it from
 * the Settings page; phone fields across the dashboard read from there.
 *
 * The value emitted via onChange is the full E.164 string when the local
 * number is valid (e.g. "+2348012345678"), or "" when empty. Pass the
 * stored E.164 (or "") as value; the component strips the dial code for
 * display.
 */

import { getCountryPhoneConfig } from "@/lib/idSchemes";
import { useOperatorCountry } from "@/hooks/useOperatorCountry";

interface Props {
  value: string;                       // E.164 (e.g. "+2348012345678") or ""
  onChange: (e164: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Optional country override (e.g. for public scan pages). Defaults to operator country. */
  country?: string;
  className?: string;
}

/** Strip the dial code from an E.164 value to get the local subscriber digits. */
function stripDialCode(value: string, dialCode: string): string {
  if (!value) return "";
  if (value.startsWith(dialCode)) return value.slice(dialCode.length);
  // Fallback: just strip leading "+" and non-digits if format doesn't match
  return value.replace(/^\+/, "").replace(/[^\d]/g, "");
}

/** Strip leading trunk prefix (e.g. NG local format "080…" → "80…"). */
function stripTrunk(local: string, trunkPrefix: string): string {
  if (trunkPrefix && local.startsWith(trunkPrefix)) return local.slice(trunkPrefix.length);
  return local;
}

export function PhoneInput({
  value, onChange, placeholder, required, disabled, country, className,
}: Props) {
  const operatorCountry = useOperatorCountry();
  const cfg = getCountryPhoneConfig(country ?? operatorCountry);
  const local = stripDialCode(value, cfg.dialCode);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Keep only digits; strip trunk prefix so user can paste local format like "0801…"
    const digits = stripTrunk(e.target.value.replace(/[^\d]/g, ""), cfg.trunkPrefix);
    onChange(digits ? `${cfg.dialCode}${digits}` : "");
  }

  return (
    <div
      className={[
        "flex items-stretch rounded-lg border border-white/[0.08] bg-white/[0.04] overflow-hidden",
        "focus-within:border-orange-500/40 transition-colors",
        disabled ? "opacity-60" : "",
        className ?? "",
      ].join(" ")}
    >
      <div
        className="flex items-center gap-1.5 px-2.5 bg-white/[0.04] border-r border-white/[0.06] shrink-0"
        title={cfg.name}
      >
        <span className="text-base leading-none" aria-hidden>{cfg.flag}</span>
        <span className="text-xs font-medium text-stone-300">{cfg.dialCode}</span>
      </div>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={local}
        onChange={handleChange}
        placeholder={placeholder ?? "8012345678"}
        required={required}
        disabled={disabled}
        className="flex-1 min-w-0 bg-transparent px-3 h-9 text-xs text-white placeholder:text-stone-600 focus:outline-none"
      />
    </div>
  );
}
