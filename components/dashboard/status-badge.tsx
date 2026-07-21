import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type StatusTone = "success" | "warning" | "danger" | "neutral"

const TONE_BY_LABEL: Record<string, StatusTone> = {
  completed: "success",
  paid: "success",
  active: "success",
  "in stock": "success",
  received: "success",
  delivered: "success",
  accepted: "success",
  reconciled: "success",
  pending: "warning",
  "on hold": "warning",
  "partially paid": "warning",
  ordered: "warning",
  "in transit": "warning",
  "in progress": "warning",
  draft: "neutral",
  sent: "neutral",
  scheduled: "neutral",
  inactive: "neutral",
  "low stock": "danger",
  "out of stock": "danger",
  overdue: "danger",
  failed: "danger",
  expired: "danger",
  "discrepancy found": "danger",
}

const TONE_CLASSNAMES: Record<StatusTone, string> = {
  success: "border-transparent bg-success/15 text-success",
  warning:
    "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400",
  danger: "border-transparent bg-destructive/15 text-destructive",
  neutral: "border-transparent bg-muted text-muted-foreground",
}

export function StatusBadge({
  label,
  tone,
}: {
  label: string
  tone?: StatusTone
}) {
  const resolvedTone = tone ?? TONE_BY_LABEL[label.toLowerCase()] ?? "neutral"

  return (
    <Badge
      variant="outline"
      className={cn("font-normal", TONE_CLASSNAMES[resolvedTone])}
    >
      {label}
    </Badge>
  )
}
