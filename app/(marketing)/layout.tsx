import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

/**
 * No Suspense boundary here on purpose. SiteHeader and SiteFooter don't read
 * search params themselves — only CtaGroup and PricingTiers (nested inside
 * page content) do, and each of those now wraps its own tightly-scoped
 * Suspense boundary with a real, server-rendered fallback (see
 * components/cta-group.tsx). Wrapping the whole layout used to force every
 * page to bail out to client-only rendering — see ID-01 in the July 2026 QA
 * audit — because the fallback was `null` and the boundary enclosed
 * `{children}` too.
 */
export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
