import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, Loader2, Handshake, Wifi, AlertTriangle,
  MapPin, ShieldCheck, Phone, Navigation, Route, User, FileText, Clock,
} from "lucide-react";
import { shipmentsApi, type Shipment, type StatusLogEntry, type ShipmentStatus } from "@/services/logistics";
import { apiClient } from "@/lib/apiClient";
import { handoverApi, publicWaybillApi, ACTOR_LABELS, type HandoverEvent, type ActorType } from "@/services/handover";
import { formatNaira, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/logistics/StatusBadge";
import HandoverQRModal from "@/components/logistics/HandoverQRModal";
import { getApiBaseUrl } from "@/lib/runtimeConfig";
import { getAuthToken } from "@/lib/authToken";
import { triggerWalletRefresh } from "@/components/layout/WalletWidget";

const HANDOVER_ELIGIBLE: ShipmentStatus[] = ["pending", "in_transit", "disputed"];

interface ChainEvent {
  id: string;
  giverName: string | null;
  giverActorType: ActorType;
  receiverName: string;
  receiverActorType: ActorType;
  proofHash: string;
  latitude: number | null;
  longitude: number | null;
  occurredAt: string;
}

// ── Operator role helper ──────────────────────────────────────────────────

type Role =
  | "current-custodian"   // shipment is here, in transit
  | "handed-off"           // we already passed it on
  | "delivered"            // run completed / handed over to receiver
  | "incoming"             // waiting for a handover into our custody
  | "disputed"
  | "ghosted"
  | "failed"
  | "unknown";

function deriveRole(s: ShipmentStatus): { role: Role; label: string; tone: string } {
  switch (s) {
    case "pending":
      return { role: "current-custodian", label: "You currently hold custody",
        tone: "border-blue-500/20 bg-blue-500/[0.08] text-blue-300" };
    case "in_transit":
      return { role: "current-custodian", label: "In transit — under your custody",
        tone: "border-blue-500/20 bg-blue-500/[0.08] text-blue-300" };
    case "handed_over":
      return { role: "handed-off", label: "Handed off to the next custodian",
        tone: "border-purple-500/20 bg-purple-500/[0.08] text-purple-300" };
    case "delivered":
      return { role: "delivered", label: "Delivered to the recipient",
        tone: "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300" };
    case "ghosted":
      return { role: "ghosted", label: "No status update in 48+ hours",
        tone: "border-red-500/20 bg-red-500/[0.08] text-red-300" };
    case "disputed":
      return { role: "disputed", label: "Custody disputed",
        tone: "border-red-500/20 bg-red-500/[0.08] text-red-300" };
    case "failed":
      return { role: "failed", label: "Marked as failed",
        tone: "border-red-500/20 bg-red-500/[0.08] text-red-300" };
    default:
      return { role: "unknown", label: "Status unclear",
        tone: "border-white/[0.06] bg-white/[0.03] text-stone-300" };
  }
}

// ──────────────────────────────────────────────────────────────────────────

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [log, setLog] = useState<StatusLogEntry[]>([]);
  const [handoverEvents, setHandoverEvents] = useState<HandoverEvent[]>([]);
  const [waybillChain, setWaybillChain] = useState<ChainEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const [reclaimReason, setReclaimReason] = useState("");
  const [showReclaimForm, setShowReclaimForm] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  async function load() {
    if (!id) return;

    let s;
    try {
      s = await shipmentsApi.get(id);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        try {
          await apiClient.post(`/api/waybill/recover/${id}`);
          s = await shipmentsApi.get(id);
        } catch {
          return;
        }
      } else {
        return;
      }
    }

    const [l, events] = await Promise.all([
      shipmentsApi.getLog(id).catch(() => []),
      handoverApi.getEvents(id).catch(() => []),
    ]);
    setShipment(s);
    setLog(l as StatusLogEntry[]);
    setHandoverEvents(events);

    if (s.waybillId) {
      publicWaybillApi.getChain(s.waybillId)
        .then(async (data: { chain: ChainEvent[] }) => {
          setWaybillChain(data.chain);
          const realHandovers = data.chain.filter(
            (e) => e.giverActorType !== "ACTOR_SENDER"
          );
          // Auto-sync to "handed_over" when the chain shows we've passed it on
          if (
            realHandovers.length > 0 &&
            ["pending", "in_transit", "disputed"].includes(s.status)
          ) {
            try {
              const updated = await shipmentsApi.updateStatus(
                s.id,
                "handed_over" as ShipmentStatus,
                "Auto-synced from OLI custody chain"
              );
              setShipment(updated);
              const freshLog = await shipmentsApi.getLog(s.id);
              setLog(freshLog as StatusLogEntry[]);
            } catch { /* ignore */ }
          }
        })
        .catch(() => {});
    }
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, [id]);

  useEffect(() => {
    if (!id) return;
    const base = getApiBaseUrl() ?? "";
    const token = getAuthToken();
    const qs = token ? `?token=${encodeURIComponent(token)}` : "";
    const es = new EventSource(`${base}/api/handover/stream/${id}${qs}`);
    esRef.current = es;

    es.addEventListener("open", () => setLiveConnected(true));
    es.addEventListener("error", () => setLiveConnected(false));
    es.addEventListener("message", () => {
      load().then(() => {
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 4000);
      });
      triggerWalletRefresh();
    });

    return () => { es.close(); setLiveConnected(false); };
  }, [id]);

  async function handleReclaim() {
    if (!id) return;
    setUpdating(true);
    try {
      const updated = await shipmentsApi.reclaim(id, reclaimReason || undefined);
      setShipment(updated);
      const l = await shipmentsApi.getLog(id);
      setLog(l);
      setReclaimReason("");
      setShowReclaimForm(false);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <div className="animate-pulse h-64 rounded-xl bg-white/[0.03] border border-white/[0.06]" />;
  if (!shipment) return <p className="text-sm text-stone-500">Shipment not found.</p>;

  const role = deriveRole(shipment.status as ShipmentStatus);
  const showChain = waybillChain.length > 0;
  const navUrl = shipment.deliveryLocation
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shipment.deliveryLocation)}`
    : null;

  // Prefer waybill-side recipient info when present (more authoritative)
  const recipientName  = shipment.waybill?.receiverName  || shipment.recipientName;
  const recipientPhone = shipment.waybill?.receiverPhone || shipment.recipientPhone;

  return (
    <div className="max-w-4xl space-y-5">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            {shipment.waybill?.number && (
              <p className="text-[11px] font-mono font-semibold text-orange-300 mb-1">{shipment.waybill.number}</p>
            )}
            <h2 className="text-base font-semibold text-white">{shipment.goodsDescription}</h2>
            <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{shipment.pickupLocation} → {shipment.deliveryLocation}</span>
            </p>
          </div>
          <div className="flex gap-2 items-center flex-wrap shrink-0">
            {liveConnected && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                <Wifi className="h-3 w-3" /> Live
              </span>
            )}
            <StatusBadge status={shipment.status as ShipmentStatus} />
          </div>
        </div>

        {/* Role banner */}
        <div className={`rounded-lg border px-3 py-2 text-xs font-medium ${role.tone}`}>
          {role.label}
        </div>

        {shipment.shipmentValue > 0 && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <p className="text-[11px] text-stone-600">Goods value</p>
              <p className="text-sm font-semibold text-stone-200">{formatNaira(shipment.shipmentValue)}</p>
            </div>
            {shipment.actualDeliveryDate && (
              <div>
                <p className="text-[11px] text-stone-600">Delivered</p>
                <p className="text-sm font-semibold text-emerald-300">{formatDateTime(shipment.actualDeliveryDate)}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── LINKED RUN (if part of a dispatch run) ────────────────────── */}
      {shipment.runId && (
        <Link
          to={`/dashboard/runs/${shipment.runId}`}
          className="block rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] hover:border-orange-500/20 p-4 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
              <Route className="h-4.5 w-4.5 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wide">Part of a dispatch run</p>
              <p className="text-sm font-semibold text-white truncate">
                {shipment.runName || "Run"}
                {shipment.runStatus && (
                  <span className="ml-2 text-[11px] text-stone-500 font-normal capitalize">
                    · {shipment.runStatus.replace("_", " ")}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {shipment.runLegCount ?? 0} shipment{shipment.runLegCount !== 1 ? "s" : ""}
                {shipment.runTotalCost != null && shipment.runTotalCost > 0 && (
                  <> · {formatNaira(shipment.runTotalCost)} total cost</>
                )}
              </p>
            </div>
            <span className="text-stone-600 group-hover:text-orange-400 transition-colors text-xs">→</span>
          </div>
        </Link>
      )}

      {/* ── PARTIES (sender + recipient) ──────────────────────────────── */}
      {(shipment.waybill?.senderName || recipientName) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {shipment.waybill?.senderName && (
            <PartyCard
              icon={<User className="h-4 w-4 text-stone-400" />}
              label="Sender"
              name={shipment.waybill.senderName}
              phone={shipment.waybill.senderPhone}
            />
          )}
          {recipientName && (
            <PartyCard
              icon={<User className="h-4 w-4 text-stone-400" />}
              label="Recipient"
              name={recipientName}
              phone={recipientPhone}
              extraAction={navUrl ? { href: navUrl, label: "Navigate", icon: <Navigation className="h-3.5 w-3.5" /> } : undefined}
            />
          )}
        </div>
      )}

      {/* ── PRIMARY ACTIONS ────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {HANDOVER_ELIGIBLE.includes(shipment.status as ShipmentStatus) && (
          <button
            onClick={() => setShowHandoverModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 px-4 h-10 text-xs font-semibold text-white shadow-sm shadow-purple-500/20 transition-all"
          >
            <Handshake className="h-3.5 w-3.5" />
            {shipment.status === "disputed" ? "Re-initiate handover" : "Hand over"}
          </button>
        )}

        {["handed_over", "ghosted"].includes(shipment.status) && !showReclaimForm && (
          <button
            onClick={() => setShowReclaimForm(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/[0.08] hover:bg-red-500/[0.14] hover:border-red-500/40 px-4 h-10 text-xs font-semibold text-red-300 transition-all"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Open dispute
          </button>
        )}
      </div>

      {/* Dispute form (when triggered) */}
      {showReclaimForm && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-300">Open a dispute</p>
              <p className="text-xs text-red-400/80 mt-1 leading-relaxed">
                Use this if custody was not properly transferred — the next custodian didn't sign, or goods are missing.
              </p>
            </div>
          </div>
          <input
            value={reclaimReason}
            onChange={(e) => setReclaimReason(e.target.value)}
            placeholder="Reason (e.g. driver unreachable, goods not delivered)"
            className="w-full rounded-lg border border-red-500/30 bg-red-500/[0.06] px-3 h-9 text-xs text-white placeholder:text-red-400/50 focus:outline-none focus:border-red-400 transition-colors"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReclaim}
              disabled={updating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white px-3 h-9 text-xs font-semibold disabled:opacity-60 transition-colors"
            >
              {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5" />}
              Mark as disputed
            </button>
            <button onClick={() => setShowReclaimForm(false)} className="text-xs text-stone-500 hover:text-stone-300 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Live update banner */}
      {justUpdated && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-2.5 flex items-center gap-2 text-xs font-medium text-emerald-400">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          Handover confirmed — custody chain updated in real time.
        </div>
      )}

      {/* ── CUSTODY CHAIN ──────────────────────────────────────────────── */}
      {showChain && (
        <div className={[
          "rounded-xl border p-5 transition-colors duration-700",
          justUpdated ? "border-emerald-500/30 bg-emerald-500/[0.04]" : "border-purple-500/20 bg-white/[0.03]",
        ].join(" ")}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-stone-300 inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-purple-400" /> Full custody chain
            </p>
            <span className="text-[11px] text-stone-500">
              {waybillChain.length} event{waybillChain.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="relative">
            <div className="absolute left-[17px] top-5 bottom-5 w-px bg-purple-500/20" />
            <div className="space-y-3">
              {waybillChain.map((event, idx) => (
                <div key={event.id} className="relative flex gap-3">
                  <div className={[
                    "relative z-10 shrink-0 h-9 w-9 rounded-full border-2 flex items-center justify-center text-[10px] font-bold",
                    idx === waybillChain.length - 1 && event.receiverActorType === "ACTOR_RECEIVER"
                      ? "border-emerald-500 bg-emerald-500/[0.15] text-emerald-400"
                      : "border-purple-400 bg-purple-500/[0.1] text-purple-400",
                  ].join(" ")}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.04] p-3 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-stone-200 truncate">{event.receiverName}</p>
                        <p className="text-[11px] text-stone-500">
                          {event.giverName
                            ? `${event.giverName} (${ACTOR_LABELS[event.giverActorType]})`
                            : ACTOR_LABELS[event.giverActorType]}{" "}→ {ACTOR_LABELS[event.receiverActorType]}
                        </p>
                      </div>
                      {event.latitude != null && event.longitude != null && (
                        <a
                          href={`https://maps.google.com?q=${event.latitude},${event.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-[10px] text-stone-500 hover:text-orange-400 flex items-center gap-0.5 transition-colors"
                        >
                          <MapPin className="h-2.5 w-2.5" /> GPS
                        </a>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-[10px] text-stone-600 truncate">
                        {event.proofHash.slice(0, 16)}…
                      </p>
                      <p className="text-[10px] text-stone-600 shrink-0 whitespace-nowrap">
                        {new Date(event.occurredAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short" })}
                        {" · "}
                        {new Date(event.occurredAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fallback: shipment-scoped events when no waybill chain available */}
      {!showChain && handoverEvents.length > 0 && (
        <div className="rounded-xl border border-purple-500/20 bg-white/[0.03] p-5">
          <p className="text-xs font-semibold text-stone-300 mb-4 inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-purple-400" /> Custody events
          </p>
          <ol className="relative border-l border-purple-500/20 ml-2 space-y-4">
            {handoverEvents.map((event) => (
              <li key={event.id} className="ml-4">
                <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border border-[#060d18] bg-purple-500" />
                <div>
                  <p className="text-xs font-medium text-stone-200">
                    {ACTOR_LABELS[event.giverActorType]} → {ACTOR_LABELS[event.receiverActorType]}
                  </p>
                  <p className="text-[11px] text-stone-500">Received by {event.receiverName}</p>
                  <p className="font-mono text-[10px] text-stone-600 mt-0.5">PoH: {event.proofHash.slice(0, 16)}…</p>
                  <p className="text-[11px] text-stone-500">{formatDateTime(event.occurredAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── INTERNAL NOTES ─────────────────────────────────────────────── */}
      {shipment.notes && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
          <p className="text-[11px] font-medium text-stone-500 mb-1 uppercase tracking-wide inline-flex items-center gap-1.5">
            <FileText className="h-3 w-3" /> Notes
          </p>
          <p className="text-sm text-stone-200">{shipment.notes}</p>
        </div>
      )}

      {/* ── STATUS TIMELINE ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
        <p className="text-xs font-semibold text-stone-300 mb-4 inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-stone-500" /> Timeline
        </p>
        <ol className="relative border-l border-white/[0.08] ml-2 space-y-4">
          {log.map((entry) => (
            <li key={entry.id} className="ml-4">
              <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border border-[#060d18] bg-orange-500" />
              <div>
                <p className="text-xs font-medium text-stone-200 capitalize">
                  {entry.newStatus.replace(/_/g, " ")}
                </p>
                {entry.note && <p className="text-[11px] text-stone-500">{entry.note}</p>}
                <p className="text-[11px] text-stone-600">{formatDateTime(entry.changedAt)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {showHandoverModal && shipment && (
        <HandoverQRModal
          shipmentId={shipment.id}
          goodsDescription={shipment.goodsDescription}
          onClose={() => setShowHandoverModal(false)}
          onConfirmed={() => {
            load().then(() => {
              setJustUpdated(true);
              setTimeout(() => setJustUpdated(false), 4000);
            });
          }}
        />
      )}
    </div>
  );
}

// ── Party card (sender / recipient) ───────────────────────────────────────

function PartyCard({
  icon, label, name, phone, extraAction,
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  phone: string | null;
  extraAction?: { href: string; label: string; icon: React.ReactNode };
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="h-8 w-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wide">{label}</p>
          <p className="text-sm font-semibold text-white">{name}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
        {phone ? (
          <a
            href={`tel:${phone}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-emerald-500/[0.1] hover:border-emerald-500/30 hover:text-emerald-400 h-9 text-xs font-medium text-stone-300 transition-colors"
          >
            <Phone className="h-3.5 w-3.5" />
            <span className="font-mono">{phone}</span>
          </a>
        ) : (
          <span className="flex-1 text-[11px] text-stone-600 text-center py-2">No phone on file</span>
        )}
        {extraAction && (
          <a
            href={extraAction.href}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-blue-500/[0.1] hover:border-blue-500/30 hover:text-blue-400 text-stone-400 transition-colors"
            title={extraAction.label}
          >
            {extraAction.icon}
          </a>
        )}
      </div>
    </div>
  );
}
