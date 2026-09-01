"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Gavel, Minus, Plus, ShoppingCart, Timer } from "lucide-react"
import { toast } from "sonner"

import { StatusBadge } from "@/components/dashboard/status-badge"
import { PlaceBidDialog } from "@/components/storefront/place-bid-dialog"
import { useStorefront } from "@/components/storefront/storefront-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatGHS } from "@/lib/mock-data"
import {
  auctionState,
  bidderCount,
  bidsFor,
  currentBidAmount,
  formatDateTime,
  highestBid,
  minimumNextBid,
  timeRemainingLabel,
} from "@/lib/online-auctions-data"
import { hasAuction, onlineAvailable, onlinePriceOf, sellsDirectly } from "@/lib/online-listings-data"
import { storefrontPath } from "@/lib/online-store-data"

/**
 * One product. Buy now and Auction are shown as two clearly separate offers
 * rather than blended into one control — a customer should never be unsure
 * whether pressing the button commits them to a price or to a bid.
 */
export function StorefrontProduct({ productId }: { productId: string }) {
  const { store, persona, rows, slug, open, addToCart, setCartOpen, refresh } = useStorefront()
  const [quantity, setQuantity] = useState(1)
  const [bidOpen, setBidOpen] = useState(false)

  if (!store || !persona) return null

  const row = rows.find((entry) => entry.product.id === productId)

  if (!row) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-20 text-center">
        <p className="text-sm text-muted-foreground">This item isn&apos;t on sale.</p>
        <Button asChild variant="outline">
          <Link href={storefrontPath(slug)}>
            <ArrowLeft />
            Back to the shop
          </Link>
        </Button>
      </div>
    )
  }

  const { listing, product } = row
  const price = onlinePriceOf(listing, product)
  const available = onlineAvailable(listing, product)
  const soldOut = !product.isService && available <= 0
  const auction = hasAuction(listing) ? listing.auction! : undefined
  const state = auction ? auctionState(persona, product.id, auction) : undefined
  const biddingOpen = state === "Live" || state === "Ending soon"
  const leading = auction ? highestBid(persona, product.id) : undefined
  const bids = auction ? bidsFor(persona, product.id) : []

  function handleAddToCart() {
    addToCart(product.id, quantity)
    setCartOpen(true)
    toast.success("Added to your basket", { description: `${quantity} × ${product.name}` })
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={storefrontPath(slug)}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to the shop
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex h-64 items-center justify-center rounded-2xl bg-muted/60 text-5xl font-semibold text-muted-foreground sm:h-80">
          {product.name.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Badge variant="secondary" className="w-fit font-normal">
              {product.category}
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
            <p className="text-sm text-muted-foreground">
              Sold by the {product.pack.baseUnit.toLowerCase()}
              {listing.onlineDescription ? ` · ${listing.onlineDescription}` : ""}
            </p>
          </div>

          {/* Buy now */}
          {sellsDirectly(listing) && (
            <Card>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-semibold">
                    {formatGHS(auction?.buyNowPrice !== undefined ? auction.buyNowPrice : price)}
                  </span>
                  {soldOut ? (
                    <StatusBadge label="Out of stock" />
                  ) : (
                    store.storefront.showStockCounts &&
                    !product.isService &&
                    available <= product.reorderPoint && (
                      <span className="text-sm text-muted-foreground">Only {available} left</span>
                    )
                  )}
                </div>

                {!soldOut && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label="One fewer"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <span className="w-10 text-center tabular-nums">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label="One more"
                      disabled={!product.isService && quantity >= available}
                      onClick={() => setQuantity((value) => value + 1)}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                )}

                <Button onClick={handleAddToCart} disabled={soldOut || !open}>
                  <ShoppingCart />
                  Add to basket
                </Button>
                {!open && (
                  <p className="text-xs text-muted-foreground">This shop isn&apos;t taking orders right now.</p>
                )}
                {soldOut && (
                  <p className="text-xs text-muted-foreground">
                    Sold out for now — it comes back as soon as the shop restocks.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Auction */}
          {auction && (
            <Card>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                    <Gavel className="size-4" />
                    Auction
                  </span>
                  <StatusBadge label={state ?? "Scheduled"} />
                </div>

                <Separator />

                {biddingOpen ? (
                  <>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">Current bid</span>
                      <span className="text-2xl font-semibold">{formatGHS(currentBidAmount(auction, leading))}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Timer className="size-3.5" />
                        Ends in
                      </span>
                      <span className="font-medium">{timeRemainingLabel(auction)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Minimum next bid</span>
                      <span className="font-medium">{formatGHS(minimumNextBid(auction, leading))}</span>
                    </div>
                    <Button onClick={() => setBidOpen(true)} disabled={!open}>
                      Place a bid
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {bids.length} {bids.length === 1 ? "bid" : "bids"} from {bidderCount(persona, product.id)}{" "}
                      {bidderCount(persona, product.id) === 1 ? "person" : "people"} · closes{" "}
                      {formatDateTime(auction.endsAt)}
                    </p>
                  </>
                ) : state === "Scheduled" ? (
                  <>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">Starting price</span>
                      <span className="text-xl font-semibold">{formatGHS(auction.startingPrice)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Bidding opens {formatDateTime(auction.startsAt)}.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">
                        {state === "Won" ? "Winning bid" : "Highest bid"}
                      </span>
                      <span className="text-xl font-semibold">{formatGHS(currentBidAmount(auction, leading))}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {state === "Won"
                        ? `Bidding closed ${formatDateTime(auction.endsAt)}. The winner has been contacted by the shop.`
                        : state === "Reserve not met"
                          ? "Bidding closed without reaching the shop's lowest price."
                          : "Bidding closed with no bids."}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {bids.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Recent bids</p>
              <div className="flex flex-col divide-y rounded-lg border">
                {bids.slice(0, 5).map((bid, index) => (
                  <div key={bid.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div>
                      {/* Other bidders are shown by first name only. */}
                      <p>{bid.bidderName.split(" ")[0]}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(bid.placedAt)}</p>
                    </div>
                    <span className={index === 0 ? "font-semibold" : "text-muted-foreground"}>
                      {formatGHS(bid.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {auction && (
        <PlaceBidDialog
          open={bidOpen}
          onOpenChange={setBidOpen}
          row={row}
          persona={persona}
          onPlaced={refresh}
        />
      )}
    </div>
  )
}
