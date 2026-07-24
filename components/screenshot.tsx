import { ImageIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const ASPECTS = {
  wide: "aspect-[16/10]",
  standard: "aspect-[4/3]",
} as const

/**
 * A real screenshot's reserved slot. Deliberately quiet — a soft card with
 * a small centered label, not a large dashed box — so an empty slot reads
 * as "not ready yet" rather than dominating the section it sits in. Keeps
 * the same aspect-ratio footprint a real image will use, so nothing
 * reflows when one is dropped in later.
 */
export function Screenshot({
  name,
  aspect = "wide",
  className,
}: {
  /** Exact filename to capture into /public/screenshots/ — see SCREENSHOTS.md. */
  name: string
  aspect?: keyof typeof ASPECTS
  className?: string
}) {
  return (
    <div
      data-screenshot={name}
      className={cn(
        "flex w-full items-center justify-center rounded-xl border border-border/50 bg-muted/20",
        ASPECTS[aspect],
        className
      )}
    >
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground">
        <ImageIcon className="size-3 text-muted-foreground/60" aria-hidden="true" />
        {name}
      </span>
    </div>
  )
}
