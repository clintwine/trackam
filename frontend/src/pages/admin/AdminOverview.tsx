import { useEffect, useState } from "react";
import {
  fetchAllUsers,
  fetchEvents,
  fetchRoles,
  type AdminUser,
  type EventItem,
  type RoleItem,
} from "@/services/admin.api";

type AdminOverviewState = {
  users: AdminUser[];
  roles: RoleItem[];
  events: EventItem[];
};

const initialState: AdminOverviewState = {
  users: [],
  roles: [],
  events: [],
};

export default function AdminOverview() {
  const [state, setState] = useState<AdminOverviewState>(initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [users, roles, events] = await Promise.all([
          fetchAllUsers(),
          fetchRoles(),
          fetchEvents(),
        ]);
        if (!active) return;
        setState({ users, roles, events });
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
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border bg-card p-4 animate-pulse space-y-3"
            >
              <div className="h-3 w-24 rounded-md bg-muted/60" />
              <div className="h-6 w-12 rounded-md bg-muted/50" />
              <div className="h-2 w-16 rounded-md bg-muted/40" />
            </div>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4 animate-pulse space-y-3">
            <div className="h-3 w-40 rounded-md bg-muted/60" />
            <div className="h-3 w-full rounded-md bg-muted/40" />
            <div className="h-3 w-5/6 rounded-md bg-muted/40" />
          </div>
          <div className="rounded-xl border border-border bg-card p-4 animate-pulse space-y-3">
            <div className="h-3 w-32 rounded-md bg-muted/60" />
            <div className="h-3 w-full rounded-md bg-muted/40" />
            <div className="h-3 w-4/6 rounded-md bg-muted/40" />
          </div>
        </section>
      </div>
    );
  }

  const totalUsers = state.users.length;
  const totalRoles = state.roles.length;
  const totalEvents = state.events.length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Users" value={totalUsers} hint="All workspace users" />
        <StatCard
          label="Roles"
          value={totalRoles}
          hint="Available RBAC roles"
        />
        <StatCard
          label="Events"
          value={totalEvents}
          hint="Recent system events"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <header className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Recent users</h2>
          </header>
          {state.users.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No users have been created yet.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {state.users.slice(0, 5).map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between rounded-md bg-background/40 px-3 py-2 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {user.displayName || user.email || user.id}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </div>
                  </div>
                  {Array.isArray(user.roles) && user.roles.length > 0 && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {user.roles.join(", ")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <header className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Recent events</h2>
          </header>
          {state.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No events have been recorded yet.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {state.events.slice(0, 6).map((evt) => (
                <li
                  key={evt.id}
                  className="flex items-center justify-between rounded-md bg-background/40 px-3 py-2 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">
                      {evt.type}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {evt.createdAt
                        ? new Date(evt.createdAt).toLocaleString()
                        : "Unknown time"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: number;
  hint?: string;
};

function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint && (
        <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

