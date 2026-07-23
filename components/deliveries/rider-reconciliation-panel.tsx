"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatGHS } from "@/lib/mock-data"
import { getRider, type Delivery } from "@/lib/deliveries-data"
import { TODAY_ISO } from "@/lib/period-utils"

interface RiderRow {
  riderId: string
  riderName: string
  completed: number
  expected: number
  collected: number
}

export function RiderReconciliationPanel({ deliveries }: { deliveries: Delivery[] }) {
  const [reconciled, setReconciled] = useState<Record<string, string>>({})

  const todays = deliveries.filter((d) => d.scheduledDateISO === TODAY_ISO && d.riderId && d.status !== "Cancelled")
  const byRider = new Map<string, RiderRow>()

  for (const delivery of todays) {
    const riderId = delivery.riderId!
    const rider = getRider(riderId)
    const row = byRider.get(riderId) ?? { riderId, riderName: rider?.name ?? riderId, completed: 0, expected: 0, collected: 0 }
    if (delivery.status === "Delivered") row.completed += 1
    if (delivery.isCod && delivery.status !== "Failed") row.expected += delivery.codAmount
    if (delivery.proof?.cashCollected) row.collected += delivery.proof.cashCollected
    byRider.set(riderId, row)
  }

  const rows = Array.from(byRider.values())

  function handleReconcile(riderId: string) {
    setReconciled((prev) => ({ ...prev, [riderId]: "6:15 pm by Adwoa" }))
  }

  if (rows.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans">Rider cash — today</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col divide-y px-0 sm:px-6">
        {rows.map((row) => {
          const diff = row.collected - row.expected
          const isReconciled = Boolean(reconciled[row.riderId])
          return (
            <div key={row.riderId} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{row.riderName}</p>
                <p className="text-sm text-muted-foreground">{row.completed} delivered today</p>
                {isReconciled && <p className="text-xs text-muted-foreground">Reconciled {reconciled[row.riderId]}</p>}
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Expected</p>
                  <p>{formatGHS(row.expected)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Collected</p>
                  <p>{formatGHS(row.collected)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Difference</p>
                  <p className={cn("font-medium", diff !== 0 && "text-destructive")}>
                    {diff === 0 ? formatGHS(0) : `${diff > 0 ? "+" : "−"}${formatGHS(Math.abs(diff))}`}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleReconcile(row.riderId)} disabled={isReconciled}>
                  {isReconciled ? "Reconciled" : "Mark reconciled"}
                </Button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
