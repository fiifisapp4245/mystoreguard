import { cn } from "@/lib/utils"

/**
 * The single width/padding authority for every dashboard-area page. A hard
 * max-width (not a percentage) so content stays a readable column on large
 * monitors instead of stretching edge to edge.
 */
export function ContentContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1400px] px-6 lg:px-8", className)}>
      {children}
    </div>
  )
}
