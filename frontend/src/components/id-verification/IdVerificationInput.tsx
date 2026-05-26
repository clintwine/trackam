import { type IdSchemeConfig } from "@/lib/idSchemes";

interface Props {
  config: IdSchemeConfig;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

export function IdVerificationInput({ config, value, onChange, required, className }: Props) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (config.inputMode === "numeric") {
      onChange(raw.replace(/\D/g, "").slice(0, config.maxLength));
    } else {
      onChange(raw.slice(0, config.maxLength));
    }
  }

  return (
    <div>
      <label className="text-xs font-medium text-foreground block mb-1.5">
        {config.label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        required={required}
        value={value}
        onChange={handleChange}
        placeholder={config.placeholder}
        inputMode={config.inputMode}
        pattern={config.pattern}
        maxLength={config.maxLength}
        className={
          className ??
          "w-full rounded-md border border-input bg-white px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        }
      />
      <p className="text-[10px] text-muted-foreground mt-1">{config.hint}</p>
    </div>
  );
}
