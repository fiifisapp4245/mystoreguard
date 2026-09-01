"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2, Circle, ExternalLink } from "lucide-react"

import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { storeUrl, storefrontPath, type OnlineStore, type SetupStepState, type StoreStatus } from "@/lib/online-store-data"
import { cn } from "@/lib/utils"

/**
 * "Your store is 60% ready" — visibility of system status, in one place so
 * Overview, Setup and Settings all say exactly the same thing.
 *
 * The bar reuses the Dashboard's existing meter pattern (a muted track with
 * a primary fill) rather than introducing a progress component.
 */
export function SetupProgressCard({
  steps,
  progress,
  status,
  onContinue,
  continueHref,
}: {
  steps: SetupStepState[]
  progress: { done: number; total: number; percent: number }
  status: StoreStatus
  onContinue?: () => void
  continueHref?: string
}) {
  const ready = progress.done === progress.total

  return (
    <Card className="gap-4 py-5">
      <CardHeader className="px-5">
        <CardTitle className="font-sans">
          {ready ? "Your store is ready to publish" : `Your store is ${progress.percent}% ready`}
        </CardTitle>
        <CardDescription>
          {ready
            ? "Everything a customer needs is in place. Publish when you're ready to take orders."
            : `${progress.done} of ${progress.total} steps done. Customers can't buy until all of them are.`}
        </CardDescription>
        <CardAction>
          <StatusBadge label={status} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percent}%` }} />
        </div>

        <ul className="flex flex-col gap-2">
          {steps.map((step) => (
            <li key={step.id} className="flex items-start gap-2.5 text-sm">
              {step.done ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <div className="flex flex-col">
                <span className={cn(step.done ? "text-muted-foreground" : "font-medium")}>{step.label}</span>
                {step.outstanding && <span className="text-xs text-muted-foreground">{step.outstanding}</span>}
              </div>
            </li>
          ))}
        </ul>

        <div>
          {continueHref ? (
            <Button asChild>
              <Link href={continueHref}>
                {ready ? "Review and publish" : "Continue setup"}
                <ArrowRight />
              </Link>
            </Button>
          ) : (
            <Button onClick={onContinue}>
              {ready ? "Review and publish" : "Continue setup"}
              <ArrowRight />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/** The live store's address, with a link that opens the real storefront. */
export function StoreAddressLine({ store, className }: { store: OnlineStore; className?: string }) {
  if (!store.info.slug) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-2 text-sm", className)}>
      <span className="text-muted-foreground">Store address</span>
      <Link
        href={storefrontPath(store.info.slug)}
        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
      >
        {storeUrl(store.info.slug)}
        <ExternalLink className="size-3.5" />
      </Link>
    </div>
  )
}
