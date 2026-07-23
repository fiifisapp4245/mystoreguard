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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getRiders, type Delivery } from "@/lib/deliveries-data"

const WINDOW_PRESETS = ["Morning", "Afternoon", "Evening"]

export function AssignRiderDialog({
  delivery,
  onOpenChange,
  onAssign,
}: {
  delivery: Delivery | null
  onOpenChange: (open: boolean) => void
  onAssign: (riderId: string, dateISO: string, window: string) => void
}) {
  const riders = getRiders()
  const [riderId, setRiderId] = useState("")
  const [dateISO, setDateISO] = useState("")
  const [windowPreset, setWindowPreset] = useState("Morning")
  const [customWindow, setCustomWindow] = useState("")
  const [prevDeliveryId, setPrevDeliveryId] = useState<string | null>(null)

  // Reset each time a different delivery is opened — adjusting state during
  // render rather than in an effect, since Dialog's onOpenChange only fires
  // on user-driven open/close, not when the parent sets `delivery` externally.
  if (delivery && delivery.id !== prevDeliveryId) {
    setPrevDeliveryId(delivery.id)
    setRiderId(delivery.riderId ?? "")
    setDateISO(delivery.scheduledDateISO)
    setWindowPreset(WINDOW_PRESETS.includes(delivery.window) ? delivery.window : "Custom")
    setCustomWindow(WINDOW_PRESETS.includes(delivery.window) ? "" : delivery.window)
  }

  function handleOpenChange(open: boolean) {
    if (!open) setPrevDeliveryId(null)
    onOpenChange(open)
  }

  function handleSubmit() {
    if (!riderId || !dateISO) return
    onAssign(riderId, dateISO, windowPreset === "Custom" ? customWindow : windowPreset)
  }

  return (
    <Dialog open={delivery !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign rider</DialogTitle>
          <DialogDescription>{delivery?.id} · {delivery?.customer}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="assign-rider">Rider</Label>
            <Select value={riderId} onValueChange={setRiderId}>
              <SelectTrigger className="w-full" id="assign-rider">
                <SelectValue placeholder="Select a rider..." />
              </SelectTrigger>
              <SelectContent>
                {riders.map((rider) => (
                  <SelectItem key={rider.id} value={rider.id}>
                    {rider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="assign-date">Date</Label>
              <Input id="assign-date" type="date" value={dateISO} onChange={(event) => setDateISO(event.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="assign-window">Window</Label>
              <Select value={windowPreset} onValueChange={setWindowPreset}>
                <SelectTrigger className="w-full" id="assign-window">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WINDOW_PRESETS.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {windowPreset === "Custom" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="assign-custom-window">Custom window</Label>
              <Input
                id="assign-custom-window"
                value={customWindow}
                onChange={(event) => setCustomWindow(event.target.value)}
                placeholder="e.g. 2:00 – 3:00 pm"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!riderId || !dateISO}>
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
