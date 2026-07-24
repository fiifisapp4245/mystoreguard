"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"

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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { STAFF_ROLES, type StaffRole } from "@/lib/mock-data"
import {
  addChecklistTemplate,
  type ChecklistSchedule,
  type ChecklistStepDef,
  type ChecklistTemplate,
} from "@/lib/workflow-data"

const SCHEDULES: ChecklistSchedule[] = ["Daily", "Weekly", "Monthly", "On demand"]

interface StepRow {
  key: string
  instruction: string
  note: string
  requiresValue: boolean
}

let stepKeySequence = 0
function newStepRow(): StepRow {
  stepKeySequence += 1
  return { key: `new-step-${stepKeySequence}`, instruction: "", note: "", requiresValue: false }
}

function emptyState() {
  return {
    name: "",
    description: "",
    assigneeRole: "Cashier" as StaffRole,
    schedule: "Daily" as ChecklistSchedule,
    timeOfDay: "",
    steps: [newStepRow()],
  }
}

export function ChecklistBuilderDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const [values, setValues] = useState(emptyState)
  const [wasOpen, setWasOpen] = useState(open)

  // Reset the form the moment the dialog transitions closed → open, so a
  // fresh checklist never carries over the previous draft's fields.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setValues(emptyState())
    }
  }

  function update(patch: Partial<typeof values>) {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  function updateStep(key: string, patch: Partial<StepRow>) {
    setValues((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.key === key ? { ...s, ...patch } : s)),
    }))
  }

  function addStep() {
    setValues((prev) => ({ ...prev, steps: [...prev.steps, newStepRow()] }))
  }

  function removeStep(key: string) {
    setValues((prev) => ({ ...prev, steps: prev.steps.filter((s) => s.key !== key) }))
  }

  const validSteps = values.steps.filter((s) => s.instruction.trim() !== "")
  const canSubmit = values.name.trim() !== "" && validSteps.length > 0
  const missingFields = [
    values.name.trim() === "" && "a name",
    validSteps.length === 0 && "at least one step with instructions",
  ].filter(Boolean) as string[]

  function handleSubmit() {
    if (!canSubmit) return

    const steps: ChecklistStepDef[] = validSteps.map((s, index) => ({
      id: `s${index + 1}`,
      instruction: s.instruction.trim(),
      note: s.note.trim() || undefined,
      requiresValue: s.requiresValue || undefined,
    }))

    const id = `chk-${values.name.trim().toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`

    const template: ChecklistTemplate = {
      id,
      name: values.name.trim(),
      description: values.description.trim(),
      steps,
      schedule: values.schedule,
      timeOfDay: values.timeOfDay.trim() || undefined,
      assigneeRole: values.assigneeRole,
    }

    addChecklistTemplate(template)
    toast.success("Checklist created", { description: `${template.name} · ${steps.length} step${steps.length === 1 ? "" : "s"}` })
    onCreated()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New checklist</DialogTitle>
          <DialogDescription>
            A reusable routine — it instantiates as a single task with sub-items when it runs.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-1 pb-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="checklist-name">Name</Label>
            <Input id="checklist-name" value={values.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Opening the shop" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="checklist-description">Description</Label>
            <Textarea
              id="checklist-description"
              rows={2}
              value={values.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="What this routine is for"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="checklist-role">Assigned role</Label>
              <Select value={values.assigneeRole} onValueChange={(v) => update({ assigneeRole: v as StaffRole })}>
                <SelectTrigger id="checklist-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="checklist-schedule">Schedule</Label>
              <Select value={values.schedule} onValueChange={(v) => update({ schedule: v as ChecklistSchedule })}>
                <SelectTrigger id="checklist-schedule" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULES.map((schedule) => (
                    <SelectItem key={schedule} value={schedule}>
                      {schedule}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="checklist-time">Time of day (optional)</Label>
            <Input
              id="checklist-time"
              value={values.timeOfDay}
              onChange={(e) => update({ timeOfDay: e.target.value })}
              placeholder="e.g. 7:30 AM"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Steps</Label>
              <Button type="button" variant="outline" size="sm" onClick={addStep}>
                <Plus />
                Add step
              </Button>
            </div>
            <div className="flex flex-col gap-3">
              {values.steps.map((step, index) => (
                <div key={step.key} className="flex flex-col gap-2 rounded-lg border p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex flex-1 flex-col gap-2">
                      <Input
                        value={step.instruction}
                        onChange={(e) => updateStep(step.key, { instruction: e.target.value })}
                        placeholder={`Step ${index + 1} instruction`}
                        aria-label={`Step ${index + 1} instruction`}
                      />
                      <Input
                        value={step.note}
                        onChange={(e) => updateStep(step.key, { note: e.target.value })}
                        placeholder="Note (optional)" aria-label="Note (optional)"
                        className="text-xs"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeStep(step.key)}
                      disabled={values.steps.length === 1}
                      aria-label="Remove step"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                    <span className="text-xs text-muted-foreground">Requires a value</span>
                    <Switch
                      checked={step.requiresValue}
                      onCheckedChange={(checked) => updateStep(step.key, { requiresValue: checked })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex flex-col items-end gap-1">
            {missingFields.length > 0 && (
              <p className="text-xs text-muted-foreground">Still needs: {missingFields.join(", ")}</p>
            )}
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              Create checklist
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
