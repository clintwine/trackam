import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type ActionQueueItem = {
  id: string;
  title: string;
  reason: string;
  severity: "Blocking" | "Action needed" | "FYI" | "Attention" | "Monitor";
  ctaLabel: string;
  ctaHref: string;
};

type ActionQueueProps = {
  items: ActionQueueItem[];
};

function severityClass(severity: ActionQueueItem["severity"]) {
  if (severity === "Blocking") {
    return "border-destructive/40 bg-destructive/10 text-destructive-foreground";
  }
  if (severity === "Action needed" || severity === "Attention") {
    return "border-amber-400/40 bg-amber-400/10 text-amber-200";
  }
  return "border-border/60 bg-muted/30 text-muted-foreground";
}

export default function ActionQueue({ items }: ActionQueueProps) {
  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-5 text-xs text-muted-foreground">
        No urgent items. Execution is moving smoothly.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-3"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">{item.title}</span>
              <Badge className={severityClass(item.severity)}>
                {item.severity}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">{item.reason}</p>
          </div>
          <Button asChild size="sm">
            <Link to={item.ctaHref}>{item.ctaLabel}</Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
