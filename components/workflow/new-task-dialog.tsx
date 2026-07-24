"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { STAFF_ROLES, type StaffRole } from "@/lib/mock-data"
import { TASK_PRIORITIES, addManualTask, type TaskPriority } from "@/lib/workflow-data"

interface NewTaskFormValues {
  title: string
  description: string
  assigneeRole: StaffRole
  dueDateISO: string
  priority: TaskPriority
  relatedLabel: string
  relatedHref: string
}

const EMPTY_FORM: NewTaskFormValues = {
  title: "",
  description: "",
  assigneeRole: "Owner",
  dueDateISO: "",
  priority: "Normal",
  relatedLabel: "",
  relatedHref: "",
}

export function NewTaskDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const [values, setValues] = useState<NewTaskFormValues>(EMPTY_FORM)
  const [wasOpen, setWasOpen] = useState(open)

  // Reset the form the moment the dialog transitions closed → open, matching
  // PaymentSheet's wasOpen/open idiom (adjust state during render, not in an effect).
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setValues(EMPTY_FORM)
  }

  function update(patch: Partial<NewTaskFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  const canSubmit = values.title.trim() !== "" && values.description.trim() !== ""

  function handleSubmit() {
    if (!canSubmit) return

    const relatedRecord =
      values.relatedLabel.trim() && values.relatedHref.trim()
        ? { label: values.relatedLabel.trim(), href: values.relatedHref.trim() }
        : undefined

    addManualTask({
      title: values.title.trim(),
      description: values.description.trim(),
      assigneeRole: values.assigneeRole,
      dueDateISO: values.dueDateISO || undefined,
      priority: values.priority,
      relatedRecord,
    })
    onCreated()
    toast.success("Task created")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>Add a manual task — not raised automatically by a workflow rule.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-1 pb-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-task-title">Title</Label>
            <Input id="new-task-title" value={values.title} onChange={(e) => update({ title: e.target.value })} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-task-description">Description</Label>
            <Textarea
              id="new-task-description"
              rows={3}
              value={values.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-task-assignee">Assignee</Label>
              <Select value={values.assigneeRole} onValueChange={(v) => update({ assigneeRole: v as StaffRole })}>
                <SelectTrigger id="new-task-assignee" className="w-full">
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
              <Label htmlFor="new-task-priority">Priority</Label>
              <Select value={values.priority} onValueChange={(v) => update({ priority: v as TaskPriority })}>
                <SelectTrigger id="new-task-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-task-due">Due date (optional)</Label>
            <Input
              id="new-task-due"
              type="date"
              value={values.dueDateISO}
              onChange={(e) => update({ dueDateISO: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
            <p className="text-xs text-muted-foreground">
              Link to a record (optional) — e.g. an invoice or purchase order this task relates to.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-task-related-label">Label</Label>
                <Input
                  id="new-task-related-label"
                  placeholder="e.g. INV-2040"
                  value={values.relatedLabel}
                  onChange={(e) => update({ relatedLabel: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-task-related-href">Link</Label>
                <Input
                  id="new-task-related-href"
                  placeholder="e.g. /money/money-owed"
                  value={values.relatedHref}
                  onChange={(e) => update({ relatedHref: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Create task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
