type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={
        "animate-pulse rounded-md bg-muted/60 border border-border/40 " +
        className
      }
    />
  );
}

