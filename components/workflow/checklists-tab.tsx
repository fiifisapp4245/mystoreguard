"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatDateDisplay } from "@/lib/period-utils"
import {
  completionRateFor,
  getChecklistTemplates,
  lastRunFor,
  type ChecklistTemplate,
} from "@/lib/workflow-data"
import { ChecklistBuilderDialog } from "@/components/workflow/checklist-builder-dialog"

const WARNING_THRESHOLD = 80

function scheduleLabel(template: ChecklistTemplate): string {
  return template.timeOfDay ? `${template.schedule} · ${template.timeOfDay}` : template.schedule
}

function assigneeLabel(template: ChecklistTemplate): string {
  return template.assigneeName ?? template.assigneeRole
}

export function ChecklistsTab() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>(() => getChecklistTemplates())
  const [builderOpen, setBuilderOpen] = useState(false)

  function refresh() {
    setTemplates([...getChecklistTemplates()])
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          A running checklist appears in My tasks as a single task with sub-items ticked off individually.
        </p>
        <Button onClick={() => setBuilderOpen(true)} className="self-start sm:self-auto">
          <Plus />
          New checklist
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Steps</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Last run</TableHead>
                <TableHead>Completion rate (30 days)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => {
                const rate = completionRateFor(template.id)
                const lastRun = lastRunFor(template.id)
                const isWarning = rate < WARNING_THRESHOLD

                return (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{template.name}</span>
                        <span className="text-xs text-muted-foreground">{template.description}</span>
                      </div>
                    </TableCell>
                    <TableCell>{template.steps.length}</TableCell>
                    <TableCell>{scheduleLabel(template)}</TableCell>
                    <TableCell>{assigneeLabel(template)}</TableCell>
                    <TableCell>
                      {lastRun ? (
                        <div className="flex flex-col">
                          <span>{formatDateDisplay(lastRun.dateISO)}</span>
                          <span className="text-xs text-muted-foreground">
                            {lastRun.completed ? "Completed" : "Skipped"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No runs yet</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn("h-full rounded-full", isWarning ? "bg-amber-500" : "bg-success")}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            "text-sm font-semibold tabular-nums",
                            isWarning && "text-amber-600 dark:text-amber-400"
                          )}
                        >
                          {rate}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <ChecklistBuilderDialog open={builderOpen} onOpenChange={setBuilderOpen} onCreated={refresh} />
    </div>
  )
}
