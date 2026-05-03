import { Badge } from "@/components/ui/badge";

export type ActivityTimelineItem = {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  tone?: "info" | "success" | "warning";
};

type ActivityTimelineProps = {
  items: ActivityTimelineItem[];
};

const toneClass = (tone?: ActivityTimelineItem["tone"]) => {
  if (tone === "success") {
    return "border-emerald-400/40 bg-emerald-400/10 text-emerald-200";
  }
  if (tone === "warning") {
    return "border-amber-400/40 bg-amber-400/10 text-amber-200";
  }
  return "border-border/60 bg-muted/30 text-muted-foreground";
};

export default function ActivityTimeline({ items }: ActivityTimelineProps) {
  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-5 text-xs text-muted-foreground">
        No recent activity recorded.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-3"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">{item.title}</span>
              {item.tone && (
                <Badge className={toneClass(item.tone)}>{item.tone}</Badge>
              )}
            </div>
            {item.description && (
              <p className="text-[11px] text-muted-foreground">
                {item.description}
              </p>
            )}
          </div>
          {item.timestamp && (
            <span className="text-[10px] text-muted-foreground">
              {item.timestamp}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
