"use client"

import { useState } from "react"
import { Percent } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DEFAULT_TAX_MODE, INITIAL_TAX_RATES, type TaxMode } from "@/lib/settings-data"

export function TaxSettingsCard() {
  const [rates, setRates] = useState(INITIAL_TAX_RATES)
  const [mode, setMode] = useState<TaxMode>(DEFAULT_TAX_MODE)

  function toggleRate(id: string) {
    setRates((prev) => prev.map((rate) => (rate.id === id ? { ...rate, enabled: !rate.enabled } : rate)))
  }

  return (
    <Card className="sm:col-span-2 lg:col-span-3">
      <CardHeader className="gap-2">
        <div className="flex items-center gap-2">
          <Percent className="size-4 text-primary" aria-hidden="true" />
          <CardTitle className="font-sans text-base">Tax</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          These rates flow into every invoice automatically — they&apos;re never typed per document.
        </p>
        <div className="flex flex-col gap-3">
          {rates.map((rate) => (
            <div key={rate.id} className="flex items-center justify-between gap-3">
              <Label htmlFor={`tax-${rate.id}`} className="text-sm font-normal">
                {rate.label} · {rate.ratePercent}%
              </Label>
              <Switch
                id={`tax-${rate.id}`}
                checked={rate.enabled}
                onCheckedChange={() => toggleRate(rate.id)}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <Label htmlFor="tax-mode" className="text-sm font-normal">
            Prices are tax exclusive
          </Label>
          <Switch
            id="tax-mode"
            checked={mode === "exclusive"}
            onCheckedChange={(checked) => setMode(checked ? "exclusive" : "inclusive")}
          />
        </div>
      </CardContent>
    </Card>
  )
}
