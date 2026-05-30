import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck, MapPin, Package, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  publicHandoverApi, waybillApi,
  ACTOR_LABELS, type TokenInfo,
} from "@/services/handover";
import { useProfileStore } from "@/hooks/useProfile";
import { getAuthToken } from "@/lib/authToken";

type Phase = "loading" | "preview" | "confirming" | "joining" | "success" | "error";

export default function JoinLegPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");
  const profile = useProfileStore((s) => s.profile);

  const [phase, setPhase] = useState<Phase>("loading");
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [error, setError] = useState("");
  const [joinedShipmentId, setJoinedShipmentId] = useState<string | null>(null);

  const isSignedIn = Boolean(getAuthToken());

  useEffect(() => {
    if (!token) {
      setError("No handover token in this link.");
      setPhase("error");
      return;
    }
    if (!isSignedIn) {
      const returnUrl = `/join?token=${encodeURIComponent(token)}`;
      navigate(`/auth/login?redirect=${encodeURIComponent(returnUrl)}`, { replace: true });
      return;
    }
    publicHandoverApi.getTokenInfo(token)
      .then((info) => {
        setTokenInfo(info);
        setPhase("preview");
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || "Invalid or expired handover token.";
        setError(msg);
        setPhase("error");
      });
  }, [token, isSignedIn]);

  async function handleJoinLeg() {
    if (!token || !tokenInfo) return;
    setPhase("confirming");
    try {
      const displayName = (profile as Record<string, unknown>)?.displayName as string
        || (profile as Record<string, unknown>)?.email as string
        || "Operator";

      const result = await waybillApi.confirmAndJoin(token, displayName);
      setJoinedShipmentId(result.shipmentId);
      setPhase("success");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err as Error)?.message
        || "Failed to join custody leg.";
      setError(msg);
      setPhase("error");
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">

        {phase === "loading" && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading handover details…</p>
          </div>
        )}

        {phase === "preview" && tokenInfo && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <h1 className="text-lg font-semibold">Join custody leg</h1>
              <p className="text-sm text-muted-foreground mt-1">
                A driver is handing this shipment to your hub.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4 space-y-2.5">
              <p className="text-sm font-medium">{tokenInfo.shipment.goodsDescription}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3 w-3 shrink-0" />
                {tokenInfo.shipment.pickupLocation} → {tokenInfo.shipment.deliveryLocation}
              </p>
              <div className="border-t pt-2.5 flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                <span className="text-xs text-muted-foreground">
                  From: {tokenInfo.giverName || "Driver"} ({ACTOR_LABELS[tokenInfo.giverActorType]})
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-800">
                Joining this leg will create a shipment in your dashboard and record a custody handover event on the OLI network.
              </p>
            </div>

            <button
              onClick={handleJoinLeg}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground h-11 text-sm font-semibold hover:bg-primary/90"
            >
              <ShieldCheck className="h-4 w-4" />
              Accept custody &amp; join leg
            </button>
          </div>
        )}

        {(phase === "confirming" || phase === "joining") && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {phase === "confirming" ? "Recording handover…" : "Joining custody leg…"}
            </p>
          </div>
        )}

        {phase === "success" && (
          <div className="flex flex-col items-center text-center gap-5 py-8">
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <div>
              <p className="text-base font-semibold">Custody received</p>
              <p className="text-sm text-muted-foreground mt-1">
                The shipment has been added to your dashboard.
              </p>
            </div>
            <button
              onClick={() => navigate(joinedShipmentId ? `/dashboard/shipments/${joinedShipmentId}` : "/dashboard/waybills")}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 h-9 text-sm font-semibold hover:bg-primary/90"
            >
              View shipment
            </button>
          </div>
        )}

        {phase === "error" && (
          <div className="flex flex-col items-center text-center gap-4 py-8">
            <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-red-600" />
            </div>
            <div>
              <p className="text-base font-semibold">Something went wrong</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">{error}</p>
            </div>
            <button
              onClick={() => navigate("/dashboard/waybills")}
              className="inline-flex items-center gap-1.5 rounded-md bg-secondary text-secondary-foreground px-4 h-9 text-sm font-medium hover:bg-secondary/80"
            >
              Go to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
