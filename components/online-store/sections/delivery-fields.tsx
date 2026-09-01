"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { formatGHS } from "@/lib/mock-data"
import type { DeliverySettings, DeliveryZone } from "@/lib/online-store-data"

/**
 * Where the store delivers and what it charges, plus collection from the
 * shop. The areas offered are the ones the business already delivers to
 * (see AREAS in lib/mock-data.ts) rather than a blank list to invent.
 */
export function deliveryProblems(settings: DeliverySettings): string[] {
  const problems: string[] = []
  if (!settings.zones.some((zone) => zone.enabled) && !settings.pickupEnabled) {
    problems.push("Turn on at least one delivery area, or let customers collect from the shop")
  }
  const badFee = settings.zones.find((zone) => zone.enabled && (!Number.isFinite(zone.fee) || zone.fee < 0))
  if (badFee) problems.push(`Set a delivery charge for ${badFee.area}`)
  return problems
}

export function DeliveryFields({
  value,
  onChange,
}: {
  value: DeliverySettings
  onChange: (patch: Partial<DeliverySettings>) => void
}) {
  function updateZone(id: string, patch: Partial<DeliveryZone>) {
    onChange({ zones: value.zones.map((zone) => (zone.id === id ? { ...zone, ...patch } : zone)) })
  }

  const enabledCount = value.zones.filter((zone) => zone.enabled).length

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <Label>Where do you deliver?</Label>
          <span className="text-xs text-muted-foreground">
            {enabledCount} {enabledCount === 1 ? "area" : "areas"} switched on
          </span>
        </div>
        <div className="flex flex-col divide-y rounded-lg border">
          {value.zones.map((zone) => (
            <div key={zone.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
              <Switch
                id={`zone-${zone.id}`}
                checked={zone.enabled}
                onCheckedChange={(checked) => updateZone(zone.id, { enabled: checked })}
              />
              <Label htmlFor={`zone-${zone.id}`} className="w-28 font-normal">
                {zone.area}
              </Label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Charge</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  aria-label={`Delivery charge for ${zone.area}`}
                  value={String(zone.fee)}
                  disabled={!zone.enabled}
                  onChange={(event) => updateZone(zone.id, { fee: Number(event.target.value) })}
                  className="w-24"
                />
              </div>
              <div className="flex flex-1 items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Arrives</span>
                <Input
                  aria-label={`How soon deliveries reach ${zone.area}`}
                  value={zone.eta}
                  disabled={!zone.enabled}
                  placeholder="e.g. Same day"
                  onChange={(event) => updateZone(zone.id, { eta: event.target.value })}
                  className="w-full sm:w-40"
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Orders go out with the riders you already use — an online order becomes a delivery in Deliveries,
          exactly like a counter sale that has to be dropped off.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Let customers collect from the shop</p>
            <p className="text-xs text-muted-foreground">No rider, no delivery charge.</p>
          </div>
          <Switch
            checked={value.pickupEnabled}
            onCheckedChange={(checked) => onChange({ pickupEnabled: checked })}
            aria-label="Let customers collect from the shop"
          />
        </div>
        {value.pickupEnabled && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pickup-note">Where and when they collect</Label>
            <Textarea
              id="pickup-note"
              rows={2}
              placeholder="e.g. Stall 14, Makola Market — 8am to 6pm, Monday to Saturday."
              value={value.pickupNote}
              onChange={(event) => onChange({ pickupNote: event.target.value })}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="free-delivery">Free delivery on orders over</Label>
        <Input
          id="free-delivery"
          type="number"
          inputMode="decimal"
          value={String(value.freeDeliveryOver)}
          onChange={(event) => onChange({ freeDeliveryOver: Number(event.target.value) })}
          className="w-40"
        />
        <p className="text-xs text-muted-foreground">
          {value.freeDeliveryOver > 0
            ? `Orders of ${formatGHS(value.freeDeliveryOver)} or more ship free.`
            : "Set to 0 to charge for every delivery."}
        </p>
      </div>
    </div>
  )
}
