"use client"

import { Suspense } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { useSiteConfig } from "@/hooks/use-site-config"
import { getCtaCopy, siteConfig, type SiteConfig } from "@/lib/site-config"
import { cn } from "@/lib/utils"

interface CtaGroupProps {
  variant?: "both" | "primary"
  size?: "default" | "lg" | "sm"
  className?: string
}

/** Pure presentational render — no hooks, so it can serve as both the real output and the Suspense fallback. */
function CtaGroupView({ config, variant = "both", size = "lg", className }: CtaGroupProps & { config: SiteConfig }) {
  const copy = getCtaCopy(config.ctaVariant)
  const primaryHref = config.ctaVariant === "trial" ? "/pricing" : config.demoBookingUrl
  const secondaryHref = config.ctaVariant === "trial" ? config.demoBookingUrl : "/pricing"

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <Button asChild size={size}>
        <Link href={primaryHref}>{copy.primary}</Link>
      </Button>
      {variant === "both" && (
        <Button asChild size={size} variant="outline">
          <Link href={secondaryHref}>{copy.secondary}</Link>
        </Button>
      )}
    </div>
  )
}

function CtaGroupLive(props: CtaGroupProps) {
  const config = useSiteConfig()
  return <CtaGroupView config={config} {...props} />
}

/**
 * Renders instantly server-side using the default siteConfig — real
 * visitors, crawlers, and link-preview bots see full content immediately.
 * The ?cta=/?prices=/?currency= URL overrides (used for internal review of
 * unreleased copy variants) still apply, but only kick in client-side after
 * hydration, inside this component's own tightly-scoped Suspense boundary —
 * they never block the rest of the page from rendering.
 */
export function CtaGroup(props: CtaGroupProps) {
  return (
    <Suspense fallback={<CtaGroupView config={siteConfig} {...props} />}>
      <CtaGroupLive {...props} />
    </Suspense>
  )
}
