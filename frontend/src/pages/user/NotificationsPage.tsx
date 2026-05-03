import { useEffect, useState } from "react";
import {
  fetchNotifications,
  markNotificationsRead,
  type NotificationItem,
} from "@/services/dashboard.api";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchNotifications();
        if (!active) return;
        setNotifications(data);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleMarkAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (!unreadIds.length) return;
    await markNotificationsRead(unreadIds);
    setNotifications((prev) =>
      prev.map((n) => (unreadIds.includes(n.id) ? { ...n, read: true } : n))
    );
  }

  const loadingSkeleton = (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {Array.from({ length: 3 }).map((_, idx) => (
        <li
          key={idx}
          className="flex items-start gap-3 px-4 py-3 text-sm animate-pulse"
        >
          <div className="mt-1 h-2 w-2 rounded-full bg-muted/60" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-40 rounded-md bg-muted/60" />
            <div className="h-3 w-full rounded-md bg-muted/40" />
            <div className="h-2 w-24 rounded-md bg-muted/30" />
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            Recent updates about your account and workspace activity.
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          className="text-xs rounded-md border border-border bg-background px-3 py-1.5 text-foreground hover:bg-muted/60 disabled:opacity-60"
          disabled={notifications.every((n) => n.read)}
        >
          Mark all as read
        </button>
      </div>

      {loading
        ? loadingSkeleton
        : notifications.length === 0
        ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-4 text-sm text-muted-foreground">
            You don&apos;t have any notifications yet.
          </div>
          )
        : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {notifications.map((n) => (
              <li
                key={n.id}
                className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-muted/40 transition-colors"
              >
                <div
                  className="mt-1 h-2 w-2 rounded-full bg-primary/70"
                  hidden={n.read}
                />
                <div className="flex-1">
                  <div className="font-medium">{n.title}</div>
                  <div className="text-muted-foreground">{n.body}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          )}
    </div>
  );
}
