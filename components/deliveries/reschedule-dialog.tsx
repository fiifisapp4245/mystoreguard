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
import { type Delivery } from "@/lib/deliveries-data"
import { TODAY_ISO } from "@/lib/period-utils"

export function RescheduleDialog({
  delivery,
  onOpenChange,
  onReschedule,
}: {
  delivery: Delivery | null
  onOpenChange: (open: boolean) => void
  onReschedule: (newDateISO: string) => void
}) {
  const [dateISO, setDateISO] = useState(TODAY_ISO)
  const [prevDeliveryId, setPrevDeliveryId] = useState<string | null>(null)

  // Reset each time a different delivery is opened — adjusting state during
  // render rather than in an effect, since Dialog's onOpenChange only fires
  // on user-driven open/close, not when the parent sets `delivery` externally.
  if (delivery && delivery.id !== prevDeliveryId) {
    setPrevDeliveryId(delivery.id)
    setDateISO(TODAY_ISO)
  }

  function handleOpenChange(open: boolean) {
    if (!open) setPrevDeliveryId(null)
    onOpenChange(open)
  }

  return (
    <Dialog open={delivery !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Reschedule delivery</DialogTitle>
          <DialogDescription>{delivery?.id} · {delivery?.customer}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reschedule-date">New date</Label>
          <Input id="reschedule-date" type="date" value={dateISO} onChange={(event) => setDateISO(event.target.value)} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onReschedule(dateISO)}>Reschedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
