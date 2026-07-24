"use client"

import { useState } from "react"
import { toast } from "sonner"

import { SettingsSectionCard } from "@/components/settings/settings-section-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { getStockRulesSettings, setStockRulesSettings, type StockRulesSettings } from "@/lib/stock-rules-data"

/** Class C — store-wide stock behaviour defaults, freely editable going forward. */
export function StockRulesSection() {
  const [settings, setSettings] = useState<StockRulesSettings>(() => getStockRulesSettings())

  function update<K extends keyof StockRulesSettings>(key: K, value: StockRulesSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    setStockRulesSettings(settings)
    toast.success("Stock rules saved")
  }

  return (
    <SettingsSectionCard title="Stock rules" settingClass="C" description="Store-wide defaults for how stock behaves at the register and during counts.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="default-reorder-point">Default reorder point</Label>
          <Input
            id="default-reorder-point"
            type="number"
            value={settings.defaultReorderPoint}
            onChange={(e) => update("defaultReorderPoint", Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="low-stock-alert-threshold">Low-stock alert threshold</Label>
          <Input
            id="low-stock-alert-threshold"
            type="number"
            value={settings.lowStockAlertThreshold}
            onChange={(e) => update("lowStockAlertThreshold", Number(e.target.value))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="allow-negative-stock">Allow negative stock</Label>
          <Switch
            id="allow-negative-stock"
            checked={settings.allowNegativeStock}
            onCheckedChange={(checked) => update("allowNegativeStock", checked)}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="register-zero-stock">Register can sell items with zero stock</Label>
          <Switch
            id="register-zero-stock"
            checked={settings.registerCanSellAtZeroStock}
            onCheckedChange={(checked) => update("registerCanSellAtZeroStock", checked)}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="stocktake-blind-counting">Stocktake blind counting on by default</Label>
          <Switch
            id="stocktake-blind-counting"
            checked={settings.stocktakeBlindCountingDefault}
            onCheckedChange={(checked) => update("stocktakeBlindCountingDefault", checked)}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="auto-split-register">Auto-split stock at the register</Label>
          <Switch
            id="auto-split-register"
            checked={settings.autoSplitAtRegister}
            onCheckedChange={(checked) => update("autoSplitAtRegister", checked)}
          />
        </div>
      </div>

      <div>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </SettingsSectionCard>
  )
}
