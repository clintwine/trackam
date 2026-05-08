import { ArrowRight, ShieldCheck, Link2, FileText } from "lucide-react";
import { PublicNav } from "@/components/layout/PublicNav";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <PublicNav />

      {/* Hero */}
      <section className="px-5 py-16 max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 border border-orange-200 px-3 py-1 text-[11px] font-medium text-orange-700 mb-5">
          Open Logistics Interconnect (OLI) — Phase 1
        </div>
        <h1 className="text-4xl font-extrabold text-stone-900 leading-tight tracking-tight">
          Track every handoff.<br />
          <span className="text-orange-500">Never lose a shipment again.</span>
        </h1>
        <p className="text-stone-500 mt-4 text-base max-w-lg mx-auto">
          Trackam is a logistics management tool for Nigerian businesses. Every package gets a digital receipt at each custody transfer — from sender to rider to warehouse to receiver.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <a href="/auth/signup" className="inline-flex items-center justify-center gap-2 rounded-lg bg-stone-900 text-white px-5 h-11 text-sm font-semibold hover:bg-stone-800 transition-colors">
            Get started free <ArrowRight className="h-4 w-4" />
          </a>
          <a href="/waybill" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-5 h-11 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors">
            <FileText className="h-4 w-4" /> Generate a waybill
          </a>
        </div>
      </section>

      {/* Feature cards */}
      <section className="px-5 pb-16 max-w-3xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-white p-5">
            <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
              <ShieldCheck className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-sm font-semibold text-stone-900">Proof of Handover</p>
            <p className="text-xs text-stone-500 mt-1">
              SHA-256 hash generated at every custody transfer. Immutable receipt for every party in the chain.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-white p-5">
            <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center mb-3">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-sm font-semibold text-stone-900">Free Digital Waybill</p>
            <p className="text-xs text-stone-500 mt-1">
              Generate QR-coded waybills in seconds. No account needed. Compatible with any OLI-enabled app.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-white p-5">
            <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
              <Link2 className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-sm font-semibold text-stone-900">Open Standard</p>
            <p className="text-xs text-stone-500 mt-1">
              Built on GS1 EPCIS. Every shipment has a machine-readable URL. Any OLI-compatible system can plug in.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-6 text-center">
        <p className="text-[11px] text-stone-400">
          Powered by Open Logistics Interconnect (OLI) ·{" "}
          <a href="https://github.com/Jeffreyon/trackam" target="_blank" rel="noopener noreferrer" className="underline">GitHub</a>
        </p>
      </footer>
    </div>
  );
}
