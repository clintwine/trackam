import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ServiceRecommendationCardProps = {
  title: string;
  reason: string;
  ctaLabel: string;
  ctaHref: string;
};

export default function ServiceRecommendationCard({
  title,
  reason,
  ctaLabel,
  ctaHref,
}: ServiceRecommendationCardProps) {
  return (
    <Card className="border-border/70 bg-background/40">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">{title}</p>
          <Badge className="border-border/60 bg-muted/30 text-muted-foreground">
            Recommended
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{reason}</p>
        <Button asChild size="sm" variant="secondary">
          <Link to={ctaHref}>{ctaLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
