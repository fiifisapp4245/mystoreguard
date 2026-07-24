"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { LayoutGrid, List, Plus, Zap } from "lucide-react"
import { toast } from "sonner"

import { LiveResultCount } from "@/components/dashboard/live-result-count"
import { StatusBadge, type StatusTone } from "@/components/dashboard/status-badge"
import { TeachingEmptyState } from "@/components/dashboard/teaching-empty-state"
import { NewTaskDialog } from "@/components/workflow/new-task-dialog"
import { TaskDetailSheet } from "@/components/workflow/task-detail-sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { STAFF_ROLES, initials, type StaffRole } from "@/lib/mock-data"
import { formatDateDisplay } from "@/lib/period-utils"
import { cn } from "@/lib/utils"
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  bulkCompleteTask,
  bulkReassignTasks,
  dueBucketFor,
  getTask,
  getTasksStore,
  type TaskCategory,
  type TaskPriority,
  type TaskSource,
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

/** Acting on behalf of the store while triaging all tasks — Owner by default, matching the demo's default "viewing as" role. */
const CURRENT_USER = CURRENT_USER_BY_ROLE.Owner

type AssigneeFilter = "All" | StaffRole
type StatusFilter = "All" | TaskStatus
type SourceFilter = "All" | TaskSource
type PriorityFilter = "All" | TaskPriority
type CategoryFilter = "All" | TaskCategory
type ViewMode = "list" | "board"

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

export function AllTasksTab() {
  const [tasks, setTasks] = useState<WorkflowTask[]>(() => getTasksStore())
  const [view, setView] = useState<ViewMode>("list")

  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>("All")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All")
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("All")
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("All")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All")
  const [dueFrom, setDueFrom] = useState("")
  const [dueTo, setDueTo] = useState("")

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null)
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [bulkReassignRole, setBulkReassignRole] = useState<StaffRole>("Owner")

  function refresh() {
    setTasks([...getTasksStore()])
    setSelectedTask((current) => (current ? getTask(current.id) ?? null : current))
  }

  const categories = useMemo(() => Array.from(new Set(tasks.map((t) => t.category))).sort(), [tasks])

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => assigneeFilter === "All" || t.assigneeRole === assigneeFilter)
      .filter((t) => statusFilter === "All" || t.status === statusFilter)
      .filter((t) => sourceFilter === "All" || t.source === sourceFilter)
      .filter((t) => priorityFilter === "All" || t.priority === priorityFilter)
      .filter((t) => categoryFilter === "All" || t.category === categoryFilter)
      .filter((t) => {
        if (!dueFrom && !dueTo) return true
        if (!t.dueDateISO) return false
        if (dueFrom && t.dueDateISO < dueFrom) return false
        if (dueTo && t.dueDateISO > dueTo) return false
        return true
      })
      .sort((a, b) => b.createdDateISO.localeCompare(a.createdDateISO) || b.id.localeCompare(a.id))
  }, [tasks, assigneeFilter, statusFilter, sourceFilter, priorityFilter, categoryFilter, dueFrom, dueTo])

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.length === filtered.length ? [] : filtered.map((t) => t.id)))
  }

  function handleBulkComplete() {
    if (selectedIds.length === 0) return
    const count = selectedIds.length
    bulkCompleteTask(selectedIds, CURRENT_USER)
    refresh()
    toast.success(`${count} task${count === 1 ? "" : "s"} completed`)
    setSelectedIds([])
  }

  function handleBulkReassign() {
    if (selectedIds.length === 0) return
    const count = selectedIds.length
    bulkReassignTasks(selectedIds, bulkReassignRole)
    refresh()
    toast.success(`${count} task${count === 1 ? "" : "s"} reassigned to ${bulkReassignRole}`)
    setSelectedIds([])
  }

  function handleCreated() {
    refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={assigneeFilter} onValueChange={(v) => setAssigneeFilter(v as AssigneeFilter)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All assignees</SelectItem>
              {STAFF_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All statuses</SelectItem>
              {TASK_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as SourceFilter)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All sources</SelectItem>
              <SelectItem value="Automatic">Automatic</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as PriorityFilter)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All priorities</SelectItem>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All modules</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5">
            <Input type="date" value={dueFrom} onChange={(e) => setDueFrom(e.target.value)} className="w-36" aria-label="Due from" />
            <span className="text-xs text-muted-foreground">to</span>
            <Input type="date" value={dueTo} onChange={(e) => setDueTo(e.target.value)} className="w-36" aria-label="Due to" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as ViewMode)} variant="outline">
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="board" aria-label="Board view">
              <LayoutGrid className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button onClick={() => setNewTaskOpen(true)}>
            <Plus />
            New task
          </Button>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-2 text-sm">
            <span className="font-medium">{selectedIds.length} selected</span>
            <Select value={bulkReassignRole} onValueChange={(v) => setBulkReassignRole(v as StaffRole)}>
              <SelectTrigger className="w-36">
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
            <Button size="sm" variant="outline" onClick={handleBulkReassign}>
              Reassign selected
            </Button>
            <Button size="sm" onClick={handleBulkComplete}>
              Complete selected
            </Button>
          </div>
        )}
      </div>
      <LiveResultCount count={filtered.length} itemLabel="task" />

      {filtered.length === 0 ? (
        <TeachingEmptyState message="Tasks appear here automatically when something needs your attention — low stock, an overdue invoice, a failed delivery." />
      ) : view === "list" ? (
        <div className="overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={selectedIds.length === filtered.length}
                      onChange={toggleSelectAll}
                      aria-label="Select all tasks"
                    />
                  </TableHead>
                  <TableHead className="w-8" />
                  <TableHead>Task</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((task) => (
                  <TableRow key={task.id} className="cursor-pointer" onClick={() => setSelectedTask(task)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={selectedIds.includes(task.id)}
                        onChange={() => toggleSelected(task.id)}
                        aria-label={`Select ${task.title}`}
                      />
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn("inline-block size-2 rounded-full", priorityDotClass(task.priority))}
                        aria-label={task.priority}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {task.title}
                      {task.relatedRecord && (
                        <Link
                          href={task.relatedRecord.href}
                          onClick={(e) => e.stopPropagation()}
                          className="ml-2 text-xs font-normal text-primary hover:underline"
                        >
                          {task.relatedRecord.label}
                        </Link>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{task.category}</TableCell>
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
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarFallback>{initials(task.assigneeName)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.assigneeName}</span>
                      </div>
                    </TableCell>
                    <TableCell className={cn(dueBucketFor(task) === "Overdue" && "font-medium text-destructive")}>
                      {task.dueDateISO ? formatDateDisplay(task.dueDateISO) : "—"}
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
      ) : (
        <TaskBoard tasks={filtered} onSelect={setSelectedTask} />
      )}

      <TaskDetailSheet
        task={selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        onRefresh={refresh}
        currentUser={CURRENT_USER}
      />

      <NewTaskDialog open={newTaskOpen} onOpenChange={setNewTaskOpen} onCreated={handleCreated} />
    </div>
  )
}

function TaskBoard({ tasks, onSelect }: { tasks: WorkflowTask[]; onSelect: (task: WorkflowTask) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-4">
      {TASK_STATUSES.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status)
        return (
          <div key={status} className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <StatusBadge label={status} tone={statusTone(status)} />
              <span className="text-xs text-muted-foreground">{columnTasks.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {columnTasks.map((task) => (
                <Card
                  key={task.id}
                  className="cursor-pointer gap-2 py-3 transition-colors hover:bg-accent/40"
                  onClick={() => onSelect(task)}
                >
                  <CardContent className="flex flex-col gap-1 px-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn("inline-block size-2 rounded-full", priorityDotClass(task.priority))}
                        aria-label={task.priority}
                      />
                      <span className="text-xs text-muted-foreground">
                        {task.dueDateISO ? formatDateDisplay(task.dueDateISO) : "No due date"}
                      </span>
                    </div>
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{task.assigneeName}</span>
                      {task.source === "Automatic" && <Zap className="size-3 text-muted-foreground" />}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {columnTasks.length === 0 && (
                <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">None</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
