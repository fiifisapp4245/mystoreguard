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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { STAFF_ROLES, type StaffRole } from "@/lib/mock-data"
import { TASK_PRIORITIES, updateWorkflowRule, type TaskPriority, type WorkflowRule } from "@/lib/workflow-data"

export function RuleEditDialog({
  rule,
  onOpenChange,
  onSaved,
}: {
  rule: WorkflowRule | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [assigneeRole, setAssigneeRole] = useState<StaffRole>("Owner")
  const [priority, setPriority] = useState<TaskPriority>("Normal")
  const [dueOffsetLabel, setDueOffsetLabel] = useState("")
  const [titleTemplate, setTitleTemplate] = useState("")
  const [notifyBySms, setNotifyBySms] = useState(false)
  const [prevKey, setPrevKey] = useState<string | null>(null)

  if (rule && rule.key !== prevKey) {
    setPrevKey(rule.key)
    setAssigneeRole(rule.assigneeRole)
    setPriority(rule.priority)
    setDueOffsetLabel(rule.dueOffsetLabel)
    setTitleTemplate(rule.titleTemplate)
    setNotifyBySms(rule.notifyBySms)
  }

  function handleSave() {
    if (!rule) return
    updateWorkflowRule(rule.key, { assigneeRole, priority, dueOffsetLabel, titleTemplate, notifyBySms })
    toast.success("Rule updated", { description: rule.label })
    onSaved()
    onOpenChange(false)
  }

  return (
    <Dialog open={rule !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {rule && (
          <>
            <DialogHeader>
              <DialogTitle>Edit rule</DialogTitle>
              <DialogDescription>{rule.label}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="rule-role">Assignee role</Label>
                  <Select value={assigneeRole} onValueChange={(v) => setAssigneeRole(v as StaffRole)}>
                    <SelectTrigger id="rule-role" className="w-full">
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
                  <Label htmlFor="rule-priority">Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                    <SelectTrigger id="rule-priority" className="w-full">
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
                <Label htmlFor="rule-due-offset">Due offset</Label>
                <Input
                  id="rule-due-offset"
                  value={dueOffsetLabel}
                  onChange={(e) => setDueOffsetLabel(e.target.value)}
                  placeholder="e.g. 2 days, Immediate, Next day"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rule-title-template">Title template</Label>
                <Textarea
                  id="rule-title-template"
                  rows={2}
                  value={titleTemplate}
                  onChange={(e) => setTitleTemplate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Merge fields: {"{product}"}, {"{customer}"}, {"{amount}"}, {"{document no.}"}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Also notify by SMS</p>
                  <p className="text-xs text-muted-foreground">Sends via the same template system as Message → Automated.</p>
                </div>
                <Switch checked={notifyBySms} onCheckedChange={setNotifyBySms} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save changes</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
