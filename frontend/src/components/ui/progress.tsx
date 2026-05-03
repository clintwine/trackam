import * as React from "react";
import { cn } from "@/lib/utils";

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number;
};

export function Progress({ value = 0, className, ...props }: ProgressProps) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-muted/40",
        className
      )}
      {...props}
    >
      <div
        className="h-full rounded-full bg-primary/70 transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
