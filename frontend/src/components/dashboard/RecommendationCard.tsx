import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type RecommendationCardProps = {
  title: string;
  reason: string;
  ctaLabel: string;
  ctaHref: string;
};

export default function RecommendationCard({
  title,
  reason,
  ctaLabel,
  ctaHref,
}: RecommendationCardProps) {
  return (
    <Card className="border-border/70 bg-gradient-to-br from-background via-background to-muted/30">
      <CardContent className="space-y-3 p-5">
        <div className="space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{reason}</p>
        </div>
        <Button asChild>
          <Link to={ctaHref}>{ctaLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
