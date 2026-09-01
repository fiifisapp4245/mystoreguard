"use client"

import Link from "next/link"
import { ChevronRight, Globe } from "lucide-react"

import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useOnlineStore, useStoreLink } from "@/hooks/use-online-store"
import { formatGHS } from "@/lib/mock-data"
import { publishedCount } from "@/lib/online-listings-data"
import {
  awaitingPaymentCount,
  onlineRevenue,
  pendingFulfilmentCount,
} from "@/lib/online-orders-data"

/**
 * How a merchant discovers the online store from where they already are.
 *
 * It changes with the store's state rather than nagging: an invitation
 * before they've started, a progress nudge mid-setup, and a compact summary
 * once it's live. One card either way — the Dashboard belongs to the whole
 * business, not to one channel.
 */
export function OnlineStoreCard() {
  const { persona, store, progress, status } = useOnlineStore()
  const link = useStoreLink()

  const live = store.publishState === "published"
  const started = progress.done > 0

  if (!started) {
    return (
      <Card className="gap-3 py-5">
        <CardHeader className="px-5">
          <CardTitle className="flex items-center gap-2 font-sans">
            <Globe className="size-4 text-primary" />
            Sell online too
          </CardTitle>
          <CardDescription>
            Put the products you already stock in front of customers who aren&apos;t in the shop. One catalogue,
            one stock count, nothing typed twice.
          </CardDescription>
          <CardAction>
            <Button asChild>
              <Link href={link("/online-store/setup")}>Set up your online store</Link>
            </Button>
          </CardAction>
        </CardHeader>
      </Card>
    )
  }

  if (!live) {
    return (
      <Card className="gap-3 py-5">
        <CardHeader className="px-5">
          <CardTitle className="flex items-center gap-2 font-sans">
            <Globe className="size-4 text-primary" />
            Your online store is {progress.percent}% ready
          </CardTitle>
          <CardDescription>
            {progress.done} of {progress.total} steps done. Customers can&apos;t buy until all of them are.
          </CardDescription>
          <CardAction>
            <div className="flex items-center gap-2">
              <StatusBadge label={status} />
              <Button asChild variant="outline">
                <Link href={link("/online-store/setup")}>Continue setup</Link>
              </Button>
            </div>
          </CardAction>
        </CardHeader>
      </Card>
    )
  }

  const waiting = awaitingPaymentCount(persona) + pendingFulfilmentCount(persona)

  return (
    <Card className="gap-3 py-5">
      <CardHeader className="px-5">
        <CardTitle className="flex items-center gap-2 font-sans">
          <Globe className="size-4 text-primary" />
          Online store
        </CardTitle>
        <CardDescription>{store.info.name} is taking orders online.</CardDescription>
        <CardAction>
          <div className="flex items-center gap-2">
            <StatusBadge label="Published" />
            <Button asChild variant="ghost" size="sm">
              <Link href={link("/online-store/online-overview")}>
                Open
                <ChevronRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 px-5 sm:grid-cols-3">
        <Fact label="Products online" value={String(publishedCount(persona))} />
        <Fact label="Online revenue this month" value={formatGHS(onlineRevenue(persona))} />
        <Fact
          label="Waiting on you"
          value={waiting === 0 ? "Nothing" : `${waiting} ${waiting === 1 ? "order" : "orders"}`}
        />
      </CardContent>
    </Card>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}
