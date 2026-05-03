import * as React from "react";
import { cn } from "@/lib/utils";

type ScrollAreaProps = React.HTMLAttributes<HTMLDivElement>;

export function ScrollArea({ className, ...props }: ScrollAreaProps) {
  return (
    <div
      className={cn("h-full w-full overflow-auto", className)}
      {...props}
    />
  );
}
