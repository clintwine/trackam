import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Package, Truck, CheckCircle2, Ghost, TrendingDown, ShieldAlert, Skull, Clock, ArrowRight } from "lucide-react";
import { dashboardApi, type DashboardSummary, type Shipment } from "@/services/logistics";
import { oliAccountApi, type OliAccountStatus } from "@/services/oliAccount";
import { formatNaira } from "@/lib/format";
import { RiskBadge } from "@/components/logistics/StatusBadge";

export default function DashboardHome() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [oliStatus, setOliStatus] = useState<OliAccountStatus | null>(null);

  useEffect(() => {
    Promise.all([dashboardApi.summary(), dashboardApi.alerts(), oliAccountApi.get()])
      .then(([s, a, oli]) => { setSummary(s); setAlerts(a); setOliStatus(oli.status); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  const s = summary!;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* OLI Switch provisioning banner */}
      {(oliStatus === "pending" || oliStatus === "not_provisioned") && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.06] p-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-300">Your OLI Switch account is pending approval</p>
              <p className="text-xs text-blue-400/70 mt-0.5">
                You'll receive an API key by email once your account is activated. Paste it in{" "}
                <Link to="/dashboard/settings" className="underline hover:text-blue-300 transition-colors">Settings</Link> to start dispatching.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerts banner */}
      {alerts.length > 0 && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.06] p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />
            <p className="text-sm font-semibold text-orange-300">
              {alerts.length} shipment{alerts.length !== 1 ? "s" : ""} need attention
            </p>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((shipment) => (
              <Link
                key={shipment.id}
                to={`/dashboard/shipments/${shipment.id}`}
                className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2 hover:bg-white/[0.06] hover:border-orange-500/20 transition-all"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-stone-200 truncate">{shipment.goodsDescription}</p>
                  <p className="text-[11px] text-stone-500 truncate">
                    {shipment.pickupLocation} → {shipment.deliveryLocation}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {shipment.delayFlag && (
                    <span className="text-[11px] font-medium text-orange-400">Delayed</span>
                  )}
                  {shipment.ghostingFlag && (
                    <span className="text-[11px] font-medium text-red-400">Ghosting risk</span>
                  )}
                  <RiskBadge score={shipment.riskScore} />
                </div>
              </Link>
            ))}
          </div>
          {alerts.length > 3 && (
            <Link to="/dashboard/shipments" className="mt-2 block text-[11px] text-orange-400 hover:text-orange-300 transition-colors">
              View all {alerts.length} alerts →
            </Link>
          )}
        </div>
      )}

      {/* Today */}
      <div>
        <p className="text-[11px] font-semibold text-stone-600 mb-3 uppercase tracking-[0.15em]">Today</p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Pending pickup" value={s.today.pending} icon={<Package className="h-4 w-4 text-stone-600" />} />
          <StatCard label="In transit" value={s.today.inTransit} icon={<Truck className="h-4 w-4 text-blue-400/70" />} highlight={s.today.inTransit > 0} />
          <StatCard label="Delivered" value={s.today.delivered} icon={<CheckCircle2 className="h-4 w-4 text-emerald-400/70" />} />
        </div>
      </div>

      {/* This month */}
      <div>
        <p className="text-[11px] font-semibold text-stone-600 mb-3 uppercase tracking-[0.15em]">This month</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total shipments" value={s.month.totalShipments} />
          <StatCard label="Logistics spend" value={formatNaira(s.month.totalCostKobo)} icon={<TrendingDown className="h-4 w-4 text-stone-600" />} />
          <StatCard label="Ghosted" value={s.month.ghostedCount} icon={<Ghost className="h-4 w-4 text-orange-400/70" />} danger={s.month.ghostedCount > 0} />
          <StatCard label="Ghost rate" value={`${s.month.ghostRate}%`} danger={s.month.ghostRate > 10} />
        </div>
      </div>

      {/* Financial exposure */}
      {(s.exposure.valueAtRiskKobo > 0 || s.exposure.allTimeValueLostKobo > 0) && (
        <div>
          <p className="text-[11px] font-semibold text-stone-600 mb-3 uppercase tracking-[0.15em]">Financial exposure</p>
          <div className="grid grid-cols-2 gap-3">
            {s.exposure.valueAtRiskKobo > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] text-amber-400/70">Currently at risk</p>
                  <ShieldAlert className="h-4 w-4 text-amber-400/50" />
                </div>
                <p className="text-xl font-semibold text-amber-300">{formatNaira(s.exposure.valueAtRiskKobo)}</p>
                <p className="text-[11px] text-amber-500/60 mt-1">Goods + logistics in active shipments</p>
              </div>
            )}
            {s.exposure.allTimeValueLostKobo > 0 && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] text-red-400/70">Lost to ghosting</p>
                  <Skull className="h-4 w-4 text-red-400/50" />
                </div>
                <p className="text-xl font-semibold text-red-300">{formatNaira(s.exposure.allTimeValueLostKobo)}</p>
                <p className="text-[11px] text-red-500/60 mt-1">Goods + logistics never recovered</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Link to="/dashboard/shipments" className="group inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] px-3.5 h-9 text-xs font-medium text-stone-400 hover:text-white transition-all">
          <Package className="h-3.5 w-3.5" /> All shipments <ArrowRight className="h-3 w-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
        </Link>
        <Link to="/dashboard/riders" className="group inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] px-3.5 h-9 text-xs font-medium text-stone-400 hover:text-white transition-all">
          Manage riders <ArrowRight className="h-3 w-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
        </Link>
        <Link to="/dashboard/routes" className="group inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] px-3.5 h-9 text-xs font-medium text-stone-400 hover:text-white transition-all">
          Set up routes <ArrowRight className="h-3 w-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, highlight, danger }: {
  label: string; value: string | number; icon?: React.ReactNode; highlight?: boolean; danger?: boolean;
}) {
  return (
    <div className={[
      "rounded-xl border bg-white/[0.03] p-4 transition-colors",
      danger ? "border-red-500/20" : highlight ? "border-blue-500/20" : "border-white/[0.06]",
    ].join(" ")}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] text-stone-500">{label}</p>
        {icon}
      </div>
      <p className={["text-xl font-semibold", danger ? "text-red-400" : "text-white"].join(" ")}>
        {value}
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl animate-pulse">
      <div className="h-28 rounded-xl bg-white/[0.03] border border-white/[0.06]" />
      <div className="grid grid-cols-3 gap-3">{[0,1,2].map(i=><div key={i} className="h-20 rounded-xl bg-white/[0.03] border border-white/[0.06]"/>)}</div>
      <div className="grid grid-cols-4 gap-3">{[0,1,2,3].map(i=><div key={i} className="h-20 rounded-xl bg-white/[0.03] border border-white/[0.06]"/>)}</div>
    </div>
  );
}
