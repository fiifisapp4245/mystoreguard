"use client"

import { StatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatGHS } from "@/lib/mock-data"
import { DELIVERY_STATUSES, getRider, type Delivery } from "@/lib/deliveries-data"
import { formatDateDisplay } from "@/lib/period-utils"

export function DeliveryBoard({ deliveries, onSelect }: { deliveries: Delivery[]; onSelect: (delivery: Delivery) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {DELIVERY_STATUSES.map((status) => {
        const columnDeliveries = deliveries.filter((d) => d.status === status)
        return (
          <div key={status} className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <StatusBadge label={status} />
              <span className="text-xs text-muted-foreground">{columnDeliveries.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {columnDeliveries.map((delivery) => (
                <Card
                  key={delivery.id}
                  className="cursor-pointer gap-2 py-3 transition-colors hover:bg-accent/40"
                  onClick={() => onSelect(delivery)}
                >
                  <CardContent className="flex flex-col gap-1 px-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{delivery.id}</span>
                      <span className="text-xs text-muted-foreground">{formatDateDisplay(delivery.scheduledDateISO)}</span>
                    </div>
                    <p className="truncate text-sm">{delivery.customer}</p>
                    <p className="truncate text-xs text-muted-foreground">{delivery.area}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{getRider(delivery.riderId)?.name ?? "Unassigned"}</span>
                      {delivery.isCod && <span className="font-medium">{formatGHS(delivery.codAmount)}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {columnDeliveries.length === 0 && (
                <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">None</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
