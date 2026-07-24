"use client"

import { Suspense, useId, useState } from "react"
import Link from "next/link"
import { Check } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useSiteConfig } from "@/hooks/use-site-config"
import { dashboardTierPath, siteConfig, type SiteConfig } from "@/lib/site-config"
import {
  ANNUAL_MONTHS_FREE,
  TIERS,
  annualPrice,
  formatPrice,
} from "@/lib/pricing"
import { cn } from "@/lib/utils"

function PricingTiersView({ config, teaser = false }: { config: SiteConfig; teaser?: boolean }) {
  const [annual, setAnnual] = useState(false)
  const toggleId = useId()

  return (
    <div className="flex flex-col gap-8">
      {!teaser && (
        <div className="flex items-center justify-center gap-3">
          <span
            className={cn("cursor-pointer text-sm", !annual && "font-medium text-foreground")}
            onClick={() => config.showPrices && setAnnual(false)}
          >
            Monthly
          </span>
          <Switch
            id={toggleId}
            checked={annual}
            onCheckedChange={setAnnual}
            disabled={!config.showPrices}
            aria-label={`Billing period: ${annual ? "Annual" : "Monthly"}`}
          />
          <span
            className={cn("cursor-pointer text-sm", annual && "font-medium text-foreground")}
            onClick={() => config.showPrices && setAnnual(true)}
          >
            Annual{" "}
            <span className="text-muted-foreground">
              ({ANNUAL_MONTHS_FREE} months free)
            </span>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {TIERS.map((tier) => {
          const isPopular = tier.id === "prime"
          const price = annual
            ? annualPrice(tier.monthlyPrice)
            : tier.monthlyPrice
          const priceLabel = formatPrice(price, config.currency)

          return (
            <div key={tier.id} className="relative">
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                  Most popular
                </Badge>
              )}
              <Card
                className={cn(
                  "flex flex-col gap-4",
                  isPopular && "border-primary shadow-md"
                )}
              >
                <CardHeader className="gap-2">
                  <h3 className="font-heading text-xl font-medium">
                    {tier.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tier.summary}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  {config.showPrices ? (
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-3xl font-semibold">
                        {priceLabel}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /{annual ? "year" : "month"}
                      </span>
                    </div>
                  ) : (
                    <p className="font-heading text-xl font-medium">
                      Talk to us for pricing
                    </p>
                  )}

                  {config.currency === "GHS" && config.showPrices && (
                    <p className="text-xs text-muted-foreground">
                      Illustrative conversion — confirm the live exchange rate before quoting.
                    </p>
                  )}

                  {!teaser && (
                    <p className="text-sm text-muted-foreground">
                      {tier.seats} · {tier.locations}
                    </p>
                  )}

                  {!teaser && (
                    <ul className="flex flex-col gap-2 text-sm">
                      {tier.headlineInclusions.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <Check
                            className="mt-0.5 size-4 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  {teaser ? (
                    <Button
                      asChild
                      className="w-full"
                      variant={isPopular ? "default" : "outline"}
                    >
                      <Link href="/pricing">See all features</Link>
                    </Button>
                  ) : tier.id === "ultra" ? (
                    <Button
                      asChild
                      className="w-full"
                      variant={isPopular ? "default" : "outline"}
                    >
                      <a href={config.demoBookingUrl}>Talk to us</a>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="w-full"
                      variant={isPopular ? "default" : "outline"}
                    >
                      <Link href={dashboardTierPath(tier.id)}>Start free</Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          )
        })}
      </div>

      {teaser && (
        <p className="text-center text-sm text-muted-foreground">
          Free first month on every tier. Book a demo if you&apos;d rather talk it through first.
        </p>
      )}
    </div>
  )
}

function PricingTiersLive(props: { teaser?: boolean }) {
  const config = useSiteConfig()
  return <PricingTiersView config={config} {...props} />
}

/** Same instant-SSR-with-client-side-override pattern as CtaGroup — see that file for the full rationale. */
export function PricingTiers(props: { teaser?: boolean }) {
  return (
    <Suspense fallback={<PricingTiersView config={siteConfig} {...props} />}>
      <PricingTiersLive {...props} />
    </Suspense>
  )
}
