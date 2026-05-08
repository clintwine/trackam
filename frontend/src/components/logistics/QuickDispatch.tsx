import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, X, ChevronRight, Loader2, FileText, CheckCircle2, ArrowRight, Link2 } from "lucide-react";
import { routesApi, ridersApi, shipmentsApi, type Route, type Rider } from "@/services/logistics";
import { waybillApi } from "@/services/handover";

interface Props {
  onDispatched?: () => void;
}

type Step = "route" | "confirm";
type Tab = "dispatch" | "claim" | "join";

export function QuickDispatch({ onDispatched }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("dispatch");

  // Dispatch state
  const [step, setStep] = useState<Step>("route");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [riderId, setRiderId] = useState<string>("");
  const [riderFee, setRiderFee] = useState<string>("");
  const [shipmentValue, setShipmentValue] = useState<string>("");
  const [expectedDate, setExpectedDate] = useState<string>("tomorrow");
  const [notes, setNotes] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Claim waybill state
  const [claimWaybillNumber, setClaimWaybillNumber] = useState("");
  const [claimToken, setClaimToken] = useState("");
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [claimedShipmentId, setClaimedShipmentId] = useState<string | null>(null);

  // Join leg state
  const [joinWaybillNumber, setJoinWaybillNumber] = useState("");
  const [joinProofHash, setJoinProofHash] = useState("");
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinedShipmentId, setJoinedShipmentId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      Promise.all([routesApi.list(), ridersApi.list()]).then(([r, ri]) => {
        setRoutes(r);
        setRiders(ri);
      });
    }
  }, [open]);

  function openModal() {
    setTab("dispatch");
    setStep("route");
    setSelectedRoute(null);
    setRiderId("");
    setRiderFee("");
    setShipmentValue("");
    setExpectedDate("tomorrow");
    setNotes("");
    setRecipientName("");
    setRecipientPhone("");
    setError("");
    setClaimWaybillNumber("");
    setClaimToken("");
    setClaimError("");
    setClaimedShipmentId(null);
    setJoinWaybillNumber("");
    setJoinProofHash("");
    setJoinError("");
    setJoinedShipmentId(null);
    setOpen(true);
  }

  async function handleClaimWaybill() {
    if (!claimWaybillNumber || !claimToken) return;
    setClaimSubmitting(true);
    setClaimError("");
    try {
      const result = await waybillApi.claim({
        waybillNumber: claimWaybillNumber.trim().toUpperCase(),
        claimToken: claimToken.trim().toUpperCase(),
      });
      setClaimedShipmentId(result.shipmentId);
      onDispatched?.();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Claim failed. Check the waybill number and code.";
      setClaimError(msg);
    } finally {
      setClaimSubmitting(false);
    }
  }

  async function handleJoinLeg() {
    if (!joinWaybillNumber || !joinProofHash) return;
    setJoinSubmitting(true);
    setJoinError("");
    try {
      // Resolve waybill number → ID first
      const waybill = await waybillApi.lookupId(joinWaybillNumber.trim().toUpperCase());
      const result = await waybillApi.joinLeg(waybill.id, joinProofHash.trim());
      setJoinedShipmentId(result.shipmentId);
      onDispatched?.();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Could not join leg. Check the waybill number and proof hash.";
      setJoinError(msg);
    } finally {
      setJoinSubmitting(false);
    }
  }

  function selectRoute(route: Route) {
    setSelectedRoute(route);
    setRiderId(route.defaultRiderId || "");
    setRiderFee(route.defaultRiderFee ? String(route.defaultRiderFee / 100) : "");
    setStep("confirm");
  }

  function resolvedDate(): string | undefined {
    if (expectedDate === "today") return new Date().toISOString().split("T")[0];
    if (expectedDate === "tomorrow") {
      const d = new Date(); d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0];
    }
    if (expectedDate === "in2days") {
      const d = new Date(); d.setDate(d.getDate() + 2);
      return d.toISOString().split("T")[0];
    }
    return undefined;
  }

  async function handleDispatch() {
    if (!selectedRoute) return;
    setSubmitting(true);
    setError("");
    try {
      await shipmentsApi.create({
        routeId: selectedRoute.id,
        riderId: riderId || undefined,
        goodsDescription: selectedRoute.defaultGoodsDescription || "Goods",
        pickupLocation: selectedRoute.pickupLocation,
        deliveryLocation: selectedRoute.deliveryLocation,
        distanceKm: selectedRoute.distanceKm,
        riderFee: riderFee ? parseFloat(riderFee) : 0,
        shipmentValue: shipmentValue ? parseFloat(shipmentValue) : 0,
        expectedDeliveryDate: resolvedDate(),
        notes: notes || undefined,
        recipientName: recipientName || undefined,
        recipientPhone: recipientPhone || undefined,
      } as Parameters<typeof shipmentsApi.create>[0]);
      setOpen(false);
      onDispatched?.();
    } catch {
      setError("Failed to dispatch. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* FAB trigger */}
      <button
        onClick={openModal}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-4 h-11 text-sm font-semibold text-white shadow-lg hover:bg-primary/90 transition-colors"
      >
        <Zap className="h-4 w-4" />
        Quick Dispatch
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl border border-border overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh]">
            {/* Header */}
            <div className="border-b border-border">
              <div className="flex items-center justify-between px-4 pt-3 pb-0">
                <div className="flex gap-1">
                  <button
                    onClick={() => setTab("dispatch")}
                    className={[
                      "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                      tab === "dispatch"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Quick Dispatch
                  </button>
                  <button
                    onClick={() => setTab("claim")}
                    className={[
                      "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                      tab === "claim"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Claim Waybill
                  </button>
                  <button
                    onClick={() => setTab("join")}
                    className={[
                      "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                      tab === "join"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Join Leg
                  </button>
                </div>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground mb-2">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Claim Waybill tab */}
            {tab === "claim" && (
              <div className="p-4 overflow-y-auto">
                {claimedShipmentId ? (
                  <div className="py-8 flex flex-col items-center text-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Waybill claimed</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {claimWaybillNumber} is now on your dashboard. A shipment was created for this leg — initiate the first handover to assign a driver.
                      </p>
                    </div>
                    <button
                      onClick={() => { setOpen(false); navigate(`/dashboard/shipments/${claimedShipmentId}`); }}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary text-white px-4 h-9 text-xs font-semibold hover:bg-primary/90"
                    >
                      Open shipment <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { setClaimedShipmentId(null); setClaimWaybillNumber(""); setClaimToken(""); setClaimError(""); }}
                      className="text-xs text-muted-foreground underline underline-offset-2"
                    >
                      Claim another
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Enter the waybill number and the 8-character claim code from the physical waybill stub. Claiming creates a shipment on your dashboard automatically.
                    </p>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">Waybill number</label>
                      <input
                        value={claimWaybillNumber}
                        onChange={(e) => setClaimWaybillNumber(e.target.value.toUpperCase())}
                        placeholder="WB-20250507-XXXXXX"
                        className="w-full rounded-md border border-input bg-white px-3 h-9 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">Claim code</label>
                      <input
                        value={claimToken}
                        onChange={(e) => setClaimToken(e.target.value.toUpperCase())}
                        placeholder="e.g. A3F9B2C1"
                        maxLength={8}
                        className="w-full rounded-md border border-input bg-white px-3 h-9 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring tracking-widest"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">Printed on the tear-off stub at the bottom of the waybill PDF.</p>
                    </div>

                    {claimError && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                        {claimError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === "claim" && !claimedShipmentId && (
              <div className="flex gap-2 px-4 py-3 border-t border-border bg-white shrink-0">
                <button
                  onClick={handleClaimWaybill}
                  disabled={claimSubmitting || !claimWaybillNumber || !claimToken}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary h-9 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {claimSubmitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Claiming…</> : "Claim waybill →"}
                </button>
              </div>
            )}

            {/* Join Leg tab — Operator B enters waybill number + PoH hash they received */}
            {tab === "join" && (
              <div className="p-4 overflow-y-auto">
                {joinedShipmentId ? (
                  <div className="py-8 flex flex-col items-center text-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Leg joined</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your shipment for this leg is ready. Initiate the next handover from the shipment page.
                      </p>
                    </div>
                    <button
                      onClick={() => { setOpen(false); navigate(`/dashboard/shipments/${joinedShipmentId}`); }}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary text-white px-4 h-9 text-xs font-semibold hover:bg-primary/90"
                    >
                      Open shipment <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { setJoinedShipmentId(null); setJoinWaybillNumber(""); setJoinProofHash(""); setJoinError(""); }}
                      className="text-xs text-muted-foreground underline underline-offset-2"
                    >
                      Join another
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      You received goods from another operator. Enter the waybill number and the proof hash (PoH) shown when the sender confirmed the handover to you.
                    </p>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">Waybill number</label>
                      <input
                        value={joinWaybillNumber}
                        onChange={(e) => setJoinWaybillNumber(e.target.value.toUpperCase())}
                        placeholder="WB-20250507-XXXXXX"
                        className="w-full rounded-md border border-input bg-white px-3 h-9 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">Proof of handover hash</label>
                      <input
                        value={joinProofHash}
                        onChange={(e) => setJoinProofHash(e.target.value.trim())}
                        placeholder="64-character hash from the handover confirmation"
                        className="w-full rounded-md border border-input bg-white px-3 h-9 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Shown on the scan page after the driver confirmed receipt. Also visible on the public tracking page.
                      </p>
                    </div>

                    {joinError && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                        {joinError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === "join" && !joinedShipmentId && (
              <div className="flex gap-2 px-4 py-3 border-t border-border bg-white shrink-0">
                <button
                  onClick={handleJoinLeg}
                  disabled={joinSubmitting || !joinWaybillNumber || !joinProofHash}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary h-9 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {joinSubmitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Joining…</> : "Join leg →"}
                </button>
              </div>
            )}

            {/* Step 1: Route picker */}
            {tab === "dispatch" && step === "route" && (
              <div className="p-4 overflow-y-auto">
                {routes.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">No saved routes yet.</p>
                    <a href="/dashboard/routes" className="mt-1 text-xs text-primary hover:underline">
                      Set up your first route →
                    </a>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {routes.map((route) => (
                      <button
                        key={route.id}
                        onClick={() => selectRoute(route)}
                        className="w-full flex items-center justify-between rounded-lg border border-border bg-white p-3 text-left hover:border-primary/40 hover:bg-accent/30 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{route.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {route.pickupLocation} → {route.deliveryLocation} · {route.distanceKm} km
                          </p>
                          {route.defaultRiderName && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Default: {route.defaultRiderName}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Confirm */}
            {tab === "dispatch" && step === "confirm" && selectedRoute && (
              <div className="p-4 space-y-4 overflow-y-auto">
                <div className="rounded-lg bg-secondary p-3">
                  <p className="text-xs font-semibold text-foreground">{selectedRoute.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {selectedRoute.pickupLocation} → {selectedRoute.deliveryLocation} · {selectedRoute.distanceKm} km
                  </p>
                </div>

                {/* Rider select */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Rider</label>
                  <select
                    value={riderId}
                    onChange={(e) => setRiderId(e.target.value)}
                    className="w-full rounded-md border border-input bg-white px-3 h-9 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">No rider assigned</option>
                    {riders.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.vehicleType})
                        {r.ghostRate != null && r.ghostRate > 10 ? ` ⚠ ${r.ghostRate}% ghost` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rider fee + shipment value */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Rider fee (₦)</label>
                    <input
                      type="number"
                      value={riderFee}
                      onChange={(e) => setRiderFee(e.target.value)}
                      placeholder="e.g. 45000"
                      className="w-full rounded-md border border-input bg-white px-3 h-9 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Goods value (₦)</label>
                    <input
                      type="number"
                      value={shipmentValue}
                      onChange={(e) => setShipmentValue(e.target.value)}
                      placeholder="e.g. 500000"
                      className="w-full rounded-md border border-input bg-white px-3 h-9 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                {/* Expected delivery */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Expected delivery</label>
                  <div className="flex gap-2">
                    {["today", "tomorrow", "in2days"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setExpectedDate(opt)}
                        className={[
                          "flex-1 rounded-md border text-xs h-8 font-medium transition-colors",
                          expectedDate === opt
                            ? "border-primary bg-accent text-primary"
                            : "border-border bg-white text-muted-foreground hover:border-primary/40",
                        ].join(" ")}
                      >
                        {opt === "today" ? "Today" : opt === "tomorrow" ? "Tomorrow" : "In 2 days"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recipient */}
                <div className="rounded-md bg-secondary/60 border border-border p-3 space-y-2.5">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    Recipient — helps verify delivery
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="e.g. Alhaji Bello"
                        className="w-full rounded-md border border-input bg-white px-3 h-9 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Phone</label>
                      <input
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="08012345678"
                        className="w-full rounded-md border border-input bg-white px-3 h-9 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  {recipientPhone && (
                    <p className="text-[11px] text-green-700">✓ Risk score will be reduced — recipient can confirm delivery</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Notes (optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any extra context…"
                    className="w-full rounded-md border border-input bg-white px-3 h-9 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}
              </div>
            )}

            {/* Sticky action row for confirm step */}
            {tab === "dispatch" && step === "confirm" && selectedRoute && (
              <div className="flex gap-2 px-4 py-3 border-t border-border bg-white shrink-0">
                <button
                  onClick={() => setStep("route")}
                  className="flex-none rounded-md border border-border bg-white px-3 h-9 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleDispatch}
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary h-9 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Dispatching…</> : "Dispatch →"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
