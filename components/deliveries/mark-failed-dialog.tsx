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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FAILURE_REASONS, type Delivery } from "@/lib/deliveries-data"

export function MarkFailedDialog({
  delivery,
  onOpenChange,
  onMarkFailed,
}: {
  delivery: Delivery | null
  onOpenChange: (open: boolean) => void
  onMarkFailed: (reason: string, note: string) => void
}) {
  const [reason, setReason] = useState("")
  const [note, setNote] = useState("")
  const [prevDeliveryId, setPrevDeliveryId] = useState<string | null>(null)

  // Reset each time a different delivery is opened — adjusting state during
  // render rather than in an effect, since Dialog's onOpenChange only fires
  // on user-driven open/close, not when the parent sets `delivery` externally.
  if (delivery && delivery.id !== prevDeliveryId) {
    setPrevDeliveryId(delivery.id)
    setReason("")
    setNote("")
  }

  function handleOpenChange(open: boolean) {
    if (!open) setPrevDeliveryId(null)
    onOpenChange(open)
  }

  return (
    <Dialog open={delivery !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark failed</DialogTitle>
          <DialogDescription>{delivery?.id} · {delivery?.customer}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fail-reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full" id="fail-reason">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {FAILURE_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fail-note">Note</Label>
            <Textarea id="fail-note" value={note} onChange={(event) => setNote(event.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => onMarkFailed(reason, note)} disabled={!reason}>
            Mark failed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
