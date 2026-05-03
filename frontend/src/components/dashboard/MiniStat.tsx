type MiniStatProps = {
  label: string;
  value: string | number;
};

export default function MiniStat({ label, value }: MiniStatProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
