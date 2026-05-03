import { useEffect, useState } from "react";
import { fetchAllUsers, type AdminUser } from "@/services/admin.api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchAllUsers();
        if (!active) return;
        setUsers(data);
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
          <div className="h-3 w-72 rounded-md bg-muted/40 animate-pulse" />
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
        <h2 className="text-base font-semibold">Users</h2>
        <p className="text-sm text-muted-foreground">
          All users in this workspace.
        </p>
      </div>

      {users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-4 text-sm text-muted-foreground">
          No users found.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-background/60">
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">User</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Roles</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-border/60 hover:bg-muted/40 transition-colors"
                >
                  <td className="px-4 py-2 align-top">
                    <div className="text-sm font-medium">
                      {user.displayName || user.email || user.id}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.id}
                    </div>
                  </td>
                  <td className="px-4 py-2 align-top text-sm">
                    {user.email ?? "—"}
                  </td>
                  <td className="px-4 py-2 align-top text-xs">
                    {Array.isArray(user.roles) && user.roles.length > 0 ? (
                      <span className="inline-flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <span
                            key={role}
                            className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                          >
                            {role}
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

