import { useState } from "react";
import { Download, ArrowRight, Loader2, CheckCircle2, Copy, ExternalLink, Phone, ShieldCheck } from "lucide-react";
import { publicWaybillApi } from "@/services/handover";
import { PublicNav } from "@/components/layout/PublicNav";

type Phase = "verify-phone" | "verify-otp" | "form" | "submitting" | "done";

interface WaybillResult {
  id: string;
  waybillNumber: string;
  claimToken: string | null;
}

export default function WaybillGeneratorPage() {
  const [phase, setPhase] = useState<Phase>("verify-phone");
  const [result, setResult] = useState<WaybillResult | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Phone OTP state
  const [senderPhone, setSenderPhone] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState("");

  const [form, setForm] = useState({
    senderName: "",
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

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await publicWaybillApi.requestSenderOtp(senderPhone);
      setVerificationId(res.verificationId);
      setPhase("verify-otp");
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await publicWaybillApi.verifySenderOtp(verificationId, otp);
      setVerificationToken(res.verificationToken);
      setPhase("form");
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Invalid OTP.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPhase("submitting");
    setError("");
    try {
      const payload = {
        ...form,
        senderPhone,
        verificationToken,
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

        {/* Step indicator */}
        {phase !== "done" && (() => {
          const steps: { key: Phase; label: string }[] = [
            { key: "verify-phone", label: "Phone" },
            { key: "verify-otp",   label: "Verify" },
            { key: "form",         label: "Details" },
          ];
          const order: Phase[] = ["verify-phone", "verify-otp", "form", "submitting"];
          const currentIdx = order.indexOf(phase);
          return (
            <div className="flex items-center gap-2 mb-6">
              {steps.map(({ key, label }, i) => {
                const stepIdx = order.indexOf(key);
                const isActive = stepIdx === currentIdx || (key === "form" && phase === "submitting");
                const isDone   = stepIdx < currentIdx;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className={[
                      "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                      isActive ? "bg-orange-600 text-white"
                        : isDone ? "bg-green-500 text-white"
                        : "bg-stone-200 text-stone-500",
                    ].join(" ")}>
                      {isDone ? "✓" : i + 1}
                    </div>
                    <span className="text-[11px] text-muted-foreground hidden sm:block">{label}</span>
                    {i < steps.length - 1 && <div className="h-px w-6 bg-border" />}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Phase: enter phone */}
        {phase === "verify-phone" && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="rounded-lg border border-border bg-white p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Verify your phone number</p>
                  <p className="text-xs text-muted-foreground">We'll send a 6-digit code to confirm your identity as sender</p>
                </div>
              </div>
              <div>
                <label className={labelCls}>Sender phone <span className="text-red-500">*</span></label>
                <input
                  required
                  type="tel"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  inputMode="tel"
                  className={inputCls}
                />
              </div>
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-orange-600 text-white h-11 text-sm font-semibold transition-colors hover:bg-orange-700 disabled:opacity-60"
            >
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><ArrowRight className="h-4 w-4" /> Send verification code</>}
            </button>
          </form>
        )}

        {/* Phase: enter OTP */}
        {phase === "verify-otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="rounded-lg border border-border bg-white p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Enter verification code</p>
                  <p className="text-xs text-muted-foreground">
                    Code sent to <span className="font-medium text-foreground">{senderPhone}</span>
                  </p>
                </div>
              </div>
              <div>
                <label className={labelCls}>6-digit code <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  className={`${inputCls} tracking-widest text-center text-lg font-bold`}
                />
              </div>
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-orange-600 text-white h-11 text-sm font-semibold transition-colors hover:bg-orange-700 disabled:opacity-60"
            >
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</> : <><ShieldCheck className="h-4 w-4" /> Verify & continue</>}
            </button>
            <button
              type="button"
              onClick={() => { setPhase("verify-phone"); setOtp(""); setError(""); }}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Use a different number
            </button>
          </form>
        )}

        {/* Phase: done */}
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
                onClick={() => {
                  setPhase("verify-phone");
                  setResult(null);
                  setSenderPhone("");
                  setVerificationId("");
                  setOtp("");
                  setVerificationToken("");
                  setForm({ senderName: "", receiverName: "", receiverPhone: "", receiverAddress: "", goodsDescription: "", pickupLocation: "", deliveryLocation: "", estimatedWeightKg: "", declaredValueNgn: "" });
                }}
                className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Generate another
              </button>
            </div>
            <p className="text-[11px] text-center text-muted-foreground">
              The PDF QR code links to the tracking page. Anyone can scan it to see every custody event.
            </p>
          </div>
        ) : null}

        {/* Phase: form */}
        {(phase === "form" || phase === "submitting") && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Sender */}
            <div className="rounded-lg border border-border bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sender</p>
                <span className="inline-flex items-center gap-1 text-[11px] text-green-700 font-medium">
                  <ShieldCheck className="h-3 w-3" /> {senderPhone} verified
                </span>
              </div>
              <div>
                <label className={labelCls}>Full name <span className="text-red-500">*</span></label>
                <input required {...field("senderName")} placeholder="Adaeze Nwosu" className={inputCls} />
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
              By generating a waybill you agree to the OLI open data terms.
              <a href="https://github.com/open-logistics-ng" target="_blank" rel="noopener noreferrer" className="ml-1 underline">Learn more</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
