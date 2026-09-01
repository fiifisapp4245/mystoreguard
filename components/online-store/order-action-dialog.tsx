"use client"

import { useState } from "react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatGHS } from "@/lib/mock-data"
import { ONLINE_PAYMENT_INTEGRATION_NOTE } from "@/lib/online-store-data"
import type { OnlineOrder } from "@/lib/online-orders-data"
import { TODAY_ISO } from "@/lib/period-utils"

const WINDOW_PRESETS = ["Morning", "Afternoon", "Evening"]

export type OrderActionKind = "confirm-payment" | "send" | "cancel"

export interface OrderActionPayload {
  reference?: string
  scheduledDateISO?: string
  window?: string
  reason?: string
}

/**
 * The three order actions that need one more fact before they can happen.
 * Everything else on an order advances in a single click, so this dialog
 * only ever appears when there's genuinely something to ask.
 */
export function OrderActionDialog({
  kind,
  order,
  onOpenChange,
  onConfirm,
}: {
  kind: OrderActionKind | null
  order: OnlineOrder | null
  onOpenChange: (open: boolean) => void
  onConfirm: (payload: OrderActionPayload) => void
}) {
  const [reference, setReference] = useState("")
  const [dateISO, setDateISO] = useState(TODAY_ISO)
  const [window, setWindow] = useState(WINDOW_PRESETS[0])
  const [reason, setReason] = useState("")
  const [loadedFor, setLoadedFor] = useState<string | null>(null)

  const key = order && kind ? `${order.id}:${kind}` : null
  if (key && key !== loadedFor) {
    setLoadedFor(key)
    setReference("")
    setDateISO(TODAY_ISO)
    setWindow(WINDOW_PRESETS[0])
    setReason("")
  }

  if (!order || !kind) return null

  const canConfirm =
    kind === "confirm-payment" ? reference.trim().length > 0 : kind === "cancel" ? reason.trim().length > 0 : true

  const titles: Record<OrderActionKind, { title: string; description: string; cta: string }> = {
    "confirm-payment": {
      title: "Confirm payment received",
      description: `Record the ${order.paymentMethod} payment of ${formatGHS(order.total)} for ${order.id}. This adds the sale to your books.`,
      cta: "Payment received",
    },
    send: {
      title: "Send for delivery",
      description: `${order.id} goes to Deliveries, where you assign a rider and capture proof of delivery — the same as any other delivery.`,
      cta: "Send for delivery",
    },
    cancel: {
      title: "Cancel this order",
      description: `The goods held for ${order.id} go back to available stock.`,
      cta: "Cancel order",
    },
  }

  const copy = titles[kind]

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {kind === "confirm-payment" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="order-reference">
                  Payment reference <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="order-reference"
                  placeholder="e.g. the Momo transaction ID"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">{ONLINE_PAYMENT_INTEGRATION_NOTE}</p>
            </>
          )}

          {kind === "send" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="order-date">Delivery date</Label>
                <Input
                  id="order-date"
                  type="date"
                  value={dateISO}
                  onChange={(event) => setDateISO(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="order-window">Time of day</Label>
                <Select value={window} onValueChange={setWindow}>
                  <SelectTrigger className="w-full" id="order-window">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WINDOW_PRESETS.map((preset) => (
                      <SelectItem key={preset} value={preset}>
                        {preset}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {kind === "cancel" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="order-reason">
                Why is it being cancelled? <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="order-reason"
                rows={2}
                placeholder="e.g. Customer changed their mind"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Go back
          </Button>
          <Button
            variant={kind === "cancel" ? "destructive" : "default"}
            disabled={!canConfirm}
            onClick={() => onConfirm({ reference, scheduledDateISO: dateISO, window, reason })}
          >
            {copy.cta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
