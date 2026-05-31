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

import { useState } from "react";
import { getCountryPhoneConfig } from "@/lib/idSchemes";
import { useOperatorCountry } from "@/hooks/useOperatorCountry";

interface Props {
  value: string;                       // E.164 (e.g. "+2348012345678") or ""
  onChange: (e164: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Optional country override (e.g. for public scan pages). Defaults to operator country. */
  country?: string;
  /** "sm" matches dashboard inputs (h-9, text-xs). "md" matches public pages (h-10, text-sm). */
  size?: "sm" | "md";
  className?: string;
}

/**
 * CountryFlag — renders the country flag via flagcdn.com SVG. Falls back to
 * the OS emoji glyph if the image fails to load (offline, blocked, etc.).
 * We use SVG because Windows does not include color glyphs for country flag
 * codepoints, so emoji-only renders as plain "NG" / "GH" text on most desktops.
 */
function CountryFlag({ code, name, fallback, size }: {
  code: string; name: string; fallback: string; size: "sm" | "md";
}) {
  const [errored, setErrored] = useState(false);
  const cls = size === "md" ? "h-3.5 w-5" : "h-3 w-[18px]";

  if (errored) {
    return (
      <span className={size === "md" ? "text-lg leading-none" : "text-base leading-none"} aria-label={name}>
        {fallback}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt={name}
      width={size === "md" ? 20 : 18}
      height={size === "md" ? 14 : 12}
      onError={() => setErrored(true)}
      className={`${cls} object-cover rounded-[2px] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]`}
    />
  );
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
  value, onChange, placeholder, required, disabled, autoFocus,
  country, size = "sm", className,
}: Props) {
  const operatorCountry = useOperatorCountry();
  const cfg = getCountryPhoneConfig(country ?? operatorCountry);
  const local = stripDialCode(value, cfg.dialCode);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Keep only digits; strip trunk prefix so user can paste local format like "0801…"
    const digits = stripTrunk(e.target.value.replace(/[^\d]/g, ""), cfg.trunkPrefix);
    onChange(digits ? `${cfg.dialCode}${digits}` : "");
  }

  const isMd = size === "md";

  return (
    <div
      className={[
        "flex items-stretch rounded-lg border border-white/[0.08] overflow-hidden",
        isMd ? "bg-white/[0.06] focus-within:ring-2 focus-within:ring-orange-500/40"
             : "bg-white/[0.04] focus-within:border-orange-500/40",
        "transition-colors",
        disabled ? "opacity-60" : "",
        className ?? "",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center gap-2 border-r border-white/[0.06] shrink-0",
          isMd ? "px-3 bg-white/[0.04]" : "px-2.5 bg-white/[0.04]",
        ].join(" ")}
        title={cfg.name}
      >
        <CountryFlag code={cfg.code} name={cfg.name} fallback={cfg.flag} size={isMd ? "md" : "sm"} />
        <span className={isMd ? "text-sm font-medium text-stone-200" : "text-xs font-medium text-stone-300"}>
          {cfg.dialCode}
        </span>
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
        autoFocus={autoFocus}
        className={[
          "flex-1 min-w-0 bg-transparent focus:outline-none placeholder:text-stone-600 text-white",
          isMd ? "px-3 h-10 text-sm" : "px-3 h-9 text-xs",
        ].join(" ")}
      />
    </div>
  );
}
