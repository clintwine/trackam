import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PackagePlus, X, Loader2, FileText, CheckCircle2, ArrowRight, Link2, AlertCircle } from "lucide-react";
import { waybillApi } from "@/services/handover";

interface Props {
  onDone?: () => void;
}

type Tab = "claim" | "join";

export function QuickShipment({ onDone }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("claim");

  // Claim state
  const [claimNumber, setClaimNumber] = useState("");
  const [claimToken, setClaimToken] = useState("");
  const [claimWorking, setClaimWorking] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [claimedShipmentId, setClaimedShipmentId] = useState<string | null>(null);
  const [claimedWaybillNumber, setClaimedWaybillNumber] = useState("");

  // Join state
  const [joinWaybillNumber, setJoinWaybillNumber] = useState("");
  const [joinProofHash, setJoinProofHash] = useState("");
  const [joinWorking, setJoinWorking] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinedShipmentId, setJoinedShipmentId] = useState<string | null>(null);

  function openModal(defaultTab: Tab = "claim") {
    setTab(defaultTab);
    setClaimNumber(""); setClaimToken(""); setClaimError(""); setClaimedShipmentId(null); setClaimedWaybillNumber("");
    setJoinWaybillNumber(""); setJoinProofHash(""); setJoinError(""); setJoinedShipmentId(null);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    onDone?.();
  }

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    setClaimError("");
    setClaimWorking(true);
    try {
      const result = await waybillApi.claim({
        waybillNumber: claimNumber.trim().toUpperCase(),
        claimToken: claimToken.trim().toUpperCase(),
      });
      setClaimedShipmentId(result.shipmentId);
      setClaimedWaybillNumber(claimNumber.trim().toUpperCase());
      onDone?.();
    } catch (e: unknown) {
      setClaimError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Claim failed. Check the waybill number and code."
      );
    } finally {
      setClaimWorking(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoinError("");
    setJoinWorking(true);
    try {
      const waybill = await waybillApi.lookupId(joinWaybillNumber.trim().toUpperCase());
      const result = await waybillApi.joinLeg(waybill.id, joinProofHash.trim());
      setJoinedShipmentId(result.shipmentId);
      onDone?.();
    } catch (e: unknown) {
      setJoinError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not join leg. Check the waybill number and proof hash."
      );
    } finally {
      setJoinWorking(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 h-9 text-sm text-white placeholder:text-stone-600 focus:outline-none focus:border-orange-500/40 transition-colors";

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => openModal("claim")}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-orange-500 to-orange-600 px-4 h-11 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] transition-all"
      >
        <PackagePlus className="h-4 w-4" />
        Quick Shipment
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-md rounded-xl bg-[#0c1522] shadow-2xl shadow-black/40 border border-white/[0.08] overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[70vh]">

            {/* Tab header */}
            <div className="border-b border-white/[0.06]">
              <div className="flex items-center justify-between px-4 pt-3 pb-0">
                <div className="flex gap-1">
                  <button
                    onClick={() => setTab("claim")}
                    className={["flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                      tab === "claim" ? "border-orange-500 text-orange-400" : "border-transparent text-stone-500 hover:text-stone-300"].join(" ")}
                  >
                    <FileText className="h-3.5 w-3.5" /> Claim Waybill
                  </button>
                  <button
                    onClick={() => setTab("join")}
                    className={["flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                      tab === "join" ? "border-orange-500 text-orange-400" : "border-transparent text-stone-500 hover:text-stone-300"].join(" ")}
                  >
                    <Link2 className="h-3.5 w-3.5" /> Join Leg
                  </button>
                </div>
                <button onClick={close} className="text-stone-600 hover:text-stone-300 mb-2 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ── Claim Waybill ─────────────────────────────────────── */}
            {tab === "claim" && (
              <>
                <div className="p-5 overflow-y-auto">
                  {claimedShipmentId ? (
                    <div className="py-6 flex flex-col items-center text-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-emerald-500/[0.15] flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Waybill claimed</p>
                        <p className="text-xs text-stone-500 mt-1">
                          <span className="font-mono text-stone-400">{claimedWaybillNumber}</span> is on your dashboard. Assign it to a run when you're ready to dispatch.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 w-full">
                        <button
                          onClick={() => { close(); navigate(`/dashboard/shipments/${claimedShipmentId}`); }}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-orange-500 to-orange-600 text-white px-4 h-9 text-xs font-semibold shadow-sm shadow-orange-500/20 hover:shadow-orange-500/30 transition-all"
                        >
                          Open shipment <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => { setClaimedShipmentId(null); setClaimNumber(""); setClaimToken(""); setClaimError(""); }}
                          className="text-xs text-stone-500 underline underline-offset-2 hover:text-stone-300 transition-colors"
                        >
                          Claim another
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form id="claim-form" onSubmit={handleClaim} className="space-y-4">
                      <p className="text-xs text-stone-500">
                        Enter the waybill number and the 8-character claim code from the physical stub. A shipment will be created on your dashboard automatically.
                      </p>
                      <div>
                        <label className="block text-xs font-medium text-stone-300 mb-1.5">Waybill number</label>
                        <input
                          required
                          value={claimNumber}
                          onChange={(e) => setClaimNumber(e.target.value.toUpperCase())}
                          placeholder="WB-20260508-XXXXXX"
                          className={`${inputCls} font-mono`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-300 mb-1.5">Claim code</label>
                        <input
                          required
                          value={claimToken}
                          onChange={(e) => setClaimToken(e.target.value.toUpperCase())}
                          placeholder="e.g. A3F9B2C1"
                          maxLength={8}
                          className={`${inputCls} font-mono tracking-widest`}
                        />
                        <p className="text-[10px] text-stone-600 mt-1">Printed on the tear-off stub at the bottom of the waybill PDF.</p>
                      </div>
                      {claimError && (
                        <p className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/[0.1] border border-red-500/20 rounded-lg px-3 py-2">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />{claimError}
                        </p>
                      )}
                    </form>
                  )}
                </div>
                {!claimedShipmentId && (
                  <div className="px-5 py-3 border-t border-white/[0.06] shrink-0">
                    <button
                      type="submit"
                      form="claim-form"
                      disabled={claimWorking || !claimNumber || !claimToken}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-orange-500 to-orange-600 h-9 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 hover:shadow-orange-500/30 disabled:opacity-60 transition-all"
                    >
                      {claimWorking ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Claiming...</> : "Claim waybill →"}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── Join Leg ──────────────────────────────────────────── */}
            {tab === "join" && (
              <>
                <div className="p-5 overflow-y-auto">
                  {joinedShipmentId ? (
                    <div className="py-6 flex flex-col items-center text-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-emerald-500/[0.15] flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Leg joined</p>
                        <p className="text-xs text-stone-500 mt-1">
                          Your shipment for this leg is ready. Initiate the first handover from the shipment page.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 w-full">
                        <button
                          onClick={() => { close(); navigate(`/dashboard/shipments/${joinedShipmentId}`); }}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-orange-500 to-orange-600 text-white px-4 h-9 text-xs font-semibold shadow-sm shadow-orange-500/20 hover:shadow-orange-500/30 transition-all"
                        >
                          Open shipment <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => { setJoinedShipmentId(null); setJoinWaybillNumber(""); setJoinProofHash(""); setJoinError(""); }}
                          className="text-xs text-stone-500 underline underline-offset-2 hover:text-stone-300 transition-colors"
                        >
                          Join another
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form id="join-form" onSubmit={handleJoin} className="space-y-4">
                      <p className="text-xs text-stone-500">
                        You received goods from another operator. Enter the waybill number and the proof hash shown when the sender confirmed handover to you.
                      </p>
                      <div>
                        <label className="block text-xs font-medium text-stone-300 mb-1.5">Waybill number</label>
                        <input
                          required
                          value={joinWaybillNumber}
                          onChange={(e) => setJoinWaybillNumber(e.target.value.toUpperCase())}
                          placeholder="WB-20260508-XXXXXX"
                          className={`${inputCls} font-mono`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-300 mb-1.5">Proof of Handover hash</label>
                        <input
                          required
                          value={joinProofHash}
                          onChange={(e) => setJoinProofHash(e.target.value.trim())}
                          placeholder="64-character hex hash"
                          className={`${inputCls} font-mono text-xs`}
                        />
                        <p className="text-[10px] text-stone-600 mt-1">
                          Shown on the scan page after the driver confirmed receipt.
                        </p>
                      </div>
                      {joinError && (
                        <p className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/[0.1] border border-red-500/20 rounded-lg px-3 py-2">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />{joinError}
                        </p>
                      )}
                    </form>
                  )}
                </div>
                {!joinedShipmentId && (
                  <div className="px-5 py-3 border-t border-white/[0.06] shrink-0">
                    <button
                      type="submit"
                      form="join-form"
                      disabled={joinWorking || !joinWaybillNumber || !joinProofHash}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-orange-500 to-orange-600 h-9 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 hover:shadow-orange-500/30 disabled:opacity-60 transition-all"
                    >
                      {joinWorking ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Joining...</> : "Join leg →"}
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
}
