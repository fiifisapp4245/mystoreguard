"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { STANDARD_PERIOD_OPTIONS, type StandardPeriod } from "@/lib/period-utils"

/** The one period-selector control every module's stat cards use, matching the Dashboard's convention. */
export function PeriodSelect({
  value,
  onValueChange,
  className,
}: {
  value: StandardPeriod
  onValueChange: (value: StandardPeriod) => void
  className?: string
}) {
  return (
    <Select value={value} onValueChange={(next) => onValueChange(next as StandardPeriod)}>
      <SelectTrigger size="sm" className={className ?? "w-36"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STANDARD_PERIOD_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function CustomDateRangeRow({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
        From
        <Input type="date" value={from} onChange={(event) => onFromChange(event.target.value)} className="w-40" />
      </label>
      <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
        To
        <Input type="date" value={to} onChange={(event) => onToChange(event.target.value)} className="w-40" />
      </label>
    </div>
  )
}
