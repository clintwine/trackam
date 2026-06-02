import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle, Truck, Navigation, Package, Plus, FileText, ChevronRight,
  ShieldAlert, Skull, Clock, TrendingUp, Trophy, Bike, ScanLine,
} from "lucide-react";
import { dashboardApi, type DashboardSummary, type RunAlert, type TopRider } from "@/services/logistics";
import { oliAccountApi, type OliAccountStatus } from "@/services/oliAccount";
import { formatNaira } from "@/lib/format";
import JoinLegModal from "@/components/logistics/JoinLegModal";

const VEHICLE_LABELS: Record<string, string> = {
  bike: "Bike", tricycle: "Tricycle", van: "Van", truck: "Truck",
};

export default function DashboardHome() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<RunAlert[]>([]);
  const [topRiders, setTopRiders] = useState<TopRider[]>([]);
  const [oliStatus, setOliStatus] = useState<OliAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinOpen, setJoinOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      dashboardApi.summary(),
      dashboardApi.alerts(),
      dashboardApi.topRiders(),
      oliAccountApi.get(),
    ])
      .then(([s, a, tr, oli]) => {
        setSummary(s);
        setAlerts(Array.isArray(a) ? a : []);
        setTopRiders(Array.isArray(tr) ? tr : []);
        setOliStatus(oli.status);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !summary) return <DashboardSkeleton />;

  const s = summary;
  const hasMonthData = s.month.runsDispatched > 0;

  return (
    <div className="space-y-5 max-w-6xl">

      {/* OLI Switch provisioning banner */}
      {(oliStatus === "pending" || oliStatus === "not_provisioned") && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.06] p-4 flex items-start gap-3">
          <Clock className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-300">Your organisation isn't connected to OLI Switch yet</p>
            <p className="text-xs text-blue-400/70 mt-0.5">
              Ask your admin to set up the API key in the{" "}
              <Link to="/admin/dashboard/oli" className="underline hover:text-blue-300 transition-colors">admin dashboard</Link> to start dispatching.
            </p>
          </div>
        </div>
      )}

      {/* Alerts banner — only when non-zero */}
      {alerts.length > 0 && (
        <AlertsBanner alerts={alerts} summary={s} />
      )}

      {/* Primary actions */}
      <div className="flex flex-wrap gap-2">
        <Link
          to="/dashboard/runs"
          className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 h-10 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 hover:shadow-orange-500/30 transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> Start a new run
        </Link>
        <button
          onClick={() => setJoinOpen(true)}
          className="group inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/[0.08] hover:bg-purple-500/[0.14] hover:border-purple-500/40 px-4 h-10 text-xs font-semibold text-purple-200 transition-all"
        >
          <ScanLine className="h-3.5 w-3.5" /> Join a leg
        </button>
        <Link
          to="/dashboard/waybills"
          className="group inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] px-4 h-10 text-xs font-medium text-stone-300 hover:text-white transition-all"
        >
          <FileText className="h-3.5 w-3.5" /> Claim a waybill
        </Link>
        <Link
          to="/dashboard/runs"
          className="group inline-flex items-center gap-1.5 rounded-xl px-3 h-10 text-xs font-medium text-stone-500 hover:text-stone-300 transition-colors ml-auto"
        >
          View all runs <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Today */}
      <section>
        <SectionLabel>Today</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            label="Active runs"
            value={s.today.activeRuns}
            icon={<Navigation className="h-3.5 w-3.5" />}
            tone={s.today.activeRuns > 0 ? "blue" : "neutral"}
            href="/dashboard/runs"
            sublabel={s.today.activeRuns > 0 ? "In loading or in transit" : "No runs in motion"}
          />
          <StatCard
            label="Dispatched today"
            value={s.today.runsDispatched}
            icon={<Truck className="h-3.5 w-3.5" />}
            tone="neutral"
            sublabel="Runs that departed today"
          />
          <StatCard
            label="Waybills to dispatch"
            value={s.today.waybillsUnassigned}
            icon={<Package className="h-3.5 w-3.5" />}
            tone={s.today.waybillsUnassigned > 0 ? "amber" : "neutral"}
            href="/dashboard/waybills"
            sublabel={s.today.waybillsUnassigned > 0 ? "Claimed but not on a run yet" : "All claimed waybills are loaded"}
          />
        </div>
      </section>

      {/* This month */}
      <section>
        <SectionLabel>This month</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Runs dispatched"
            value={s.month.runsDispatched}
            tone="neutral"
            sublabel={hasMonthData ? `${s.month.runsCompleted} completed` : "—"}
          />
          <StatCard
            label="Run cost"
            value={formatNaira(s.month.totalCostKobo)}
            tone="neutral"
            sublabel="Fuel + rider fees"
          />
          <StatCard
            label="Avg cost / run"
            value={formatNaira(s.month.avgCostPerRunKobo)}
            tone="neutral"
            sublabel={hasMonthData ? "Per dispatched run" : "—"}
          />
          <StatCard
            label="Ghost rate"
            value={`${s.month.ghostRate}%`}
            tone={s.month.ghostRate > 10 ? "red" : s.month.ghostRate > 5 ? "amber" : "emerald"}
            sublabel={`${s.month.ghostedCount} ghosted`}
          />
        </div>
      </section>

      {/* Financial exposure */}
      {(s.exposure.valueAtRiskKobo > 0 || s.exposure.allTimeValueLostKobo > 0) && (
        <section>
          <SectionLabel>Financial exposure</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {s.exposure.valueAtRiskKobo > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-medium text-amber-400/80 uppercase tracking-wide">Currently at risk</p>
                  <ShieldAlert className="h-4 w-4 text-amber-400/60" />
                </div>
                <p className="text-2xl font-semibold text-amber-200">{formatNaira(s.exposure.valueAtRiskKobo)}</p>
                <p className="text-[11px] text-amber-500/70 mt-1.5">Goods value + logistics spend in active runs</p>
              </div>
            )}
            {s.exposure.allTimeValueLostKobo > 0 && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-medium text-red-400/80 uppercase tracking-wide">Lost to ghosting</p>
                  <Skull className="h-4 w-4 text-red-400/60" />
                </div>
                <p className="text-2xl font-semibold text-red-200">{formatNaira(s.exposure.allTimeValueLostKobo)}</p>
                <p className="text-[11px] text-red-500/70 mt-1.5">Goods value on runs that never delivered</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Top riders */}
      {topRiders.length > 0 && (
        <section>
          <SectionLabel>
            <span className="inline-flex items-center gap-1.5">
              <Trophy className="h-3 w-3" /> Top riders this month
            </span>
          </SectionLabel>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02] text-stone-500">
                  <th className="px-4 py-2.5 text-left font-medium">Rider</th>
                  <th className="px-4 py-2.5 text-right font-medium hidden sm:table-cell">Runs</th>
                  <th className="px-4 py-2.5 text-right font-medium">Cost paid</th>
                  <th className="px-4 py-2.5 text-right font-medium">Ghost rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {topRiders.map((r) => (
                  <tr key={r.riderId} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        to={`/dashboard/riders`}
                        className="font-medium text-stone-200 hover:text-orange-400 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Bike className="h-3 w-3 text-stone-600" /> {r.riderName}
                      </Link>
                      <p className="text-[10px] text-stone-600 ml-4.5">{VEHICLE_LABELS[r.vehicleType] ?? r.vehicleType}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-stone-300 hidden sm:table-cell">
                      <span className="font-medium">{r.runsTotal}</span>
                      <span className="text-stone-600"> ({r.runsCompleted} done)</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-stone-200">{formatNaira(r.totalCostKobo)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={
                        r.ghostRate > 20 ? "text-red-400 font-semibold" :
                        r.ghostRate > 10 ? "text-orange-400" :
                        "text-emerald-400"
                      }>
                        {r.ghostRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Empty-state nudge when truly empty */}
      {!hasMonthData && s.today.activeRuns === 0 && s.today.waybillsUnassigned === 0 && (
        <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] py-10 text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-10 w-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-stone-500" />
            </div>
          </div>
          <p className="text-sm font-medium text-stone-300">Nothing to show yet</p>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Claim a waybill, set up a run, and dispatch — your dashboard will fill in as activity comes through.
          </p>
        </div>
      )}

      {joinOpen && <JoinLegModal onClose={() => setJoinOpen(false)} />}
    </div>
  );
}

// ── Alerts banner ──────────────────────────────────────────────────────────

function AlertsBanner({ alerts, summary }: { alerts: RunAlert[]; summary: DashboardSummary }) {
  const { ghostingCount, delayedCount } = summary.alerts;
  const tone = ghostingCount > 0 ? "red" : "amber";
  const styles = tone === "red"
    ? { border: "border-red-500/25", bg: "bg-red-500/[0.06]", text: "text-red-300", sub: "text-red-400/70", row: "hover:border-red-500/30" }
    : { border: "border-amber-500/25", bg: "bg-amber-500/[0.06]", text: "text-amber-300", sub: "text-amber-400/70", row: "hover:border-amber-500/30" };

  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className={`h-4 w-4 ${styles.text} shrink-0`} />
        <p className={`text-sm font-semibold ${styles.text}`}>
          {alerts.length} run{alerts.length !== 1 ? "s" : ""} need attention
        </p>
        <p className={`text-[11px] ${styles.sub}`}>
          {ghostingCount > 0 && <span>{ghostingCount} ghosting</span>}
          {ghostingCount > 0 && delayedCount > 0 && <span> · </span>}
          {delayedCount > 0 && <span>{delayedCount} delayed</span>}
        </p>
      </div>
      <div className="space-y-2">
        {alerts.slice(0, 3).map((run) => (
          <Link
            key={run.id}
            to={`/dashboard/runs/${run.id}`}
            className={`flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/[0.06] ${styles.row} px-3 py-2 transition-all`}
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-stone-200 truncate">
                {run.name || `Run — ${new Date(run.createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short" })}`}
              </p>
              <p className="text-[11px] text-stone-500 truncate">
                {run.riderName ? `${run.riderName} · ` : ""}{run.legCount} waybill{run.legCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-3 shrink-0">
              {run.ghostingFlag && (
                <span className="text-[11px] font-medium text-red-400">Ghosting</span>
              )}
              {run.delayFlag && !run.ghostingFlag && (
                <span className="text-[11px] font-medium text-amber-400">Delayed</span>
              )}
              <ChevronRight className="h-3.5 w-3.5 text-stone-600" />
            </div>
          </Link>
        ))}
      </div>
      {alerts.length > 3 && (
        <Link to="/dashboard/runs" className={`mt-2 inline-flex items-center gap-1 text-[11px] ${styles.text} hover:underline`}>
          View all {alerts.length} flagged runs <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

// ── Building blocks ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-stone-600 mb-2.5 uppercase tracking-[0.15em]">
      {children}
    </p>
  );
}

type Tone = "neutral" | "blue" | "amber" | "red" | "emerald";

function StatCard({
  label, value, icon, tone = "neutral", href, sublabel,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  tone?: Tone;
  href?: string;
  sublabel?: string;
}) {
  const toneStyles: Record<Tone, { border: string; value: string; icon: string }> = {
    neutral: { border: "border-white/[0.06]",  value: "text-white",        icon: "text-stone-600" },
    blue:    { border: "border-blue-500/20",   value: "text-blue-300",     icon: "text-blue-400/70" },
    amber:   { border: "border-amber-500/20",  value: "text-amber-300",    icon: "text-amber-400/70" },
    red:     { border: "border-red-500/20",    value: "text-red-300",      icon: "text-red-400/70" },
    emerald: { border: "border-emerald-500/20",value: "text-emerald-300",  icon: "text-emerald-400/70" },
  };
  const t = toneStyles[tone];

  const inner = (
    <div className={`rounded-xl border ${t.border} bg-white/[0.03] p-4 h-full ${href ? "hover:bg-white/[0.05] transition-colors group" : ""}`}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] text-stone-500">{label}</p>
        <span className={t.icon}>{icon}</span>
      </div>
      <p className={`text-2xl font-semibold ${t.value}`}>{value}</p>
      {sublabel && <p className="text-[11px] text-stone-600 mt-1">{sublabel}</p>}
    </div>
  );

  return href ? <Link to={href} className="block">{inner}</Link> : inner;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 max-w-6xl animate-pulse">
      <div className="flex gap-2">
        <div className="h-10 w-32 rounded-xl bg-white/[0.03] border border-white/[0.06]" />
        <div className="h-10 w-32 rounded-xl bg-white/[0.03] border border-white/[0.06]" />
      </div>
      <div className="grid grid-cols-3 gap-3">{[0,1,2].map(i => <div key={i} className="h-24 rounded-xl bg-white/[0.03] border border-white/[0.06]" />)}</div>
      <div className="grid grid-cols-4 gap-3">{[0,1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-white/[0.03] border border-white/[0.06]" />)}</div>
      <div className="h-48 rounded-xl bg-white/[0.03] border border-white/[0.06]" />
    </div>
  );
}
