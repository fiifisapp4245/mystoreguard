"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"

import { StatusBadge, type StatusTone } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getWorkflowRules, toggleWorkflowRule, type TaskPriority, type WorkflowRule } from "@/lib/workflow-data"
import { RuleEditDialog } from "@/components/workflow/rule-edit-dialog"

const PRIORITY_TONE: Record<TaskPriority, StatusTone> = {
  Urgent: "danger",
  High: "warning",
  Normal: "neutral",
  Low: "neutral",
}

export function RulesTab() {
  const [rules, setRules] = useState<WorkflowRule[]>(() => getWorkflowRules())
  const [editTarget, setEditTarget] = useState<WorkflowRule | null>(null)

  function refresh() {
    setRules([...getWorkflowRules()])
  }

  function handleToggle(key: string) {
    toggleWorkflowRule(key)
    refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        These tasks are created by the system from what it already knows. You don&apos;t have to remember them.
      </p>

      <div className="overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">On</TableHead>
                <TableHead>Rule</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Raised this month</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.key}>
                  <TableCell>
                    <Switch checked={rule.enabled} onCheckedChange={() => handleToggle(rule.key)} aria-label={`Toggle ${rule.label}`} />
                  </TableCell>
                  <TableCell className="font-medium">{rule.label}</TableCell>
                  <TableCell>{rule.assigneeRole}</TableCell>
                  <TableCell>
                    <StatusBadge label={rule.priority} tone={PRIORITY_TONE[rule.priority]} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{rule.dueOffsetLabel}</TableCell>
                  <TableCell>{rule.tasksRaisedThisMonth}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-sm" aria-label={`Edit ${rule.label}`} onClick={() => setEditTarget(rule)}>
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <RuleEditDialog rule={editTarget} onOpenChange={(open) => !open && setEditTarget(null)} onSaved={refresh} />
    </div>
  )
}
