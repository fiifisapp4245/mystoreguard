"use client"

import { useState } from "react"
import { Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatGHS } from "@/lib/mock-data"
import {
  auctionDraftToConfig,
  configToAuctionDraft,
  onlineAvailable,
  validateAuctionDraft,
  type AuctionDraft,
  type ListingRow,
  type OnlineListing,
  type SellingMode,
} from "@/lib/online-listings-data"
import { totalAvailable } from "@/lib/pos-data"

/**
 * Everything that's true of one product *online*. Deliberately short: name,
 * category, pack structure and cost aren't here because they're already set
 * on the product itself — this dialog never asks for anything the merchant
 * has told us once.
 *
 * Advanced choices stay hidden until they're relevant (progressive
 * disclosure): auction fields only appear once bidding is switched on, and
 * the buy-now price only for the mode that uses it.
 */
export function ListingDialog({
  open,
  onOpenChange,
  row,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: ListingRow | null
  onSave: (listing: OnlineListing) => void
}) {
  const [mode, setMode] = useState<SellingMode>("buy-now")
  const [price, setPrice] = useState("")
  const [limit, setLimit] = useState("")
  const [description, setDescription] = useState("")
  const [auction, setAuction] = useState<AuctionDraft>(configToAuctionDraft())
  const [loadedFor, setLoadedFor] = useState<string | null>(null)

  // Reload the form whenever a different listing is opened — same
  // adjust-during-render pattern as ProductDialog, since the parent sets
  // `row` externally rather than through onOpenChange.
  const currentId = row?.product.id ?? null
  if (open && currentId !== loadedFor) {
    setLoadedFor(currentId)
    setMode(row?.listing.sellingMode ?? "buy-now")
    setPrice(row?.listing.onlinePrice !== undefined ? String(row.listing.onlinePrice) : "")
    setLimit(row?.listing.onlineStockLimit !== undefined ? String(row.listing.onlineStockLimit) : "")
    setDescription(row?.listing.onlineDescription ?? "")
    setAuction(configToAuctionDraft(row?.listing.auction))
  }

  if (!row) return null

  const { product, listing } = row
  const shelfPrice = product.sellingPrice
  const sharedAvailable = Math.max(0, totalAvailable(product))
  const shownOnline = onlineAvailable({ ...listing, onlineStockLimit: limit ? Number(limit) : undefined }, product)

  const wantsAuction = mode !== "buy-now"
  const auctionProblems = wantsAuction ? validateAuctionDraft(auction, mode) : []

  const priceValue = price.trim() === "" ? undefined : Number(price)
  const priceProblem =
    priceValue !== undefined && (!Number.isFinite(priceValue) || priceValue <= 0)
      ? "Enter an online price above zero, or leave it blank to use the shop price."
      : undefined

  const limitValue = limit.trim() === "" ? undefined : Number(limit)
  const limitProblem =
    limitValue !== undefined && (!Number.isInteger(limitValue) || limitValue < 0)
      ? "Enter a whole number of units, or leave it blank to offer everything you have."
      : undefined

  const problems = [...auctionProblems, priceProblem, limitProblem].filter(Boolean) as string[]

  function handleSave() {
    if (problems.length > 0) return
    onSave({
      ...listing,
      sellingMode: mode,
      onlinePrice: priceValue,
      onlineStockLimit: limitValue,
      onlineDescription: description.trim() || undefined,
      auction: wantsAuction ? auctionDraftToConfig(auction, mode) : undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            How this product is sold online. Its name, category and stock come from your catalogue and stay
            in step automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 overflow-y-auto px-1 pb-1">
          <div className="flex flex-col gap-2">
            <Label>Selling method</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              value={mode}
              onValueChange={(value) => value && setMode(value as SellingMode)}
              className="w-full"
            >
              <ToggleGroupItem value="buy-now" className="flex-1">
                Buy now
              </ToggleGroupItem>
              <ToggleGroupItem value="auction" className="flex-1">
                Auction
              </ToggleGroupItem>
              <ToggleGroupItem value="buy-now-and-auction" className="flex-1">
                Both
              </ToggleGroupItem>
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">
              {mode === "buy-now" && "Customers add it to their basket and pay the price you set."}
              {mode === "auction" && "Customers bid, and the highest bid when the clock runs out wins it."}
              {mode === "buy-now-and-auction" &&
                "Customers can bid, or skip the wait and buy it outright at your buy-now price."}
            </p>
          </div>

          {mode !== "auction" && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-muted-foreground uppercase">Buying it outright</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="listing-price">Online price</Label>
                  <Input
                    id="listing-price"
                    type="number"
                    inputMode="decimal"
                    placeholder={String(shelfPrice)}
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank to charge the shop price, {formatGHS(shelfPrice)}.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="listing-limit">How many can be sold online?</Label>
                  <Input
                    id="listing-limit"
                    type="number"
                    inputMode="numeric"
                    placeholder="All of them"
                    value={limit}
                    onChange={(event) => setLimit(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Set a number to keep some back for walk-in customers.
                  </p>
                </div>
              </div>
            </div>
          )}

          {wantsAuction && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-muted-foreground uppercase">Bidding</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="auction-start">
                    Starting price <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="auction-start"
                    type="number"
                    inputMode="decimal"
                    value={auction.startingPrice}
                    onChange={(event) => setAuction({ ...auction, startingPrice: event.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="auction-step">
                    Smallest bid step <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="auction-step"
                    type="number"
                    inputMode="decimal"
                    value={auction.bidIncrement}
                    onChange={(event) => setAuction({ ...auction, bidIncrement: event.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="auction-opens">
                    Bidding opens <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="auction-opens"
                    type="datetime-local"
                    value={auction.startsAt}
                    onChange={(event) => setAuction({ ...auction, startsAt: event.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="auction-closes">
                    Bidding closes <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="auction-closes"
                    type="datetime-local"
                    value={auction.endsAt}
                    onChange={(event) => setAuction({ ...auction, endsAt: event.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="auction-quantity">
                    Units on offer <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="auction-quantity"
                    type="number"
                    inputMode="numeric"
                    value={auction.quantity}
                    onChange={(event) => setAuction({ ...auction, quantity: event.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="auction-reserve">Lowest you&apos;d accept</Label>
                  <Input
                    id="auction-reserve"
                    type="number"
                    inputMode="decimal"
                    placeholder="Optional"
                    value={auction.reservePrice}
                    onChange={(event) => setAuction({ ...auction, reservePrice: event.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Bidders never see this.</p>
                </div>
                {mode === "buy-now-and-auction" && (
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Label htmlFor="auction-buynow">
                      Buy-now price <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="auction-buynow"
                      type="number"
                      inputMode="decimal"
                      value={auction.buyNowPrice}
                      onChange={(event) => setAuction({ ...auction, buyNowPrice: event.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      What a customer pays to end the wait and take it now.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="listing-description">What customers should know</Label>
            <Textarea
              id="listing-description"
              rows={2}
              placeholder="A line or two the shop shelf doesn't need but a web page does."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <p>
              You have <span className="font-medium text-foreground">{sharedAvailable}</span> available across the
              business right now, and{" "}
              <span className="font-medium text-foreground">
                {shownOnline === Number.MAX_SAFE_INTEGER ? "all of them" : shownOnline}
              </span>{" "}
              would show online. Sell one at the counter and this drops on its own — there is no separate online
              stock to keep in step.
            </p>
          </div>
        </div>

        <DialogFooter>
          <div className="flex flex-col items-end gap-1">
            {problems.length > 0 && <p className="text-xs text-muted-foreground">{problems[0]}</p>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={problems.length > 0}>
                Save
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
