import { useEffect, useState } from "react";
import {
  fetchAuthMe,
  fetchDevices,
  fetchGlobalSettings,
  fetchNotifications,
  fetchSessions,
  fetchUser,
  type DeviceItem,
  type GlobalSettings,
  type NotificationItem,
  type SessionItem,
  type UserProfile,
} from "@/services/dashboard.api";

type DashboardState = {
  me: UserProfile | null;
  notifications: NotificationItem[];
  devices: DeviceItem[];
  sessions: SessionItem[];
  settings: GlobalSettings | null;
};

const initialState: DashboardState = {
  me: null,
  notifications: [],
  devices: [],
  sessions: [],
  settings: null,
};

export default function DashboardHome() {
  const [state, setState] = useState<DashboardState>(initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [auth, notifications, devices, sessions, settings] =
          await Promise.all([
            fetchAuthMe(),
            fetchNotifications(),
            fetchDevices(),
            fetchSessions(),
            fetchGlobalSettings(),
          ]);

        const user = await fetchUser(auth.uid);

        if (!active) return;
        setState({
          me: user,
          notifications,
          devices,
          sessions,
          settings,
        });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const unreadNotifications = state.notifications.filter((n) => !n.read);

  if (loading) {
    return (
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 md:col-span-2 animate-pulse space-y-3">
            <div className="h-4 w-40 rounded-md bg-muted/60" />
            <div className="h-3 w-64 rounded-md bg-muted/50" />
            <div className="h-3 w-56 rounded-md bg-muted/40" />
          </div>
          <div className="rounded-xl border border-border bg-card p-4 animate-pulse space-y-3">
            <div className="h-3 w-24 rounded-md bg-muted/60" />
            <div className="h-3 w-full rounded-md bg-muted/40" />
            <div className="h-3 w-3/4 rounded-md bg-muted/40" />
            <div className="h-3 w-2/3 rounded-md bg-muted/40" />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 md:col-span-2 animate-pulse space-y-3">
            <div className="h-4 w-32 rounded-md bg-muted/60" />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="h-20 rounded-lg bg-muted/40" />
              <div className="h-20 rounded-lg bg-muted/40" />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 animate-pulse space-y-3">
            <div className="h-4 w-40 rounded-md bg-muted/60" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded-md bg-muted/40" />
              <div className="h-3 w-5/6 rounded-md bg-muted/40" />
              <div className="h-3 w-4/6 rounded-md bg-muted/40" />
              <div className="h-3 w-3/6 rounded-md bg-muted/40" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 md:col-span-2">
          <h2 className="text-sm font-semibold mb-1">
            Welcome{state.me?.displayName ? `, ${state.me.displayName}` : ""}
          </h2>
          <p className="text-sm text-muted-foreground">
            This overview pulls live data from your account and workspace APIs.
          </p>
          {state.settings?.supportEmail && (
            <p className="mt-3 text-xs text-muted-foreground">
              Need help? Contact{" "}
              <span className="font-medium text-foreground">
                {state.settings.supportEmail}
              </span>
              .
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            At a glance
          </h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Unread notifications</dt>
              <dd className="font-semibold">
                {unreadNotifications.length}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Devices</dt>
              <dd className="font-semibold">{state.devices.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Sessions</dt>
              <dd className="font-semibold">{state.sessions.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Regions</dt>
              <dd className="font-semibold">
                {state.settings?.allowedRegions?.length ?? 0}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 md:col-span-2">
          <header className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Account summary</h3>
          </header>
          <div className="grid gap-3 md:grid-cols-2">
            <article className="rounded-lg border border-border/70 bg-background/40 p-3">
              <h4 className="text-xs font-semibold">Identity</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                {state.me?.email ?? "No email on file"}
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                Roles: {state.me?.roles?.join(", ") || "none"}
              </p>
            </article>
            <article className="rounded-lg border border-border/70 bg-background/40 p-3">
              <h4 className="text-xs font-semibold">Workspace settings</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Support email: {state.settings?.supportEmail ?? "Not configured"}
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                Allowed regions: {state.settings?.allowedRegions?.join(", ") || "none"}
              </p>
            </article>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <header className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Recent notifications</h3>
          </header>
          {state.notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {state.notifications.slice(0, 4).map((n) => (
                <li
                  key={n.id}
                  className="rounded-md bg-background/40 px-3 py-2 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{n.title}</span>
                    {!n.read && (
                      <span className="ml-2 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {n.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

