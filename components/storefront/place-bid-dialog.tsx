"use client"

import { useState } from "react"
import { toast } from "sonner"

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
import type { StorePersona } from "@/hooks/use-demo-state"
import { formatGHS } from "@/lib/mock-data"
import {
  highestBid,
  minimumNextBid,
  placeBid,
  timeRemainingLabel,
} from "@/lib/online-auctions-data"
import { findCustomerByPhone } from "@/lib/online-orders-data"
import type { ListingRow } from "@/lib/online-listings-data"

/**
 * Placing a bid. Every rule lives in lib/online-auctions-data.ts — this
 * dialog shows the minimum before the customer types, and repeats the
 * reason in their own terms if the bid is still rejected.
 */
export function PlaceBidDialog({
  open,
  onOpenChange,
  row,
  persona,
  onPlaced,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: ListingRow
  persona: StorePersona
  onPlaced: () => void
}) {
  const auction = row.listing.auction!
  const leading = highestBid(persona, row.product.id)
  const minimum = minimumNextBid(auction, leading)

  const [amount, setAmount] = useState(String(minimum))
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [wasOpen, setWasOpen] = useState(false)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setAmount(String(minimum))
      setError(null)
    }
  }

  function handleSubmit() {
    const matched = findCustomerByPhone(phone)
    const result = placeBid(persona, row.listing, {
      bidderName: name,
      bidderPhone: phone,
      amount: Number(amount),
      customerId: matched?.id,
    })

    if (!result.ok) {
      setError(result.reason)
      return
    }

    setError(null)
    onOpenChange(false)
    onPlaced()
    toast.success("Bid placed", {
      description: `You're the highest bidder at ${formatGHS(result.bid.amount)}. Bidding closes in ${timeRemainingLabel(auction)}.`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Place a bid</DialogTitle>
          <DialogDescription>
            {row.product.name} · bidding closes in {timeRemainingLabel(auction)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
            <span className="text-muted-foreground">Smallest bid you can place</span>
            <span className="font-semibold">{formatGHS(minimum)}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bid-amount">
              Your bid <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bid-amount"
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bid-name">
                Your name <span className="text-destructive">*</span>
              </Label>
              <Input id="bid-name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bid-phone">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bid-phone"
                inputMode="tel"
                placeholder="024 123 4567"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <p className="text-xs text-muted-foreground">
            If you win, the shop contacts you on this number to arrange payment and collection or delivery.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Place bid</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
