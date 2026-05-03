import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ProjectMiniCardProps = {
  title: string;
  stage: string;
  ctaLabel: string;
  ctaHref: string;
};

export default function ProjectMiniCard({
  title,
  stage,
  ctaLabel,
  ctaHref,
}: ProjectMiniCardProps) {
  return (
    <Card className="border-border/60 bg-background/40">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">{title}</p>
          <Badge className="border-border/60 bg-muted/30 text-muted-foreground">
            {stage}
          </Badge>
        </div>
        <Button asChild size="sm" variant="secondary">
          <Link to={ctaHref}>{ctaLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
