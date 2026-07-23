"use client"

import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatGHS } from "@/lib/mock-data"
import { getRider, type Delivery } from "@/lib/deliveries-data"
import { formatDateDisplay } from "@/lib/period-utils"
import { STORE_INFO } from "@/lib/settings-data"

export function WaybillDialog({
  delivery,
  onOpenChange,
}: {
  delivery: Delivery | null
  onOpenChange: (open: boolean) => void
}) {
  const rider = getRider(delivery?.riderId)
  const total = delivery?.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0) ?? 0

  return (
    <Dialog open={delivery !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Waybill — {delivery?.id}</DialogTitle>
        </DialogHeader>

        {delivery && (
          <div className="flex flex-col gap-4 rounded-lg border bg-white p-5 text-neutral-900">
            <div className="flex items-start justify-between">
              <p className="font-semibold">{STORE_INFO.name}</p>
              <p className="text-sm text-neutral-500">{delivery.id}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-neutral-400 uppercase">Deliver to</p>
                <p className="font-medium">{delivery.customer}</p>
                <p className="text-neutral-500">{delivery.phone}</p>
                <p className="text-neutral-500">{delivery.address}, {delivery.area}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-400 uppercase">Rider</p>
                <p className="font-medium">{rider?.name ?? "Not yet assigned"}</p>
                <p className="text-xs text-neutral-400 uppercase mt-2">Window</p>
                <p className="text-neutral-500">{formatDateDisplay(delivery.scheduledDateISO)} · {delivery.window}</p>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-neutral-400 uppercase">
                  <th className="py-1.5 font-medium">Item</th>
                  <th className="py-1.5 text-right font-medium">Qty</th>
                </tr>
              </thead>
              <tbody>
                {delivery.lineItems.map((line) => (
                  <tr key={line.name} className="border-b border-neutral-100">
                    <td className="py-1.5">{line.name}</td>
                    <td className="py-1.5 text-right">{line.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Cash to collect</span>
              <span className="font-semibold">{delivery.isCod ? formatGHS(delivery.codAmount) : "Prepaid — GHS 0.00"}</span>
            </div>
            <p className="text-xs text-neutral-400">Goods value {formatGHS(total)} · Confirmation code {delivery.confirmationCode}</p>
          </div>
        )}

        <Button variant="outline" onClick={() => window.print()}>
          <Printer />
          Print
        </Button>
      </DialogContent>
    </Dialog>
  )
}
