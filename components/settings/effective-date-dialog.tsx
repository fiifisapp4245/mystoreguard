"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ConceptTooltip } from "@/components/help/concept-tooltip"
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
import { addDaysISO, TODAY_ISO } from "@/lib/period-utils"

/**
 * The Class B "add new value" dialog shell — asks for an effective date
 * instead of overwriting. Each section supplies its own value fields as
 * children (a number input, a Select, several fields for a whole snapshot)
 * and reads/writes that value itself; this component only owns the
 * open/close lifecycle, the effective-date field, and the submit gate.
 */
export function EffectiveDateDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  canSubmit,
  onSubmit,
  submitLabel = "Add new rate",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: (effectiveFromISO: string) => React.ReactNode
  canSubmit: boolean
  onSubmit: (effectiveFromISO: string) => void
  submitLabel?: string
}) {
  const [effectiveFromISO, setEffectiveFromISO] = useState(() => addDaysISO(TODAY_ISO, 1))
  const [prevOpen, setPrevOpen] = useState(open)

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setEffectiveFromISO(addDaysISO(TODAY_ISO, 1))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {children(effectiveFromISO)}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="effective-from" className="flex items-center gap-1">
              Effective from <ConceptTooltip conceptKey="effective-date" />
            </Label>
            <Input id="effective-from" type="date" value={effectiveFromISO} onChange={(e) => setEffectiveFromISO(e.target.value)} />
            <p className="text-xs text-muted-foreground">Documents created before this date keep the old value.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit || !effectiveFromISO} onClick={() => onSubmit(effectiveFromISO)}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
