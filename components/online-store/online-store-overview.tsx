"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronRight, ExternalLink, Eye, Gavel, Globe, Pause, Play, ShoppingBag, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { LiveResultCount } from "@/components/dashboard/live-result-count"
import { PeriodSelect } from "@/components/dashboard/period-select"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { TeachingEmptyState } from "@/components/dashboard/teaching-empty-state"
import { SetupProgressCard, StoreAddressLine } from "@/components/online-store/store-status-card"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useOnlineStore, useStoreLink } from "@/hooks/use-online-store"
import {
  formatDateDisplay,
  getStandardPeriodRange,
  isDateInRange,
  TODAY_ISO,
  type StandardPeriod,
} from "@/lib/period-utils"
import { formatGHS } from "@/lib/mock-data"
import {
  auctionState,
  bidCount,
  highestBid,
  isAwaitingConversion,
  timeRemainingLabel,
} from "@/lib/online-auctions-data"
import {
  availabilityOf,
  hasAuction,
  listingRows,
  productsForPersona,
  publishedCount,
} from "@/lib/online-listings-data"
import {
  awaitingPaymentCount,
  getOnlineOrders,
  onlineRevenue,
  orderCount,
} from "@/lib/online-orders-data"
import { pauseStore, resumeStore, storefrontPath } from "@/lib/online-store-data"


export function OnlineStoreOverview() {
  const { persona, store, steps, status, progress, refresh } = useOnlineStore()
  const link = useStoreLink()
  const [period, setPeriod] = useState<StandardPeriod>("month")

  const isLive = store.publishState === "published"
  const hasStarted = progress.done > 0

  const range = useMemo(() => getStandardPeriodRange(period), [period])
  const inPeriod = useMemo(() => (iso: string) => isDateInRange(iso, range), [range])

  // Read straight from the shared catalogue on each render — these lists are
  // small, and memoising them against a mutable module store would just make
  // them stale after a publish or a stock movement.
  const rows = listingRows(persona, { publishedOnly: true })
  const catalogueSize = productsForPersona(persona).filter((p) => p.isActive).length

  const orders = getOnlineOrders(persona)
  const recentOrders = orders.slice(0, 5)

  const auctions = rows.filter((row) => hasAuction(row.listing))
  const liveAuctions = auctions.filter((row) => {
    const state = auctionState(persona, row.product.id, row.listing.auction!)
    return state === "Live" || state === "Ending soon"
  })

  const attention = (() => {
    const items: { id: string; line: string; detail: string; href: string }[] = []

    const awaitingPayment = awaitingPaymentCount(persona)
    if (awaitingPayment > 0) {
      items.push({
        id: "awaiting-payment",
        line: "Orders waiting for payment to be confirmed",
        detail: String(awaitingPayment),
        href: link("/online-store/online-orders"),
      })
    }

    const toPack = orders.filter((o) => o.status === "New" && o.paymentStatus !== "Awaiting payment").length
    if (toPack > 0) {
      items.push({ id: "to-pack", line: "Paid orders not started yet", detail: String(toPack), href: "/online-store/online-orders" })
    }

    const packed = orders.filter((o) => o.status === "Ready for fulfilment").length
    if (packed > 0) {
      items.push({
        id: "packed",
        line: "Packed orders waiting to go out",
        detail: String(packed),
        href: link("/online-store/online-orders"),
      })
    }

    const wonNotConverted = auctions.filter((row) =>
      isAwaitingConversion(persona, row.product.id, row.listing.auction!)
    ).length
    if (wonNotConverted > 0) {
      items.push({
        id: "won-auctions",
        line: "Auctions won but not yet turned into an order",
        detail: String(wonNotConverted),
        href: link("/online-store/online-bidding"),
      })
    }

    const endingSoon = auctions.filter(
      (row) => auctionState(persona, row.product.id, row.listing.auction!) === "Ending soon"
    ).length
    if (endingSoon > 0) {
      items.push({
        id: "ending-soon",
        line: "Auctions closing in the next few hours",
        detail: String(endingSoon),
        href: link("/online-store/online-bidding"),
      })
    }

    const outOfStock = rows.filter((row) => availabilityOf(row.listing, row.product) === "Out of stock").length
    if (outOfStock > 0) {
      items.push({
        id: "out-of-stock",
        line: "Products online that customers can't buy — no stock left",
        detail: String(outOfStock),
        href: link("/online-store/online-products"),
      })
    }

    return items
  })()

  function handlePause() {
    pauseStore(persona)
    refresh()
    toast.success("Store paused", { description: "Customers see a note that you're not taking orders right now." })
  }

  function handleResume() {
    resumeStore(persona)
    refresh()
    toast.success("Store is live again", { description: "Customers can place orders." })
  }

  // ---------------------------------------------------------------------
  // Not live yet — the activation experience, not a dashboard of zeroes
  // ---------------------------------------------------------------------
  if (!isLive) {
    return (
      <div className="flex flex-col gap-6">
        {!hasStarted && (
          <Card className="gap-4 py-5">
            <CardHeader className="px-5">
              <CardTitle className="flex items-center gap-2 font-sans">
                <Globe className="size-4 text-primary" />
                Sell online, using the products you already have
              </CardTitle>
              <CardDescription>
                Your online store shares one catalogue and one stock count with the shop. Sell a tin at the
                counter and it comes off the website too — you never count anything twice.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { title: "Nothing to retype", body: "Pick products from the catalogue you've already built." },
                  { title: "One stock number", body: "Counter sales and online orders draw on the same shelf." },
                  { title: "Same deliveries", body: "Online orders go out with the riders you already use." },
                ].map((point) => (
                  <div key={point.title} className="rounded-lg border p-3">
                    <p className="text-sm font-medium">{point.title}</p>
                    <p className="text-xs text-muted-foreground">{point.body}</p>
                  </div>
                ))}
              </div>
              <div>
                <Button asChild>
                  <Link href={link("/online-store/setup")}>
                    <Sparkles />
                    Set up your online store
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {hasStarted && (
          <SetupProgressCard steps={steps} progress={progress} status={status} continueHref={link("/online-store/setup")} />
        )}

        {store.publishState === "paused" && (
          <Card className="gap-3 py-5">
            <CardHeader className="px-5">
              <CardTitle className="font-sans">Your store is paused</CardTitle>
              <CardDescription>
                Customers can still see it, but they can&apos;t place orders until you turn it back on.
              </CardDescription>
              <CardAction>
                <Button onClick={handleResume}>
                  <Play />
                  Take orders again
                </Button>
              </CardAction>
            </CardHeader>
          </Card>
        )}

        {store.info.slug && (
          <Card className="gap-3 py-5">
            <CardHeader className="px-5">
              <CardTitle className="font-sans">Preview</CardTitle>
              <CardDescription>See exactly what a customer would see, before anyone else can.</CardDescription>
              <CardAction>
                <Button asChild variant="outline">
                  <Link href={link(storefrontPath(store.info.slug))}>
                    <Eye />
                    Preview store
                  </Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="px-5">
              <StoreAddressLine store={store} />
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // ---------------------------------------------------------------------
  // Live — the operating dashboard
  // ---------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StoreAddressLine store={store} />
        <div className="flex items-center gap-2">
          <PeriodSelect value={period} onValueChange={setPeriod} />
          <Button asChild variant="outline">
            <Link href={link(storefrontPath(store.info.slug))}>
              <ExternalLink />
              View store
            </Link>
          </Button>
          <Button variant="outline" onClick={handlePause}>
            <Pause />
            Pause store
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Store status"
          value="Live"
          caption="as of now"
          footnote={store.publishedOnISO ? `Taking orders since ${formatDateDisplay(store.publishedOnISO)}` : undefined}
        />
        <StatCard
          label="Products online"
          value={String(publishedCount(persona))}
          caption="as of now"
          footnote={`of ${catalogueSize} in your catalogue`}
          href={link("/online-store/online-products")}
        />
        <StatCard
          label="Online orders"
          value={String(orderCount(persona, inPeriod))}
          footnote={
            awaitingPaymentCount(persona) > 0
              ? `${awaitingPaymentCount(persona)} waiting for payment`
              : "All payments confirmed"
          }
          href={link("/online-store/online-orders")}
        />
        <StatCard
          label="Online revenue"
          value={formatGHS(onlineRevenue(persona, inPeriod))}
          footnote="Money actually collected"
          href={link("/online-store/online-orders")}
        />
      </div>

      <Card className="gap-4 py-5">
        <CardHeader className="px-5">
          <CardTitle className="font-sans">Needs attention</CardTitle>
          <CardDescription>Orders and auctions that can&apos;t move without you.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col divide-y px-0">
          {attention.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-accent/40"
            >
              <span className="flex-1">{item.line}</span>
              <span className="font-medium text-muted-foreground tabular-nums">{item.detail}</span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
          {attention.length === 0 && (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              Nothing waiting on you. New orders and closing auctions will show up here.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-sans">Recent orders</CardTitle>
            <CardDescription>The latest orders customers placed themselves.</CardDescription>
            <CardAction>
              <Link
                href={link("/online-store/online-orders")}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View all
                <ChevronRight className="size-3.5" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {recentOrders.length === 0 ? (
              <TeachingEmptyState
                icon={ShoppingBag}
                message="Orders customers place on your store land here, ready to be paid for, packed and sent out."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium whitespace-nowrap">{order.id}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.customerName}</TableCell>
                      <TableCell>{formatGHS(order.total)}</TableCell>
                      <TableCell>
                        <StatusBadge label={order.paymentStatus} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge label={order.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <LiveResultCount count={recentOrders.length} itemLabel="order" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Live auctions</CardTitle>
            <CardDescription>Bidding open right now.</CardDescription>
            <CardAction>
              <Link
                href={link("/online-store/online-bidding")}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Manage
                <ChevronRight className="size-3.5" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {liveAuctions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No auctions running. Any product can be put up for bidding from Products online.
              </p>
            )}
            {liveAuctions.map((row) => {
              const leading = highestBid(persona, row.product.id)
              return (
                <div key={row.product.id} className="flex flex-col gap-1 rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{row.product.name}</span>
                    <StatusBadge label={auctionState(persona, row.product.id, row.listing.auction!)} />
                  </div>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold">
                      {formatGHS(leading?.amount ?? row.listing.auction!.startingPrice)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {bidCount(persona, row.product.id)} bids · ends in {timeRemainingLabel(row.listing.auction!)}
                    </span>
                  </div>
                </div>
              )
            })}
            {liveAuctions.length === 0 && (
              <Button asChild variant="outline" size="sm" className="self-start">
                <Link href={link("/online-store/online-products")}>
                  <Gavel />
                  Set up an auction
                  <ArrowRight />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Figures cover {period === "today" ? "today" : period === "week" ? "the last 7 days" : "this month"}, to{" "}
        {formatDateDisplay(TODAY_ISO)}.
      </p>
    </div>
  )
}
