"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { useSiteConfig } from "@/hooks/use-site-config"
import { getCtaCopy } from "@/lib/site-config"
import { cn } from "@/lib/utils"

export function CtaGroup({
  variant = "both",
  size = "lg",
  className,
}: {
  variant?: "both" | "primary"
  size?: "default" | "lg" | "sm"
  className?: string
}) {
  const config = useSiteConfig()
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
