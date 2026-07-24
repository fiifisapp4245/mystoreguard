"use client"

import { useMemo, useState } from "react"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  createSegment,
  getLoyaltyMembersStore,
  segmentMembers,
  updateSegment,
  SEGMENT_FIELD_LABELS,
  SEGMENT_OPERATOR_LABELS,
  type Segment,
  type SegmentCondition,
  type SegmentField,
  type SegmentMatchType,
  type SegmentOperator,
} from "@/lib/loyalty-data"

export type SegmentDialogTarget = { mode: "create" } | { mode: "edit"; segment: Segment } | null

const FIELD_OPTIONS = Object.keys(SEGMENT_FIELD_LABELS) as SegmentField[]
const OPERATOR_OPTIONS = Object.keys(SEGMENT_OPERATOR_LABELS) as SegmentOperator[]

function blankCondition(): SegmentCondition {
  return { field: FIELD_OPTIONS[0], operator: "gt", value: 0 }
}

function targetKey(target: SegmentDialogTarget): string | null {
  if (!target) return null
  return target.mode === "create" ? "new" : target.segment.id
}

export function SegmentRuleDialog({
  target,
  onOpenChange,
  onSaved,
}: {
  target: SegmentDialogTarget
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [name, setName] = useState("")
  const [conditions, setConditions] = useState<SegmentCondition[]>([blankCondition()])
  const [matchType, setMatchType] = useState<SegmentMatchType>("all")
  const [prevKey, setPrevKey] = useState<string | null>(null)

  const key = targetKey(target)
  if (key !== prevKey) {
    setPrevKey(key)
    if (target?.mode === "edit") {
      setName(target.segment.name)
      setConditions(target.segment.conditions.length > 0 ? target.segment.conditions.map((c) => ({ ...c })) : [blankCondition()])
      setMatchType(target.segment.matchType)
    } else if (target?.mode === "create") {
      setName("")
      setConditions([blankCondition()])
      setMatchType("all")
    }
  }

  const matchingCount = useMemo(
    () => segmentMembers({ conditions, matchType }, getLoyaltyMembersStore()).length,
    [conditions, matchType]
  )

  const missingFields = [!name.trim() && "a segment name"].filter(Boolean) as string[]
  const canSave = missingFields.length === 0

  function updateCondition(index: number, patch: Partial<SegmentCondition>) {
    setConditions((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  function addCondition() {
    setConditions((prev) => [...prev, blankCondition()])
  }

  function removeCondition(index: number) {
    setConditions((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSave() {
    if (!canSave || !target) return
    if (target.mode === "create") {
      createSegment({ name: name.trim(), conditions, matchType })
    } else {
      updateSegment(target.segment.id, { name: name.trim(), conditions, matchType })
    }
    onSaved()
  }

  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{target?.mode === "edit" ? "Edit segment" : "Create segment"}</DialogTitle>
          <DialogDescription>Build a rule out of one or more conditions on member data.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="segment-name">Segment name</Label>
            <Input id="segment-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Big spenders" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Conditions</Label>
              {conditions.length > 1 && (
                <div className="inline-flex rounded-md border p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setMatchType("all")}
                    className={cn(
                      "rounded px-2 py-1 font-medium transition-colors",
                      matchType === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Match all
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchType("any")}
                    className={cn(
                      "rounded px-2 py-1 font-medium transition-colors",
                      matchType === "any" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Match any
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select value={condition.field} onValueChange={(v) => updateCondition(index, { field: v as SegmentField })}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_OPTIONS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {SEGMENT_FIELD_LABELS[f]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={condition.operator}
                    onValueChange={(v) => updateCondition(index, { operator: v as SegmentOperator })}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATOR_OPTIONS.map((op) => (
                        <SelectItem key={op} value={op}>
                          {SEGMENT_OPERATOR_LABELS[op]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={condition.value}
                    onChange={(e) => updateCondition(index, { value: Number.parseFloat(e.target.value) || 0 })}
                    className="w-24"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove condition"
                    onClick={() => removeCondition(index)}
                    disabled={conditions.length === 0}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" className="self-start" onClick={addCondition}>
              <Plus />
              Add another condition
            </Button>
          </div>

          <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium">
            {matchingCount} {matchingCount === 1 ? "customer matches" : "customers match"}
          </p>
        </div>

        {!canSave && missingFields.length > 0 && (
          <p className="text-right text-xs text-muted-foreground">Still needs: {missingFields.join(", ")}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {target?.mode === "edit" ? "Save changes" : "Create segment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
