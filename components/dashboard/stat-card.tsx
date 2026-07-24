import Link from "next/link"
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
  caption,
  footnote,
  href,
  className,
  labelExtra,
}: {
  label: string
  value: string
  trend?: StatTrend
  /** Small muted qualifier next to the label, e.g. "as of now". */
  caption?: string
  /** Small muted line under the value, e.g. "Across 14 customers" or "No sales yet". */
  footnote?: string
  /** Wraps the card in a link to the relevant module. */
  href?: string
  className?: string
  /** Optional small control rendered right after the label, e.g. a ConceptTooltip. */
  labelExtra?: React.ReactNode
}) {
  const TrendIcon = trend?.direction === "up" ? TrendingUp : TrendingDown
  const trendClass =
    trend?.tone === "positive"
      ? "bg-success/15 text-success"
      : "bg-destructive/15 text-destructive"

  const card = (
    <Card className={cn("h-full gap-3 py-5", href && "transition-colors hover:bg-accent/40", className)}>
      <CardHeader className="gap-1.5 px-5">
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-muted-foreground">{label}</p>
          {labelExtra}
          {caption && <span className="text-xs text-muted-foreground">· {caption}</span>}
        </div>
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
        {/* Always rendered (falls back to a non-breaking space) so every card
            in a row reserves the same number of lines and lands at an equal height. */}
        <p className="text-xs text-muted-foreground">{footnote || " "}</p>
      </CardHeader>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {card}
      </Link>
    )
  }

  return card
}
