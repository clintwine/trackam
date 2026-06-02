import { useEffect, useState } from "react";
import { Shield, UserX, UserCheck, Loader2, Search } from "lucide-react";
import {
  fetchAllUsers, fetchRoles, updateUserRoles, toggleUserDisabled,
  type AdminUser, type RoleItem,
} from "@/services/admin.api";
import { useProfileStore } from "@/hooks/useProfile";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const currentUserId = useProfileStore((s) => s.profile?.id);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [u, r] = await Promise.all([fetchAllUsers(), fetchRoles()]);
        if (!active) return;
        setUsers(u);
        setRoles(r);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function handleToggleRole(user: AdminUser, role: string) {
    setBusyId(user.id);
    const currentRoles = Array.isArray(user.roles) ? user.roles : [];
    const nextRoles = currentRoles.includes(role)
      ? currentRoles.filter((r) => r !== role)
      : [...currentRoles, role];
    try {
      const updated = await updateUserRoles(user.id, nextRoles);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, roles: updated.roles } : u)));
    } catch {
      // handled
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleDisabled(user: AdminUser) {
    setBusyId(user.id);
    const isDisabled = Boolean((user as unknown as { preferences?: { disabled?: boolean } }).preferences?.disabled);
    try {
      const updated = await toggleUserDisabled(user.id, !isDisabled);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...updated } : u)));
    } catch {
      // handled
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-6xl animate-pulse">
        <div className="h-9 rounded-lg bg-white/[0.03] border border-white/[0.06]" />
        <div className="h-64 rounded-xl bg-white/[0.03] border border-white/[0.06]" />
      </div>
    );
  }

  const availableRoles = roles.map((r) => r.id);
  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.email || "").toLowerCase().includes(q) ||
      (u.displayName || "").toLowerCase().includes(q) ||
      (u.roles || []).some((r) => r.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-600" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by name, email, or role…"
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] pl-9 pr-3 h-9 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-orange-500/40 transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-8 text-center">
          <p className="text-sm text-stone-500">
            {search ? "No users match your search." : "No users yet."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[1fr_1.2fr_1.5fr_auto] gap-3 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-600">User</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-600">Email</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-600">Roles</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-600 text-right">Status</span>
          </div>

          <ul className="divide-y divide-white/[0.04]">
            {filtered.map((user) => {
              const userRoles = Array.isArray(user.roles) ? user.roles : [];
              const isDisabled = Boolean((user as unknown as { preferences?: { disabled?: boolean } }).preferences?.disabled);
              const isSelf = user.id === currentUserId;
              const busy = busyId === user.id;
              const initial = (user.displayName || user.email || "?").slice(0, 1).toUpperCase();
              const isOwner = userRoles.includes("owner");

              return (
                <li
                  key={user.id}
                  className={`grid grid-cols-1 md:grid-cols-[1fr_1.2fr_1.5fr_auto] gap-3 px-5 py-3 transition-colors ${isDisabled ? "opacity-50" : "hover:bg-white/[0.02]"}`}
                >
                  {/* User */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isOwner
                        ? "bg-gradient-to-br from-orange-500/40 to-amber-500/40 text-orange-200"
                        : "bg-gradient-to-br from-stone-700 to-stone-800 text-stone-300"
                    }`}>
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-stone-200 truncate flex items-center gap-1.5">
                        {user.displayName || user.email || user.id}
                        {isSelf && <span className="text-[9px] font-semibold uppercase text-orange-400">(you)</span>}
                      </div>
                      <div className="text-[10px] text-stone-600 truncate md:hidden">{user.email}</div>
                    </div>
                  </div>

                  {/* Email (desktop only) */}
                  <div className="hidden md:flex items-center min-w-0">
                    <span className="text-xs text-stone-400 truncate">{user.email ?? "—"}</span>
                  </div>

                  {/* Roles */}
                  <div className="flex flex-wrap items-center gap-1 min-w-0">
                    {availableRoles.map((role) => {
                      const active = userRoles.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          disabled={busy || isSelf}
                          onClick={() => handleToggleRole(user, role)}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border transition-all ${
                            active
                              ? role === "owner"
                                ? "bg-orange-500/[0.15] border-orange-500/30 text-orange-300 hover:bg-orange-500/[0.22]"
                                : "bg-purple-500/[0.12] border-purple-500/25 text-purple-300 hover:bg-purple-500/[0.18]"
                              : "bg-white/[0.03] border-white/[0.06] text-stone-600 hover:border-white/[0.12] hover:text-stone-400"
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                          title={isSelf ? "Cannot change your own roles" : `${active ? "Remove" : "Add"} ${role} role`}
                        >
                          {busy ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Shield className="h-2.5 w-2.5" />}
                          {role}
                        </button>
                      );
                    })}
                  </div>

                  {/* Status / actions */}
                  <div className="flex items-center justify-end gap-2">
                    {isDisabled && (
                      <span className="text-[10px] font-semibold uppercase text-red-400">Disabled</span>
                    )}
                    {!isSelf && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleToggleDisabled(user)}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 h-7 text-[10px] font-semibold transition-all disabled:opacity-50 ${
                          isDisabled
                            ? "border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/[0.1]"
                            : "border-white/[0.06] text-stone-500 hover:border-red-500/25 hover:text-red-400 hover:bg-red-500/[0.06]"
                        }`}
                        title={isDisabled ? "Re-enable this user" : "Disable this user"}
                      >
                        {isDisabled
                          ? <><UserCheck className="h-3 w-3" /> Enable</>
                          : <><UserX className="h-3 w-3" /> Disable</>}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
