import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Package, Truck, CheckCircle2, Ghost, TrendingDown, ShieldAlert, Skull } from "lucide-react";
import { dashboardApi, type DashboardSummary, type Shipment } from "@/services/logistics";
import { formatNaira } from "@/lib/format";
import { RiskBadge } from "@/components/logistics/StatusBadge";

export default function DashboardHome() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardApi.summary(), dashboardApi.alerts()])
      .then(([s, a]) => { setSummary(s); setAlerts(a); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  const s = summary!;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Alerts banner */}
      {alerts.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0" />
            <p className="text-sm font-semibold text-orange-800">
              {alerts.length} shipment{alerts.length !== 1 ? "s" : ""} need attention
            </p>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((shipment) => (
              <Link
                key={shipment.id}
                to={`/dashboard/shipments/${shipment.id}`}
                className="flex items-center justify-between rounded-md bg-white border border-orange-100 px-3 py-2 hover:border-orange-300 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-stone-800 truncate">{shipment.goodsDescription}</p>
                  <p className="text-[11px] text-stone-500 truncate">
                    {shipment.pickupLocation} → {shipment.deliveryLocation}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {shipment.delayFlag && (
                    <span className="text-[11px] font-medium text-orange-700">Delayed</span>
                  )}
                  {shipment.ghostingFlag && (
                    <span className="text-[11px] font-medium text-red-600">Ghosting risk</span>
                  )}
                  <RiskBadge score={shipment.riskScore} />
                </div>
              </Link>
            ))}
          </div>
          {alerts.length > 3 && (
            <Link to="/dashboard/shipments" className="mt-2 block text-[11px] text-orange-700 hover:underline">
              View all {alerts.length} alerts →
            </Link>
          )}
        </div>
      )}

      {/* Today */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-3 uppercase tracking-wider">Today</p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Pending pickup" value={s.today.pending} icon={<Package className="h-4 w-4 text-stone-400" />} />
          <StatCard label="In transit" value={s.today.inTransit} icon={<Truck className="h-4 w-4 text-blue-400" />} highlight={s.today.inTransit > 0} />
          <StatCard label="Delivered" value={s.today.delivered} icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} />
        </div>
      </div>

      {/* This month */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-3 uppercase tracking-wider">This month</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total shipments" value={s.month.totalShipments} />
          <StatCard label="Logistics spend" value={formatNaira(s.month.totalCostKobo)} icon={<TrendingDown className="h-4 w-4 text-stone-400" />} />
          <StatCard label="Ghosted" value={s.month.ghostedCount} icon={<Ghost className="h-4 w-4 text-orange-400" />} danger={s.month.ghostedCount > 0} />
          <StatCard label="Ghost rate" value={`${s.month.ghostRate}%`} danger={s.month.ghostRate > 10} />
        </div>
      </div>

      {/* Financial exposure */}
      {(s.exposure.valueAtRiskKobo > 0 || s.exposure.allTimeValueLostKobo > 0) && (
        <div>
          <p className="text-[11px] font-medium text-muted-foreground mb-3 uppercase tracking-wider">Financial exposure</p>
          <div className="grid grid-cols-2 gap-3">
            {s.exposure.valueAtRiskKobo > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] text-amber-700">Currently at risk</p>
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-xl font-semibold text-amber-900">{formatNaira(s.exposure.valueAtRiskKobo)}</p>
                <p className="text-[11px] text-amber-600 mt-1">Goods + logistics in active shipments</p>
              </div>
            )}
            {s.exposure.allTimeValueLostKobo > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] text-red-700">Lost to ghosting</p>
                  <Skull className="h-4 w-4 text-red-400" />
                </div>
                <p className="text-xl font-semibold text-red-900">{formatNaira(s.exposure.allTimeValueLostKobo)}</p>
                <p className="text-[11px] text-red-600 mt-1">Goods + logistics never recovered</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Link to="/dashboard/shipments" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 h-8 text-xs font-medium text-foreground hover:bg-secondary transition-colors shadow-xs">
          <Package className="h-3.5 w-3.5" /> All shipments
        </Link>
        <Link to="/dashboard/riders" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 h-8 text-xs font-medium text-foreground hover:bg-secondary transition-colors shadow-xs">
          Manage riders
        </Link>
        <Link to="/dashboard/routes" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 h-8 text-xs font-medium text-foreground hover:bg-secondary transition-colors shadow-xs">
          Set up routes
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
      "rounded-lg border bg-white p-4 shadow-xs",
      danger ? "border-red-200" : highlight ? "border-blue-200" : "border-border",
    ].join(" ")}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className={["text-xl font-semibold", danger ? "text-red-600" : "text-foreground"].join(" ")}>
        {value}
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl animate-pulse">
      <div className="h-28 rounded-lg bg-stone-100" />
      <div className="grid grid-cols-3 gap-3">{[0,1,2].map(i=><div key={i} className="h-20 rounded-lg bg-stone-100"/>)}</div>
      <div className="grid grid-cols-4 gap-3">{[0,1,2,3].map(i=><div key={i} className="h-20 rounded-lg bg-stone-100"/>)}</div>
    </div>
  );
}
