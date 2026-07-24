import { Skeleton } from "@/components/ui/skeleton"

/**
 * The Suspense fallback for dashboard page content (see
 * app/(dashboard)/layout.tsx). Every dashboard page reads the demo-state
 * query params (role, tier, persona, ...) at its own top level, which
 * requires this boundary to exist — Next.js hard-errors the build
 * ("useSearchParams() should be wrapped in a suspense boundary") otherwise.
 * This means page CONTENT still resolves client-side rather than fully
 * server-rendering; a real skeleton here is the honest, achievable fix for
 * the "blank white screen" complaint (ID-01) — the sidebar and header
 * render immediately regardless (see components/shell.tsx), and this
 * shows structure instead of nothing while the page body hydrates.
 */
export function PageContentSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  )
}
