import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "success"
  | "warn";

const badgeVariants: Record<BadgeVariant, string> = {
  default:
    "border-border bg-background/60 text-muted-foreground",
  secondary: "border-border bg-muted/60 text-muted-foreground",
  outline: "border-border bg-transparent text-muted-foreground",
  destructive: "border-destructive/40 bg-destructive/10 text-destructive-foreground",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
  warn: "border-amber-500/40 bg-amber-500/10 text-amber-600",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}
