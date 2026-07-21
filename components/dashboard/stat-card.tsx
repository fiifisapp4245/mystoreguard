import { TrendingDown, TrendingUp } from "lucide-react"

import { Card, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface StatTrend {
  value: number
  direction: "up" | "down"
  /** Whether this direction is good news for the business — expenses going up is "negative" even though the number rises. */
  tone: "positive" | "negative"
}

export function StatCard({
  label,
  value,
  trend,
  className,
}: {
  label: string
  value: string
  trend?: StatTrend
  className?: string
}) {
  const TrendIcon = trend?.direction === "up" ? TrendingUp : TrendingDown
  const trendClass =
    trend?.tone === "positive"
      ? "bg-success/15 text-success"
      : "bg-destructive/15 text-destructive"

  return (
    <Card className={cn("gap-3 py-5", className)}>
      <CardHeader className="gap-1.5 px-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold">{value}</span>
          {trend && (
            <span
              className={cn(
                "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
                trendClass
              )}
            >
              <TrendIcon className="size-3" />
              {trend.value}%
            </span>
          )}
        </div>
      </CardHeader>
    </Card>
  )
}
