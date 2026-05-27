import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Package, MapPin, CheckCircle2, Clock, Loader2, ExternalLink, ShieldCheck } from "lucide-react"; // Package used in error state
import { publicWaybillApi, ACTOR_LABELS, type ActorType } from "@/services/handover";
import { PublicNav } from "@/components/layout/PublicNav";

interface ChainEvent {
  id: string;
  shipmentId: string;
  waybillId: string;
  // Names are stripped from the public chain — only actor types are public.
  // Full names are served via the authenticated chain endpoint (claimed operator / verified party).
  giverActorType: ActorType;
  receiverActorType: ActorType;
  proofHash: string;
  latitude: number | null;
  longitude: number | null;
  occurredAt: string;
}

interface WaybillChain {
  waybill: {
    id: string;
    waybillNumber: string;
    goodsDescription: string;
    pickupLocation: string;
    deliveryLocation: string;
    estimatedWeightKg: number | null;
    createdAt: string;
    isClaimed: boolean;
    isDelivered: boolean;
  };
  chain: ChainEvent[];
  totalHandovers: number;
}

export default function TrackWaybillPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<WaybillChain | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    publicWaybillApi
      .getChain(id)
      .then(setData)
      .catch(() => setError("Waybill not found or tracking unavailable."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-stone-50">
      <PublicNav />

      <main className="max-w-xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20 space-y-3">
            <div className="h-12 w-12 rounded-full bg-red-100 mx-auto flex items-center justify-center">
              <Package className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-sm font-medium text-foreground">Waybill not found</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-5">
            {/* Waybill header */}
            <div className="rounded-xl border border-border bg-white p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Waybill
                  </p>
                  <p className="text-lg font-bold text-foreground font-mono">
                    {data.waybill.waybillNumber}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {data.waybill.isDelivered ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 border border-green-200 px-2.5 py-0.5 text-[11px] font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Delivered
                    </span>
                  ) : data.waybill.isClaimed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-[11px] font-medium">
                      <ShieldCheck className="h-3 w-3" /> In transit
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200 px-2.5 py-0.5 text-[11px] font-medium">
                      <Clock className="h-3 w-3" /> Awaiting pickup
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{data.waybill.goodsDescription}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{data.waybill.pickupLocation}</span>
                  <span className="text-stone-300">→</span>
                  <span>{data.waybill.deliveryLocation}</span>
                </div>
                {data.waybill.estimatedWeightKg && (
                  <p className="text-xs text-muted-foreground">{data.waybill.estimatedWeightKg} kg</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <p className="text-[11px] text-muted-foreground">
                  Generated{" "}
                  {new Date(data.waybill.createdAt).toLocaleDateString("en-NG", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <a
                  href={publicWaybillApi.pdfUrl(data.waybill.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> Download PDF
                </a>
              </div>
            </div>

            {/* Custody chain */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">Custody chain</h2>
                <span className="text-[11px] text-muted-foreground">
                  {data.totalHandovers} handover{data.totalHandovers !== 1 ? "s" : ""}
                </span>
              </div>

              {data.chain.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-white p-6 text-center space-y-1">
                  <p className="text-xs text-muted-foreground">No custody events recorded yet.</p>
                  <p className="text-[11px] text-muted-foreground">
                    Events appear here as the shipment changes hands.
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[17px] top-5 bottom-5 w-px bg-border" />
                  <div className="space-y-3">
                    {data.chain.map((event, idx) => (
                      <div key={event.id} className="relative flex gap-3">
                        <div
                          className={[
                            "relative z-10 shrink-0 h-9 w-9 rounded-full border-2 flex items-center justify-center text-[10px] font-bold",
                            idx === data.chain.length - 1 && data.waybill.isDelivered
                              ? "border-green-500 bg-green-50 text-green-700"
                              : "border-primary bg-primary/10 text-primary",
                          ].join(" ")}
                        >
                          {idx + 1}
                        </div>

                        <div className="flex-1 rounded-lg border border-border bg-white p-3 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">
                                {ACTOR_LABELS[event.giverActorType]} → {ACTOR_LABELS[event.receiverActorType]}
                              </p>
                            </div>
                            {event.latitude != null && event.longitude != null && (
                              <a
                                href={`https://maps.google.com?q=${event.latitude},${event.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5"
                              >
                                <MapPin className="h-2.5 w-2.5" /> GPS
                              </a>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-mono text-[10px] text-muted-foreground truncate">
                              {event.proofHash.slice(0, 16)}…
                            </p>
                            <p className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                              {new Date(event.occurredAt).toLocaleDateString("en-NG", {
                                day: "2-digit",
                                month: "short",
                              })}{" "}
                              ·{" "}
                              {new Date(event.occurredAt).toLocaleTimeString("en-NG", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="text-center text-[11px] text-muted-foreground">
              Powered by Open Logistics Interconnect (OLI) · trackam.ng
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
