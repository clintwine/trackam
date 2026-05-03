import { useEffect, useState } from "react";
import { fetchEvents, type EventItem } from "@/services/admin.api";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchEvents();
        if (!active) return;
        setEvents(data);
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
        <h2 className="text-base font-semibold">Events</h2>
        <p className="text-sm text-muted-foreground">
          Recent system events and audit log entries.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-4 text-sm text-muted-foreground">
          No events have been recorded yet.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-background/60">
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {events.map((evt) => (
                <tr
                  key={evt.id}
                  className="border-t border-border/60 hover:bg-muted/40 transition-colors"
                >
                  <td className="px-4 py-2 align-top">
                    <span className="text-xs font-medium">{evt.type}</span>
                  </td>
                  <td className="px-4 py-2 align-top text-xs text-muted-foreground">
                    {evt.createdAt
                      ? new Date(evt.createdAt).toLocaleString()
                      : "Unknown"}
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

