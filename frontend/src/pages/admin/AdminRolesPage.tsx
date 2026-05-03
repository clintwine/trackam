import { useEffect, useState } from "react";
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
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded-md bg-muted/60 animate-pulse" />
          <div className="h-3 w-80 rounded-md bg-muted/40 animate-pulse" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 animate-pulse space-y-2">
          <div className="h-3 w-full rounded-md bg-muted/40" />
          <div className="h-3 w-11/12 rounded-md bg-muted/40" />
          <div className="h-3 w-10/12 rounded-md bg-muted/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Roles</h2>
        <p className="text-sm text-muted-foreground">
          RBAC roles and their permissions.
        </p>
      </div>

      {roles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-4 text-sm text-muted-foreground">
          No roles have been configured yet.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-background/60">
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Description</th>
                <th className="px-4 py-2 font-medium">Permissions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr
                  key={role.id}
                  className="border-t border-border/60 hover:bg-muted/40 transition-colors"
                >
                  <td className="px-4 py-2 align-top text-xs font-semibold">
                    {role.id}
                  </td>
                  <td className="px-4 py-2 align-top text-xs text-muted-foreground">
                    {role.description ?? "—"}
                  </td>
                  <td className="px-4 py-2 align-top text-xs">
                    {role.permissions.length ? (
                      <span className="inline-flex flex-wrap gap-1">
                        {role.permissions.map((p) => (
                          <span
                            key={p}
                            className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                          >
                            {p}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

