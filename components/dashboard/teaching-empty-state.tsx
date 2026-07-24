import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Replaces an apologetic empty state ("Nothing here yet") with an
 * instructive one: what this thing is, then the primary action. Used
 * wherever a screen can legitimately be empty on a new or quiet store.
 */
export function TeachingEmptyState({
  icon: Icon,
  message,
  actionLabel,
  onAction,
  actionHref,
  className,
}: {
  icon?: LucideIcon
  message: string
  actionLabel?: string
  onAction?: () => void
  actionHref?: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center", className)}>
      {Icon && <Icon className="size-8 text-muted-foreground" aria-hidden="true" />}
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {actionLabel && actionHref && (
        <Button asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
      {actionLabel && onAction && !actionHref && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  )
}
