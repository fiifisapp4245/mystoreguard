"use client"

import Link from "next/link"
import { Gavel } from "lucide-react"

import { StatusBadge } from "@/components/dashboard/status-badge"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatGHS } from "@/lib/mock-data"
import {
  auctionState,
  currentBidAmount,
  highestBid,
  timeRemainingLabel,
} from "@/lib/online-auctions-data"
import { hasAuction, onlineAvailable, onlinePriceOf, sellsDirectly, type ListingRow } from "@/lib/online-listings-data"
import type { StorePersona } from "@/hooks/use-demo-state"
import { storefrontPath } from "@/lib/online-store-data"

/**
 * One product as a customer sees it. Buy-now and auction products share the
 * same card so a mixed shelf still reads as one shop — only the price line
 * changes, which is where the difference actually matters.
 */
export function ProductCard({
  row,
  persona,
  slug,
  showStockCounts,
}: {
  row: ListingRow
  persona: StorePersona
  slug: string
  showStockCounts: boolean
}) {
  const { listing, product } = row
  const available = onlineAvailable(listing, product)
  const soldOut = !product.isService && available <= 0
  const auction = hasAuction(listing) ? listing.auction : undefined
  const state = auction ? auctionState(persona, product.id, auction) : undefined
  const leading = auction ? highestBid(persona, product.id) : undefined
  const biddingOpen = state === "Live" || state === "Ending soon"

  return (
    <Card className="h-full gap-0 overflow-hidden py-0 transition-colors hover:border-primary/40">
      <Link href={`${storefrontPath(slug)}/product/${product.id}`} className="flex h-full flex-col">
        {/* No product photography in this prototype — a lettered tile keeps the grid honest. */}
        <div className="flex h-28 items-center justify-center bg-muted/60 text-2xl font-semibold text-muted-foreground">
          {product.name.slice(0, 2).toUpperCase()}
        </div>
        <CardContent className="flex flex-1 flex-col gap-1.5 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm leading-snug font-medium">{product.name}</p>
            {auction && biddingOpen && (
              <Badge variant="outline" className="shrink-0 gap-1 font-normal">
                <Gavel className="size-3" />
                Bidding
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{product.category}</p>

          <div className="mt-auto flex flex-col gap-1 pt-2">
            {auction && biddingOpen ? (
              <>
                <span className="text-xs text-muted-foreground">Current bid</span>
                <span className="text-base font-semibold">{formatGHS(currentBidAmount(auction, leading))}</span>
                <span className="text-xs text-muted-foreground">Ends in {timeRemainingLabel(auction)}</span>
              </>
            ) : sellsDirectly(listing) ? (
              <>
                <span className="text-base font-semibold">{formatGHS(onlinePriceOf(listing, product))}</span>
                {showStockCounts && !soldOut && !product.isService && available <= product.reorderPoint && (
                  <span className="text-xs text-muted-foreground">Only {available} left</span>
                )}
              </>
            ) : (
              /* An auction that has closed can't be bought — say what happened
                 to it rather than leaving the card blank. */
              <>
                <span className="text-base font-semibold">
                  {state === "Won" ? "Sold" : state === "Scheduled" ? formatGHS(auction!.startingPrice) : "Not sold"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {state === "Won"
                    ? `Went for ${formatGHS(currentBidAmount(auction!, leading))}`
                    : state === "Scheduled"
                      ? "Bidding opens soon"
                      : "Bidding has closed"}
                </span>
              </>
            )}
            {soldOut && sellsDirectly(listing) && <StatusBadge label="Out of stock" />}
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
