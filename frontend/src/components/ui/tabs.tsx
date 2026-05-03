import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

type TabsProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
} & React.HTMLAttributes<HTMLDivElement>;

function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  ...props
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(
    defaultValue || ""
  );
  const isControlled = typeof value === "string";
  const currentValue = isControlled ? value : internalValue;
  const handleChange = React.useCallback(
    (next: string) => {
      if (!isControlled) {
        setInternalValue(next);
      }
      onValueChange?.(next);
    },
    [isControlled, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleChange }}>
      <div className={cn("space-y-3", className)} {...props} />
    </TabsContext.Provider>
  );
}

type TabsListProps = React.HTMLAttributes<HTMLDivElement>;

function TabsList({ className, ...props }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex w-full flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/40 p-1 text-xs",
        className
      )}
      {...props}
    />
  );
}

type TabsTriggerProps = {
  value: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function TabsTrigger({ className, value, ...props }: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) {
    throw new Error("TabsTrigger must be used within Tabs");
  }
  const active = ctx.value === value;
  return (
    <button
      type="button"
      className={cn(
        "rounded-md px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground",
        active && "bg-card text-foreground shadow-sm",
        className
      )}
      onClick={() => ctx.onValueChange(value)}
      {...props}
    />
  );
}

type TabsContentProps = {
  value: string;
} & React.HTMLAttributes<HTMLDivElement>;

function TabsContent({ className, value, ...props }: TabsContentProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx || ctx.value !== value) return null;
  return <div className={cn("space-y-3", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
