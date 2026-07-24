"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Zap } from "lucide-react"

import { LiveResultCount } from "@/components/dashboard/live-result-count"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge, type StatusTone } from "@/components/dashboard/status-badge"
import { TeachingEmptyState } from "@/components/dashboard/teaching-empty-state"
import { TaskDetailSheet } from "@/components/workflow/task-detail-sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDemoState } from "@/hooks/use-demo-state"
import { initials, type StaffRole } from "@/lib/mock-data"
import { daysBetween, formatDateDisplay, TODAY_ISO } from "@/lib/period-utils"
import { cn } from "@/lib/utils"
import {
  dueBucketFor,
  getTask,
  getTasksStore,
  type DueBucket,
  type TaskPriority,
  type TaskStatus,
  type WorkflowTask,
} from "@/lib/workflow-data"

/** "Current user" acting on a task — matches ASSIGNEE_BY_ROLE inside lib/workflow-data.ts (not exported, replicated here). */
const CURRENT_USER_BY_ROLE: Record<StaffRole, string> = {
  Owner: "Kesewaa Adjei",
  Manager: "Kwabena Owusu",
  Cashier: "Adjoa Boateng",
  Stockkeeper: "Yaw Boadi",
}

const DUE_BUCKETS: DueBucket[] = ["Overdue", "Today", "This week", "Later", "No due date"]

const BUCKET_RANK: Record<DueBucket, number> = {
  Overdue: 0,
  Today: 1,
  "This week": 2,
  Later: 3,
  "No due date": 4,
}

const PRIORITY_RANK: Record<TaskPriority, number> = { Urgent: 0, High: 1, Normal: 2, Low: 3 }
const STATUS_RANK: Record<TaskStatus, number> = { Open: 0, Snoozed: 1, Completed: 2, Cancelled: 3 }

function priorityDotClass(priority: TaskPriority): string {
  if (priority === "Urgent") return "bg-destructive"
  if (priority === "High") return "bg-amber-500"
  if (priority === "Normal") return "bg-muted-foreground/50"
  return "bg-muted-foreground/25"
}

function statusTone(status: TaskStatus): StatusTone {
  if (status === "Completed") return "success"
  if (status === "Snoozed") return "warning"
  return "neutral"
}

type BucketFilter = "All" | DueBucket

export function MyTasksTab() {
  const { state } = useDemoState()
  const searchParams = useSearchParams()

  const [tasks, setTasks] = useState<WorkflowTask[]>(() => getTasksStore())
  const [bucketFilter, setBucketFilter] = useState<BucketFilter>("All")
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null)
  const [didAutoOpen, setDidAutoOpen] = useState(false)

  const currentUser = CURRENT_USER_BY_ROLE[state.role]

  function refresh() {
    setTasks([...getTasksStore()])
    setSelectedTask((current) => (current ? getTask(current.id) ?? null : current))
  }

  // Deep-link support: the header task bell and Dashboard panel link here
  // with ?task=<id> to open a specific task on load. One-time on mount —
  // adjusting state during render rather than in an effect, matching this
  // codebase's established idiom for reacting to a changed prop/param.
  if (!didAutoOpen) {
    setDidAutoOpen(true)
    const taskId = searchParams.get("task")
    if (taskId) {
      const found = getTask(taskId)
      if (found) setSelectedTask(found)
    }
  }

  const roleTasks = useMemo(() => tasks.filter((t) => t.assigneeRole === state.role), [tasks, state.role])

  const stats = useMemo(() => {
    const open = roleTasks.filter((t) => t.status === "Open" || t.status === "Snoozed")
    const dueToday = open.filter((t) => dueBucketFor(t) === "Today").length
    const overdue = open.filter((t) => dueBucketFor(t) === "Overdue").length
    const completedThisWeek = roleTasks.filter(
      (t) => t.status === "Completed" && t.completedDateISO && daysBetween(t.completedDateISO, TODAY_ISO) >= 0 && daysBetween(t.completedDateISO, TODAY_ISO) <= 7
    ).length

    return [
      { label: "Open", caption: "as of now", value: String(open.length) },
      { label: "Due today", caption: "as of now", value: String(dueToday) },
      { label: "Overdue", caption: "as of now", value: String(overdue) },
      { label: "Completed", caption: "this week", value: String(completedThisWeek) },
    ]
  }, [roleTasks])

  const bucketCounts = useMemo(() => {
    const counts: Record<DueBucket, number> = { Overdue: 0, Today: 0, "This week": 0, Later: 0, "No due date": 0 }
    roleTasks.forEach((t) => {
      counts[dueBucketFor(t)] += 1
    })
    return counts
  }, [roleTasks])

  const filteredTasks = useMemo(() => {
    return roleTasks
      .filter((t) => bucketFilter === "All" || dueBucketFor(t) === bucketFilter)
      .sort(
        (a, b) =>
          STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
          BUCKET_RANK[dueBucketFor(a)] - BUCKET_RANK[dueBucketFor(b)] ||
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
      )
  }, [roleTasks, bucketFilter])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={bucketFilter === "All" ? "default" : "outline"} onClick={() => setBucketFilter("All")}>
          All ({roleTasks.length})
        </Button>
        {DUE_BUCKETS.map((bucket) => (
          <Button
            key={bucket}
            size="sm"
            variant={bucketFilter === bucket ? "default" : "outline"}
            onClick={() => setBucketFilter(bucket)}
          >
            {bucket} ({bucketCounts[bucket]})
          </Button>
        ))}
      </div>
      <LiveResultCount count={filteredTasks.length} itemLabel="task" />

      {filteredTasks.length === 0 ? (
        <TeachingEmptyState message="Tasks appear here automatically when something needs your attention — low stock, an overdue invoice, a failed delivery." />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Task</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Related record</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id} className="cursor-pointer" onClick={() => setSelectedTask(task)}>
                    <TableCell>
                      <span
                        className={cn("inline-block size-2 rounded-full", priorityDotClass(task.priority))}
                        aria-label={task.priority}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      {task.source === "Automatic" ? (
                        <Badge variant="outline" className="gap-1">
                          <Zap className="size-3" />
                          Automatic
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Manual</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.relatedRecord ? (
                        <Link
                          href={task.relatedRecord.href}
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:underline"
                        >
                          {task.relatedRecord.label}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className={cn(dueBucketFor(task) === "Overdue" && "font-medium text-destructive")}>
                      {task.dueDateISO ? formatDateDisplay(task.dueDateISO) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarFallback>{initials(task.assigneeName)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.assigneeName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={task.status} tone={statusTone(task.status)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <TaskDetailSheet
        task={selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        onRefresh={refresh}
        currentUser={currentUser}
      />
    </div>
  )
}
