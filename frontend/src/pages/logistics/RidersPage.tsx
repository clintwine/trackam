import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, X, Loader2 } from "lucide-react";
import { ridersApi, type Rider, type VehicleType } from "@/services/logistics";
import { formatNaira } from "@/lib/format";

const VEHICLE_LABELS: Record<VehicleType, string> = {
  bike: "Bike", tricycle: "Tricycle", van: "Van", truck: "Truck",
};

export default function RidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  function load() {
    ridersApi.list().then(setRiders).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{riders.length} active rider{riders.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 h-8 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add rider
        </button>
      </div>

      <div className="rounded-lg border border-border bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Loading…</div>
        ) : riders.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-8 w-8 text-stone-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No riders yet.</p>
            <button onClick={() => setShowForm(true)} className="mt-2 text-xs text-primary hover:underline">
              Add your first rider →
            </button>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Rider</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">Vehicle</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">Coverage</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Ghost rate</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground hidden md:table-cell">Base fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {riders.map((r) => (
                <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/dashboard/riders/${r.id}`} className="font-medium text-foreground hover:text-primary">
                      {r.name}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">{r.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{VEHICLE_LABELS[r.vehicleType]}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{r.cityCoverage}</td>
                  <td className="px-4 py-3">
                    <GhostRateBadge rate={r.ghostRate} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium hidden md:table-cell">
                    {r.baseFee ? formatNaira(r.baseFee) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && <AddRiderModal onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function GhostRateBadge({ rate }: { rate: number | null }) {
  if (rate === null || rate === undefined) return <span className="text-muted-foreground">—</span>;
  const cls = rate > 20 ? "text-red-600 font-semibold" : rate > 10 ? "text-orange-600" : "text-green-600";
  return <span className={`text-xs ${cls}`}>{rate}%</span>;
}

function AddRiderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", vehicleType: "bike" as VehicleType, cityCoverage: "", baseFee: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await ridersApi.create({ ...form, baseFee: form.baseFee ? parseInt(form.baseFee, 10) * 100 : 0 });
      onCreated();
    } catch {
      setError("Failed to add rider. Check the details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-md rounded-xl bg-white shadow-2xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold">Add rider</p>
          <button type="button" onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>

        {[
          { label: "Full name", key: "name" as const, placeholder: "e.g. Ibrahim Musa", type: "text" },
          { label: "Phone", key: "phone" as const, placeholder: "e.g. 08012345678", type: "tel" },
          { label: "City coverage", key: "cityCoverage" as const, placeholder: "e.g. Lagos, Onitsha", type: "text" },
          { label: "Base fee (₦)", key: "baseFee" as const, placeholder: "e.g. 45000", type: "number" },
        ].map(({ label, key, placeholder, type }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-foreground mb-1">{label}</label>
            <input
              type={type}
              value={form[key]}
              onChange={set(key)}
              placeholder={placeholder}
              className="w-full rounded-md border border-input bg-white px-3 h-9 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        ))}

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Vehicle type</label>
          <select value={form.vehicleType} onChange={set("vehicleType")} className="w-full rounded-md border border-input bg-white px-3 h-9 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="bike">Bike</option>
            <option value="tricycle">Tricycle (Keke)</option>
            <option value="van">Van</option>
            <option value="truck">Truck</option>
          </select>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary h-9 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding…</> : "Add rider"}
        </button>
      </form>
    </div>
  );
}
