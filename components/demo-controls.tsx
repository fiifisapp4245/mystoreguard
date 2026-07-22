"use client"

import * as React from "react"
import { ChevronDown, SlidersHorizontal } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DemoState } from "@/hooks/use-demo-state"
import { TIER_LABEL, type Tier } from "@/lib/modules"

function ControlRow({
  label,
  leftLabel,
  rightLabel,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string
  leftLabel: string
  rightLabel: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-xs ${!checked ? "font-medium text-foreground" : "text-muted-foreground"}`}>
          {leftLabel}
        </span>
        <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
        <span className={`text-xs ${checked ? "font-medium text-foreground" : "text-muted-foreground"}`}>
          {rightLabel}
        </span>
      </div>
    </div>
  )
}

export function DemoControls({
  state,
  update,
}: {
  state: DemoState
  update: (patch: Partial<DemoState>) => void
}) {
  const [open, setOpen] = React.useState(true)
  const groupedOnly = state.nav !== "grouped"

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-50 shadow-lg"
        size="sm"
      >
        <SlidersHorizontal className="size-4" />
        Demo controls
      </Button>
    )
  }

  return (
    <Card className="fixed right-4 bottom-4 z-50 w-80 gap-4 py-4 shadow-lg">
      <CardHeader className="px-4">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="size-4" />
            Demo controls
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => setOpen(false)}
            aria-label="Collapse demo controls"
          >
            <ChevronDown className="size-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-4">
        <ControlRow
          label="Sidebar structure"
          leftLabel="Current (flat)"
          rightLabel="Proposed (grouped)"
          checked={state.nav === "grouped"}
          onCheckedChange={(checked) => update({ nav: checked ? "grouped" : "flat" })}
        />

        <Separator />

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-foreground">Viewing as tier</span>
          <Select value={state.tier} onValueChange={(value) => update({ tier: value as Tier })}>
            <SelectTrigger size="sm" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(TIER_LABEL) as Tier[]).map((tier) => (
                <SelectItem key={tier} value={tier}>
                  {TIER_LABEL[tier]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ControlRow
          label="Locked modules"
          leftLabel="Hidden"
          rightLabel="Greyed + badge"
          checked={state.lockMode === "greyed"}
          onCheckedChange={(checked) => update({ lockMode: checked ? "greyed" : "hidden" })}
        />

        <Separator />

        <ControlRow
          label="Estimator location"
          leftLabel="Sell"
          rightLabel="System"
          checked={state.estimatorLocation === "system"}
          onCheckedChange={(checked) => update({ estimatorLocation: checked ? "system" : "sell" })}
          disabled={groupedOnly}
        />

        <ControlRow
          label="Message location"
          leftLabel="Grow"
          rightLabel="Bottom utility"
          checked={state.messageLocation === "bottom"}
          onCheckedChange={(checked) => update({ messageLocation: checked ? "bottom" : "grow" })}
          disabled={groupedOnly}
        />

        {groupedOnly && (
          <p className="text-xs text-muted-foreground">
            Estimator and Message placement only apply to the proposed grouped structure.
          </p>
        )}

        <Separator />

        <ControlRow
          label="Store state"
          leftLabel="Established"
          rightLabel="New store"
          checked={state.storeState === "new"}
          onCheckedChange={(checked) => update({ storeState: checked ? "new" : "established" })}
        />
      </CardContent>
    </Card>
  )
}
