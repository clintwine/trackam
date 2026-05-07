import { useState } from "react";
import { Package, Download, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { publicWaybillApi } from "@/services/handover";

type Phase = "form" | "submitting" | "done";

interface WaybillResult {
  id: string;
  waybillNumber: string;
}

export default function WaybillGeneratorPage() {
  const [phase, setPhase] = useState<Phase>("form");
  const [result, setResult] = useState<WaybillResult | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    senderName: "",
    senderPhone: "",
    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",
    goodsDescription: "",
    pickupLocation: "",
    deliveryLocation: "",
    estimatedWeightKg: "",
    declaredValueNgn: "",
  });

  function field(name: keyof typeof form) {
    return {
      value: form[name],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((prev) => ({ ...prev, [name]: e.target.value })),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPhase("submitting");
    setError("");
    try {
      const payload = {
        ...form,
        estimatedWeightKg: form.estimatedWeightKg ? parseFloat(form.estimatedWeightKg) : undefined,
        declaredValueNgn: form.declaredValueNgn ? parseFloat(form.declaredValueNgn) : undefined,
      };
      const waybill = await publicWaybillApi.create(payload);
      setResult(waybill);
      setPhase("done");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to generate waybill.";
      setError(msg);
      setPhase("form");
    }
  }

  const inputCls = "w-full rounded-md border border-input bg-white px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const labelCls = "text-xs font-medium text-foreground block mb-1.5";

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-stone-900 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-orange-500 flex items-center justify-center">
            <Package className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">Trackam</span>
        </div>
        <a href="/auth/login" className="text-xs text-stone-400 hover:text-white transition-colors">
          Sign in →
        </a>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="mb-7">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 border border-orange-200 px-3 py-1 text-[11px] font-medium text-orange-700 mb-3">
            Open Logistics Interconnect (OLI)
          </div>
          <h1 className="text-2xl font-bold text-stone-900 leading-tight">
            Generate a free digital waybill
          </h1>
          <p className="text-sm text-stone-500 mt-2">
            Creates a QR-coded waybill compatible with any OLI-enabled logistics app. No account needed.
          </p>
        </div>

        {phase === "done" && result ? (
          <div className="rounded-xl border border-green-200 bg-white p-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Waybill created</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{result.waybillNumber}</p>
            </div>
            <div className="flex flex-col gap-2.5">
              <a
                href={publicWaybillApi.pdfUrl(result.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-stone-900 text-white h-10 text-sm font-medium hover:bg-stone-800 transition-colors"
              >
                <Download className="h-4 w-4" /> Download PDF
              </a>
              <button
                onClick={() => { setPhase("form"); setResult(null); setForm({ senderName: "", senderPhone: "", receiverName: "", receiverPhone: "", receiverAddress: "", goodsDescription: "", pickupLocation: "", deliveryLocation: "", estimatedWeightKg: "", declaredValueNgn: "" }); }}
                className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Generate another
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
              The QR code on the PDF links to a live tracking page. When scanned by a Trackam user, it initiates a digital handover.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Sender */}
            <div className="rounded-lg border border-border bg-white p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sender</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Full name <span className="text-red-500">*</span></label>
                  <input required {...field("senderName")} placeholder="Adaeze Nwosu" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone <span className="text-red-500">*</span></label>
                  <input required {...field("senderPhone")} placeholder="+234 800..." inputMode="tel" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Pickup location <span className="text-red-500">*</span></label>
                <input required {...field("pickupLocation")} placeholder="e.g. Alaba Market, Lagos" className={inputCls} />
              </div>
            </div>

            {/* Receiver */}
            <div className="rounded-lg border border-border bg-white p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Receiver</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Full name <span className="text-red-500">*</span></label>
                  <input required {...field("receiverName")} placeholder="Emeka Dike" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone <span className="text-red-500">*</span></label>
                  <input required {...field("receiverPhone")} placeholder="+234 800..." inputMode="tel" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Delivery address <span className="text-red-500">*</span></label>
                <input required {...field("receiverAddress")} placeholder="12 Wuse Zone 5, Abuja" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Delivery location <span className="text-red-500">*</span></label>
                <input required {...field("deliveryLocation")} placeholder="e.g. Wuse, Abuja" className={inputCls} />
              </div>
            </div>

            {/* Cargo */}
            <div className="rounded-lg border border-border bg-white p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cargo</p>
              <div>
                <label className={labelCls}>Goods description <span className="text-red-500">*</span></label>
                <input required {...field("goodsDescription")} placeholder="e.g. 10 cartons of electronics" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Est. weight (kg)</label>
                  <input {...field("estimatedWeightKg")} placeholder="e.g. 15" inputMode="decimal" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Declared value (₦)</label>
                  <input {...field("declaredValueNgn")} placeholder="e.g. 150000" inputMode="decimal" className={inputCls} />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={phase === "submitting"}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-orange-600 text-white h-11 text-sm font-semibold transition-colors hover:bg-orange-700 disabled:opacity-60"
            >
              {phase === "submitting"
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                : <><ArrowRight className="h-4 w-4" /> Generate waybill</>}
            </button>

            <p className="text-[11px] text-center text-muted-foreground">
              By generating a waybill you agree to the OLI open data terms.
              <a href="https://github.com/open-logistics-ng" target="_blank" rel="noopener noreferrer" className="ml-1 underline">Learn more</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
