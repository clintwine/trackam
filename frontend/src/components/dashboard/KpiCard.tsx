import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

type KpiCardProps = {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
};

export default function KpiCard({ label, value, hint, href }: KpiCardProps) {
  const content = (
    <Card className="h-full border-border/70 bg-card">
      <CardContent className="space-y-2 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="text-2xl font-semibold">{value}</div>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );

  if (!href) return content;

  return (
    <Link to={href} className="block hover:opacity-90 transition-opacity">
      {content}
    </Link>
  );
}
