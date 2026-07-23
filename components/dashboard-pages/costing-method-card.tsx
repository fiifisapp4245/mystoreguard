"use client"

import { useState } from "react"
import { Calculator } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { COSTING_METHOD_OPTIONS, DEFAULT_COSTING_METHOD, type CostingMethod } from "@/lib/settings-data"

export function CostingMethodCard() {
  const [method, setMethod] = useState<CostingMethod>(DEFAULT_COSTING_METHOD)

  return (
    <Card className="sm:col-span-2 lg:col-span-3">
      <CardHeader className="gap-2">
        <div className="flex items-center gap-2">
          <Calculator className="size-4 text-primary" aria-hidden="true" />
          <CardTitle className="font-sans text-base">Inventory costing</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          How the cost of stock on hand is calculated as purchases come in at different prices.
        </p>
        <div className="flex flex-col gap-2">
          {COSTING_METHOD_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMethod(option.id)}
              className={cn(
                "flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
                method === option.id ? "border-primary bg-primary/5" : "hover:bg-accent/40"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{option.label}</span>
                {method === option.id && <span className="text-xs font-medium text-primary">Selected</span>}
              </div>
              <p className="text-xs text-muted-foreground">{option.description}</p>
              {option.caution && <p className="text-xs text-muted-foreground italic">{option.caution}</p>}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Method affects future receipts only.</p>
      </CardContent>
    </Card>
  )
}
