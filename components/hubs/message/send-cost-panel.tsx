import { AlertTriangle } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { formatGHS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

/**
 * The one place cost is shown before anything sends — recipient count,
 * segments per message, total cost, and remaining credit after. Always
 * rendered once recipients + a body are non-empty; never hidden behind a
 * confirmation step.
 */
export function SendCostPanel({
  recipientCount,
  segmentsPerMessage,
  totalCostGHS,
  creditBalanceAfter,
  insufficient,
  consentExcluded,
  consentTotal,
  className,
}: {
  recipientCount: number
  segmentsPerMessage: number
  totalCostGHS: number
  creditBalanceAfter: number
  insufficient: boolean
  /** Recipients excluded for lack of marketing consent — omit when the guard doesn't apply to this scope. */
  consentExcluded?: number
  consentTotal?: number
  className?: string
}) {
  return (
    <Card className={cn("gap-3 py-4", insufficient && "ring-destructive/40", className)}>
      <CardContent className="flex flex-col gap-3 px-4">
        {typeof consentExcluded === "number" && consentExcluded > 0 && consentTotal !== undefined && (
          <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="size-3.5 shrink-0" />
            {consentExcluded} of {consentTotal} recipients excluded (no marketing consent)
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Recipients" value={String(recipientCount)} />
          <Stat label="Segments / message" value={String(segmentsPerMessage)} />
          <Stat label="Total cost" value={formatGHS(totalCostGHS)} />
          <Stat label="Credit after send" value={creditBalanceAfter.toLocaleString()} tone={insufficient ? "danger" : undefined} />
        </div>
        {insufficient && (
          <p className="text-xs font-medium text-destructive">
            Insufficient SMS credits for this send — top up before sending.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "danger" }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-semibold", tone === "danger" && "text-destructive")}>{value}</p>
    </div>
  )
}
