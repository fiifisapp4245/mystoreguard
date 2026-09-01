"use client"

import { useState } from "react"
import { Gavel, Search } from "lucide-react"
import { toast } from "sonner"

import { LiveResultCount } from "@/components/dashboard/live-result-count"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { TeachingEmptyState } from "@/components/dashboard/teaching-empty-state"
import { AuctionDetailSheet } from "@/components/online-store/auction-detail-sheet"
import { ListingDialog } from "@/components/online-store/listing-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useOnlineStore, useStoreLink } from "@/hooks/use-online-store"
import { formatGHS } from "@/lib/mock-data"
import {
  auctionState,
  bidCount,
  bidderCount,
  clearBidsFor,
  currentBidAmount,
  formatDateTime,
  highestBid,
  isAwaitingConversion,
  markBidConverted,
  timeRemainingLabel,
  winningBid,
} from "@/lib/online-auctions-data"
import {
  hasAuction,
  listingRows,
  upsertListing,
  type ListingRow,
  type OnlineListing,
} from "@/lib/online-listings-data"
import { createOrderFromBid } from "@/lib/online-orders-data"

export function OnlineBiddingTab() {
  const { persona, refresh } = useOnlineStore()
  const link = useStoreLink()
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<ListingRow | null>(null)
  const [relistingId, setRelistingId] = useState<string | null>(null)

  const auctions = listingRows(persona).filter((row) => hasAuction(row.listing))
  const rows = auctions.filter((row) => {
    const query = search.trim().toLowerCase()
    return !query || row.product.name.toLowerCase().includes(query)
  })

  const selected = selectedId ? auctions.find((row) => row.product.id === selectedId) ?? null : null

  const running = auctions.filter((row) => {
    const state = auctionState(persona, row.product.id, row.listing.auction!)
    return state === "Live" || state === "Ending soon"
  })
  const totalBids = auctions.reduce((sum, row) => sum + bidCount(persona, row.product.id), 0)
  const awaitingOrder = auctions.filter((row) =>
    isAwaitingConversion(persona, row.product.id, row.listing.auction!)
  )
  const liveValue = running.reduce(
    (sum, row) => sum + currentBidAmount(row.listing.auction!, highestBid(persona, row.product.id)),
    0
  )

  /** The winning bid becomes an ordinary online order — payment and fulfilment take over from there. */
  function handleCreateOrder(row: ListingRow) {
    const auction = row.listing.auction!
    const winner = winningBid(persona, row.product.id, auction)
    if (!winner) return

    const order = createOrderFromBid(persona, {
      productId: row.product.id,
      productName: row.product.name,
      quantity: auction.quantity,
      amount: winner.amount,
      bidId: winner.id,
      bidderName: winner.bidderName,
      bidderPhone: winner.bidderPhone,
      customerId: winner.customerId,
    })
    markBidConverted(persona, winner.id, order.id)

    setSelectedId(null)
    refresh()
    toast.success(`${order.id} created`, {
      description: `${winner.bidderName} owes ${formatGHS(winner.amount)}. Confirm the payment in Orders.`,
    })
  }

  /** Running it again means a fresh window and a clean slate — old bids don't carry over. */
  function handleRelist(row: ListingRow) {
    setRelistingId(row.product.id)
    setSelectedId(null)
    setEditing(row)
  }

  function handleSaveListing(listing: OnlineListing) {
    upsertListing(persona, listing)
    if (relistingId === listing.productId) {
      clearBidsFor(persona, listing.productId)
      toast.success("Auction running again", { description: "Previous bids have been cleared." })
    } else {
      toast.success("Auction updated")
    }
    setRelistingId(null)
    setEditing(null)
    refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Auctions running"
          value={String(running.length)}
          caption="as of now"
          footnote="Bidding open right now"
        />
        <StatCard label="Bids received" value={String(totalBids)} caption="all time" footnote="Across every auction" />
        <StatCard
          label="Value on the table"
          value={formatGHS(liveValue)}
          caption="as of now"
          footnote="Where the running auctions stand"
        />
        <StatCard
          label="Won, no order yet"
          value={String(awaitingOrder.length)}
          caption="as of now"
          footnote={awaitingOrder.length > 0 ? "Turn each into an order" : "All winners invoiced"}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:max-w-64">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search auctions..."
              aria-label="Search auctions"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <LiveResultCount count={rows.length} itemLabel="auction" />
      </div>

      {auctions.length === 0 ? (
        <TeachingEmptyState
          icon={Gavel}
          message="Nothing is up for bidding. Any product on your store can be put up for auction instead of — or as well as — sold at a fixed price."
          actionLabel="Choose a product"
          actionHref={link("/online-store/online-products")}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Standing at</TableHead>
                <TableHead>Bids</TableHead>
                <TableHead>Bidders</TableHead>
                <TableHead>Closes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-40" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const auction = row.listing.auction!
                const state = auctionState(persona, row.product.id, auction)
                const leading = highestBid(persona, row.product.id)
                const isLive = state === "Live" || state === "Ending soon"
                const needsOrder = isAwaitingConversion(persona, row.product.id, auction)
                return (
                  <TableRow key={row.product.id} className="cursor-pointer" onClick={() => setSelectedId(row.product.id)}>
                    <TableCell className="font-medium">{row.product.name}</TableCell>
                    <TableCell>
                      <span className="flex flex-col">
                        {formatGHS(currentBidAmount(auction, leading))}
                        {!leading && <span className="text-xs text-muted-foreground">Starting price</span>}
                      </span>
                    </TableCell>
                    <TableCell>{bidCount(persona, row.product.id)}</TableCell>
                    <TableCell>{bidderCount(persona, row.product.id)}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {isLive ? `in ${timeRemainingLabel(auction)}` : formatDateTime(auction.endsAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={state} />
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      {needsOrder && (
                        <Button size="sm" onClick={() => handleCreateOrder(row)}>
                          Create the order
                        </Button>
                      )}
                      {(state === "No bids" || state === "Reserve not met") && (
                        <Button size="sm" variant="outline" onClick={() => handleRelist(row)}>
                          Run it again
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No auctions match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        A won auction becomes an ordinary order — the same payment confirmation, packing and delivery as
        anything else your store sells.
      </p>

      <AuctionDetailSheet
        row={selected}
        persona={persona}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onCreateOrder={handleCreateOrder}
        onRelist={handleRelist}
        onEdit={(row) => {
          setSelectedId(null)
          setEditing(row)
        }}
      />

      <ListingDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null)
            setRelistingId(null)
          }
        }}
        row={editing}
        onSave={handleSaveListing}
      />
    </div>
  )
}
