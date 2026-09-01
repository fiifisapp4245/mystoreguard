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
  published: "success",
  live: "success",
  won: "success",
  pending: "warning",
  new: "warning",
  processing: "warning",
  "ready for fulfilment": "warning",
  "ready for collection": "warning",
  "ready to publish": "warning",
  "awaiting payment": "warning",
  "pay on delivery": "warning",
  "setup in progress": "warning",
  "ending soon": "warning",
  paused: "warning",
  "not started": "neutral",
  unpublished: "neutral",
  "buy now": "neutral",
  auction: "neutral",
  refunded: "neutral",
  "no bids": "neutral",
  "reserve not met": "danger",
  "on hold": "warning",
  "partially paid": "warning",
  ordered: "warning",
  "in transit": "warning",
  "in progress": "warning",
  assigned: "warning",
  "out for delivery": "warning",
  draft: "neutral",
  sent: "neutral",
  scheduled: "neutral",
  inactive: "neutral",
  cancelled: "neutral",
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
