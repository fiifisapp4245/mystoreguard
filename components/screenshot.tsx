import { ImageIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const ASPECTS = {
  wide: "aspect-[16/10]",
  standard: "aspect-[4/3]",
} as const

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
        "flex w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/40",
        ASPECTS[aspect],
        className
      )}
    >
      <div className="flex flex-col items-center gap-2 px-4 text-center">
        <ImageIcon className="size-6 text-muted-foreground/50" aria-hidden="true" />
        <p className="font-mono text-xs text-muted-foreground">
          Screenshot placeholder — <span className="text-foreground">{name}</span>
        </p>
      </div>
    </div>
  )
}
