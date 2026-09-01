"use client"

import Link from "next/link"

import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { StorePersona } from "@/hooks/use-demo-state"
import { useStoreLink } from "@/hooks/use-online-store"
import { formatGHS } from "@/lib/mock-data"
import {
  auctionState,
  bidsFor,
  currentBidAmount,
  formatDateTime,
  highestBid,
  minimumNextBid,
  timeRemainingLabel,
} from "@/lib/online-auctions-data"
import type { ListingRow } from "@/lib/online-listings-data"

/** One auction: where the price stands, who has bid, and what happens next. */
export function AuctionDetailSheet({
  row,
  persona,
  onOpenChange,
  onCreateOrder,
  onRelist,
  onEdit,
}: {
  row: ListingRow | null
  persona: StorePersona
  onOpenChange: (open: boolean) => void
  onCreateOrder: (row: ListingRow) => void
  onRelist: (row: ListingRow) => void
  onEdit: (row: ListingRow) => void
}) {
  const link = useStoreLink()
  const auction = row?.listing.auction
  const state = row && auction ? auctionState(persona, row.product.id, auction) : undefined
  const bids = row ? bidsFor(persona, row.product.id) : []
  const leading = row ? highestBid(persona, row.product.id) : undefined
  const winner = state === "Won" ? leading : undefined

  return (
    <Sheet open={row !== null} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        {row && auction && (
          <>
            <SheetHeader>
              <SheetTitle className="font-sans">{row.product.name}</SheetTitle>
              <SheetDescription>
                {auction.quantity} {auction.quantity === 1 ? "unit" : "units"} on offer ·{" "}
                {bids.length} {bids.length === 1 ? "bid" : "bids"}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 overflow-y-auto px-4">
              <div className="flex items-center gap-2">
                <StatusBadge label={state ?? "Scheduled"} />
                <span className="text-sm text-muted-foreground">
                  {state === "Live" || state === "Ending soon"
                    ? `Closes in ${timeRemainingLabel(auction)}`
                    : `Closed ${formatDateTime(auction.endsAt)}`}
                </span>
              </div>

              <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Standing at</span>
                  <span className="text-lg font-semibold">{formatGHS(currentBidAmount(auction, leading))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Started at</span>
                  <span>{formatGHS(auction.startingPrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Next valid bid</span>
                  <span>{formatGHS(minimumNextBid(auction, leading))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Lowest you&apos;d accept</span>
                  <span>{auction.reservePrice !== undefined ? formatGHS(auction.reservePrice) : "No reserve"}</span>
                </div>
                {auction.buyNowPrice !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Buy-now price</span>
                    <span>{formatGHS(auction.buyNowPrice)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Bidding window</span>
                  <span className="text-right text-xs">
                    {formatDateTime(auction.startsAt)} → {formatDateTime(auction.endsAt)}
                  </span>
                </div>
              </div>

              {state === "Reserve not met" && (
                <div className="rounded-lg border border-dashed p-3 text-sm">
                  <p className="font-medium">Nobody reached your lowest price</p>
                  <p className="text-xs text-muted-foreground">
                    The top bid was {formatGHS(currentBidAmount(auction, leading))}, below the{" "}
                    {formatGHS(auction.reservePrice ?? 0)} you set. You&apos;re not obliged to sell — run it again
                    with a new closing time, or sell it outright instead.
                  </p>
                </div>
              )}

              {state === "No bids" && (
                <div className="rounded-lg border border-dashed p-3 text-sm">
                  <p className="font-medium">Nobody bid</p>
                  <p className="text-xs text-muted-foreground">
                    Try a lower starting price or a longer window, or put it on sale at a fixed price.
                  </p>
                </div>
              )}

              {winner && (
                <div className="flex flex-col gap-1.5 rounded-lg border p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Winning bid</p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{winner.bidderName}</span>
                    <span className="font-semibold">{formatGHS(winner.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{winner.bidderPhone}</span>
                    <span>{formatDateTime(winner.placedAt)}</span>
                  </div>
                  {winner.convertedOrderNo && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-muted-foreground">Order</span>
                      <Link href={link("/online-store/online-orders")} className="text-primary hover:underline">
                        {winner.convertedOrderNo}
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Bids</p>
                <div className="flex flex-col divide-y rounded-lg border">
                  {bids.map((bid, index) => (
                    <div key={bid.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div>
                        <p>{bid.bidderName}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(bid.placedAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatGHS(bid.amount)}</span>
                        {index === 0 && state === "Won" && <StatusBadge label="Won" />}
                        {index === 0 && (state === "Live" || state === "Ending soon") && (
                          <StatusBadge label="Leading" tone="success" />
                        )}
                      </div>
                    </div>
                  ))}
                  {bids.length === 0 && (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">No bids yet.</p>
                  )}
                </div>
              </div>
            </div>

            <SheetFooter>
              {winner && !winner.convertedOrderNo && (
                <Button onClick={() => onCreateOrder(row)}>Create the order</Button>
              )}
              {(state === "No bids" || state === "Reserve not met") && (
                <Button onClick={() => onRelist(row)}>Run it again</Button>
              )}
              <Button variant="outline" onClick={() => onEdit(row)}>
                Edit auction
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
