import { useEffect, useState } from "react";
import { ShieldCheck, Star } from "lucide-react";
import { fetchRoles, type RoleItem } from "@/services/admin.api";

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchRoles();
        if (!active) return;
        setRoles(data);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-white/[0.03] border border-white/[0.06]" />
        ))}
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="max-w-4xl rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-8 text-center">
        <ShieldCheck className="h-8 w-8 text-stone-600 mx-auto mb-3" />
        <p className="text-sm text-stone-500">No roles configured yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-4xl">
      {roles.map((role) => {
        const isOwner = role.id === "owner";
        const hasWildcard = role.permissions.includes("*");
        return (
          <div
            key={role.id}
            className={`rounded-xl border overflow-hidden ${
              isOwner
                ? "border-orange-500/20 bg-orange-500/[0.04]"
                : "border-white/[0.06] bg-white/[0.03]"
            }`}
          >
            <header className="px-5 py-4 border-b border-white/[0.06] flex items-start gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                isOwner
                  ? "bg-orange-500/[0.15] text-orange-300"
                  : "bg-white/[0.06] text-stone-400"
              }`}>
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-white font-mono">{role.id}</h3>
                  {isOwner && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/[0.15] border border-orange-500/25 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-orange-300">
                      <Star className="h-2.5 w-2.5" /> Founder
                    </span>
                  )}
                  {hasWildcard && (
                    <span className="inline-flex items-center rounded-full bg-purple-500/[0.1] border border-purple-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-purple-300">
                      Full access
                    </span>
                  )}
                </div>
                {role.description && (
                  <p className="text-[11px] text-stone-500 mt-0.5">{role.description}</p>
                )}
              </div>
            </header>
            <div className="px-5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                Permissions
              </p>
              {role.permissions.length === 0 ? (
                <p className="text-xs text-stone-600 italic">None</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {role.permissions.map((p) => (
                    <span
                      key={p}
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono font-medium border ${
                        p === "*"
                          ? "bg-purple-500/[0.1] border-purple-500/25 text-purple-300"
                          : "bg-white/[0.04] border-white/[0.08] text-stone-400"
                      }`}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
