import { useState } from "react";
import { Download, ArrowRight, Loader2, CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { publicWaybillApi } from "@/services/handover";
import { PublicNav } from "@/components/layout/PublicNav";

type Phase = "form" | "submitting" | "done";

interface WaybillResult {
  id: string;
  waybillNumber: string;
  claimToken: string | null;
}

const BLANK_FORM = {
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
};

export default function WaybillGeneratorPage() {
  const [phase, setPhase]   = useState<Phase>("form");
  const [result, setResult] = useState<WaybillResult | null>(null);
  const [error, setError]   = useState("");
  const [form, setForm]     = useState(BLANK_FORM);

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
        declaredValueNgn:  form.declaredValueNgn  ? parseFloat(form.declaredValueNgn)  : undefined,
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

  function handleReset() {
    setPhase("form");
    setResult(null);
    setError("");
    setForm(BLANK_FORM);
  }

  const inputCls = "w-full rounded-md border border-input bg-white px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const labelCls = "text-xs font-medium text-foreground block mb-1.5";

  return (
    <div className="min-h-screen bg-stone-50">
      <PublicNav />

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

        {/* Done */}
        {phase === "done" && result ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-green-200 bg-white p-5 text-center space-y-2">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-base font-semibold text-foreground">Waybill created</p>
              <p className="text-sm text-muted-foreground font-mono">{result.waybillNumber}</p>
            </div>

            {result.claimToken && (
              <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-5 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide">Operator Claim Code</p>
                  <p className="text-[11px] text-orange-600 mt-0.5">Give this to the courier or logistics operator at pickup.</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-bold font-mono tracking-widest text-orange-900 flex-1">{result.claimToken}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(result!.claimToken!)}
                    className="rounded-md border border-orange-300 bg-white px-3 h-9 text-xs font-medium text-orange-700 hover:bg-orange-100 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </button>
                </div>
                <p className="text-[11px] text-orange-600">
                  Single-use · The operator enters this code with the waybill number to register the shipment.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <a
                href={publicWaybillApi.pdfUrl(result.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-stone-900 text-white h-10 text-sm font-medium hover:bg-stone-800 transition-colors"
              >
                <Download className="h-4 w-4" /> Download PDF
              </a>
              <a
                href={`/track/${result.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white text-foreground h-10 text-sm font-medium hover:bg-stone-50 transition-colors"
              >
                <ExternalLink className="h-4 w-4" /> View tracking page
              </a>
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Generate another
              </button>
            </div>
            <p className="text-[11px] text-center text-muted-foreground">
              The PDF QR code links to the tracking page. Anyone can scan it to see every custody event.
            </p>
          </div>
        ) : (
          /* Form */
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
                  <input required {...field("senderPhone")} placeholder="+234 800 000 0000" inputMode="tel" className={inputCls} />
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

            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}

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
              By generating a waybill you agree to the OLI open data terms.{" "}
              <a href="https://github.com/open-logistics-ng" target="_blank" rel="noopener noreferrer" className="underline">Learn more</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
