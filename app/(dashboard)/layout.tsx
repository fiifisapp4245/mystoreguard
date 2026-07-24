import { Suspense } from "react"

import { PageContentSkeleton } from "@/components/dashboard/page-content-skeleton"
import { Shell } from "@/components/shell"
import { Toaster } from "@/components/ui/sonner"

/**
 * Shell's own chrome (sidebar, header, demo controls) no longer needs any
 * Suspense at this level — each piece owns its own tight boundary
 * internally (see components/shell.tsx) and renders real content
 * immediately. {children} still needs one here: every dashboard page reads
 * demo-state query params at its own top level, and Next.js requires a
 * Suspense ancestor for that (hard build error otherwise, not just a
 * runtime warning — verified against this exact codebase). A real skeleton
 * fallback, not `null`, is the difference between "blank white screen" and
 * "visibly loading" — see ID-01 in the July 2026 QA audit.
 */
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Shell>
        <Suspense fallback={<PageContentSkeleton />}>{children}</Suspense>
      </Shell>
      <Toaster />
    </>
  )
}
