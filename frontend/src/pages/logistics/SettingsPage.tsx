import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { logisticsSettingsApi, type LogisticsSettings } from "@/services/logistics";

const FIELDS: { key: keyof LogisticsSettings; label: string; description: string; suffix?: string; type?: string }[] = [
  { key: "business_name", label: "Business name", description: "Your trading or company name.", type: "text" },
  { key: "business_city", label: "Business city", description: "Your primary base of operations.", type: "text" },
  { key: "fuel_price_per_litre", label: "Fuel price", description: "Current petrol cost in ₦ per litre.", suffix: "₦/L", type: "number" },
  { key: "fuel_efficiency_multiplier", label: "Fuel efficiency", description: "Litres consumed per km (default: 0.12).", suffix: "L/km", type: "number" },
  { key: "ghost_threshold_hours", label: "Ghost threshold", description: "Hours without a status update before a shipment is flagged as ghosting risk.", suffix: "hours", type: "number" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<LogisticsSettings | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    logisticsSettingsApi.get().then((s) => {
      setSettings(s);
      setForm(s as unknown as Record<string, string>);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await logisticsSettingsApi.update(form as unknown as Partial<LogisticsSettings>);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return <div className="animate-pulse h-64 max-w-lg rounded-lg bg-stone-100" />;
  }

  return (
    <div className="max-w-lg">
      <form onSubmit={handleSave} className="rounded-lg border border-border bg-white p-6 shadow-xs space-y-5">
        {FIELDS.map(({ key, label, description, suffix, type = "text" }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-foreground mb-0.5">{label}</label>
            <p className="text-[11px] text-muted-foreground mb-1.5">{description}</p>
            <div className="flex items-center gap-2">
              <input
                type={type}
                value={form[key] ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                step={key === "fuel_efficiency_multiplier" ? "0.01" : undefined}
                className="flex-1 rounded-md border border-input bg-white px-3 h-9 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {suffix && <span className="text-xs text-muted-foreground shrink-0">{suffix}</span>}
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 h-9 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : "Save settings"}
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved
            </span>
          )}
        </div>
      </form>

      <div className="mt-4 rounded-lg border border-border bg-secondary/30 px-4 py-3">
        <p className="text-[11px] text-muted-foreground">
          <strong className="text-foreground">Fuel formula:</strong> fuel_cost = distance_km × fuel_efficiency × fuel_price_per_litre
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          At ₦{form.fuel_price_per_litre}/L × {form.fuel_efficiency_multiplier} L/km: a 100km trip costs ₦{(parseFloat(form.fuel_price_per_litre || "0") * parseFloat(form.fuel_efficiency_multiplier || "0") * 100).toLocaleString("en-NG")} in fuel.
        </p>
      </div>
    </div>
  );
}
