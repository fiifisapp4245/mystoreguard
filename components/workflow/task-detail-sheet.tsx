"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, Clock, ExternalLink, RotateCcw, Zap } from "lucide-react"
import { toast } from "sonner"

import { StatusBadge, type StatusTone } from "@/components/dashboard/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { STAFF_ROLES, initials, type StaffRole } from "@/lib/mock-data"
import { formatDateDisplay } from "@/lib/period-utils"
import { cn } from "@/lib/utils"
import {
  TASK_PRIORITIES,
  addTaskComment,
  changeTaskDueDate,
  changeTaskPriority,
  completeTask,
  dueBucketFor,
  reassignTask,
  reopenTask,
  snoozeTask,
  toggleSubItem,
  type SnoozeOption,
  type TaskPriority,
  type TaskStatus,
  type WorkflowTask,
} from "@/lib/workflow-data"

function priorityTone(priority: TaskPriority): StatusTone {
  if (priority === "Urgent") return "danger"
  if (priority === "High") return "warning"
  return "neutral"
}

function statusTone(status: TaskStatus): StatusTone {
  if (status === "Completed") return "success"
  if (status === "Snoozed") return "warning"
  return "neutral"
}

const SNOOZE_LABEL: Record<SnoozeOption, string> = {
  tomorrow: "Snoozed until tomorrow",
  "3-days": "Snoozed for 3 days",
  "next-week": "Snoozed until next week",
}

/** Shared task detail sheet — used by both My tasks and All tasks. */
export function TaskDetailSheet({
  task,
  onOpenChange,
  onRefresh,
  currentUser,
}: {
  task: WorkflowTask | null
  onOpenChange: (open: boolean) => void
  onRefresh: () => void
  currentUser: string
}) {
  const [prevTaskId, setPrevTaskId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState("")
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [completeNote, setCompleteNote] = useState("")
  const [reassignRole, setReassignRole] = useState<StaffRole>("Owner")
  const [subItemDrafts, setSubItemDrafts] = useState<Record<string, string>>({})

  const currentId = task?.id ?? null

  // Reset local drafts each time a different task is opened — adjusting
  // state during render rather than in an effect, matching this codebase's
  // established idiom (see ExpenseFormDialog in expenses-tab.tsx).
  if (currentId !== prevTaskId) {
    setPrevTaskId(currentId)
    setCommentText("")
    setCompleteDialogOpen(false)
    setCompleteNote("")
    setReassignRole(task?.assigneeRole ?? "Owner")
    setSubItemDrafts(Object.fromEntries((task?.subItems ?? []).map((s) => [s.id, s.value ?? ""])))
  }

  function handleComplete() {
    if (!task) return
    completeTask(task.id, currentUser, completeNote.trim() || undefined)
    onRefresh()
    toast.success("Task completed")
    setCompleteDialogOpen(false)
    onOpenChange(false)
  }

  function handleReopen() {
    if (!task) return
    reopenTask(task.id)
    onRefresh()
    toast.success("Task reopened")
  }

  function handleSnooze(option: SnoozeOption) {
    if (!task) return
    snoozeTask(task.id, option)
    onRefresh()
    toast.success(SNOOZE_LABEL[option])
  }

  function handleReassign() {
    if (!task) return
    reassignTask(task.id, reassignRole)
    onRefresh()
    toast.success("Task reassigned", { description: `Now assigned to ${reassignRole}.` })
  }

  function handlePriorityChange(priority: TaskPriority) {
    if (!task) return
    changeTaskPriority(task.id, priority)
    onRefresh()
  }

  function handleDueDateChange(value: string) {
    if (!task) return
    changeTaskDueDate(task.id, value)
    onRefresh()
  }

  function handleToggleSubItem(subItemId: string) {
    if (!task) return
    const draft = subItemDrafts[subItemId]
    toggleSubItem(task.id, subItemId, draft || undefined)
    onRefresh()
  }

  function handleAddComment() {
    if (!task || !commentText.trim()) return
    addTaskComment(task.id, currentUser, commentText.trim())
    onRefresh()
    setCommentText("")
  }

  const doneCount = task?.subItems?.filter((s) => s.done).length ?? 0
  const totalSubItems = task?.subItems?.length ?? 0
  const progressPercent = totalSubItems > 0 ? Math.round((doneCount / totalSubItems) * 100) : 0

  return (
    <>
      <Sheet open={task !== null} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg">
          {task && (
            <>
              <SheetHeader>
                <SheetTitle className="font-sans">{task.title}</SheetTitle>
                <SheetDescription>{task.description}</SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
                <div className="flex flex-col gap-3 rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={task.priority} tone={priorityTone(task.priority)} />
                    <StatusBadge label={task.status} tone={statusTone(task.status)} />
                    {task.source === "Automatic" ? (
                      <Badge variant="outline" className="gap-1">
                        <Zap className="size-3" />
                        Automatic
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Manual</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Assigned to</span>
                    <span className="flex items-center gap-2 font-medium">
                      <Avatar size="sm">
                        <AvatarFallback>{initials(task.assigneeName)}</AvatarFallback>
                      </Avatar>
                      {task.assigneeName}
                      <span className="text-xs font-normal text-muted-foreground">({task.assigneeRole})</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Due date</span>
                    <span className={cn("font-medium", dueBucketFor(task) === "Overdue" && "text-destructive")}>
                      {task.dueDateISO ? formatDateDisplay(task.dueDateISO) : "No due date"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{formatDateDisplay(task.createdDateISO)}</span>
                  </div>
                  {task.relatedRecord && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Related record</span>
                      <Link
                        href={task.relatedRecord.href}
                        className="flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        {task.relatedRecord.label}
                        <ExternalLink className="size-3" />
                      </Link>
                    </div>
                  )}
                  {task.completedDateISO && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="font-medium">
                        {formatDateDisplay(task.completedDateISO)}
                        {task.completedBy ? ` by ${task.completedBy}` : ""}
                      </span>
                    </div>
                  )}
                  {task.completionNote && (
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Completion note</span>
                      <span>{task.completionNote}</span>
                    </div>
                  )}
                </div>

                {task.subItems && task.subItems.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Checklist</p>
                      <span className="text-xs text-muted-foreground">
                        {doneCount} of {totalSubItems} complete
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="flex flex-col divide-y rounded-lg border">
                      {task.subItems.map((subItem) => (
                        <div key={subItem.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            aria-label={subItem.done ? `Mark "${subItem.label}" not done` : `Mark "${subItem.label}" done`}
                            onClick={() => handleToggleSubItem(subItem.id)}
                          >
                            {subItem.done && <CheckCircle2 className="size-4 text-success" />}
                          </Button>
                          <span className={cn("flex-1", subItem.done && "text-muted-foreground line-through")}>
                            {subItem.label}
                          </span>
                          {subItem.requiresValue && (
                            <Input
                              className="h-8 w-32"
                              placeholder="Value"
                              value={subItemDrafts[subItem.id] ?? ""}
                              onChange={(e) =>
                                setSubItemDrafts((prev) => ({ ...prev, [subItem.id]: e.target.value }))
                              }
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 rounded-lg border p-3">
                  <p className="text-sm font-medium">Actions</p>
                  <div className="flex flex-wrap gap-2">
                    {(task.status === "Open" || task.status === "Snoozed") && (
                      <Button size="sm" onClick={() => setCompleteDialogOpen(true)}>
                        <CheckCircle2 />
                        Complete
                      </Button>
                    )}
                    {task.status === "Completed" && (
                      <Button size="sm" variant="outline" onClick={handleReopen}>
                        <RotateCcw />
                        Reopen
                      </Button>
                    )}
                    {task.status === "Open" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Clock />
                            Snooze
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => handleSnooze("tomorrow")}>Until tomorrow</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSnooze("3-days")}>3 days</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSnooze("next-week")}>Next week</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <Label htmlFor="task-reassign">Reassign to</Label>
                      <div className="flex gap-2">
                        <Select value={reassignRole} onValueChange={(v) => setReassignRole(v as StaffRole)}>
                          <SelectTrigger id="task-reassign" className="w-full">
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
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={reassignRole === task.assigneeRole}
                          onClick={handleReassign}
                        >
                          Reassign
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="task-priority">Priority</Label>
                      <Select value={task.priority} onValueChange={(v) => handlePriorityChange(v as TaskPriority)}>
                        <SelectTrigger id="task-priority" className="w-full">
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
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="task-due-date">Due date</Label>
                      <Input
                        id="task-due-date"
                        type="date"
                        value={task.dueDateISO ?? ""}
                        onChange={(e) => handleDueDateChange(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Comments</p>
                  <div className="flex flex-col gap-2">
                    {task.comments.length === 0 && (
                      <p className="text-xs text-muted-foreground">No comments yet.</p>
                    )}
                    {task.comments.map((comment) => (
                      <div key={comment.id} className="flex flex-col gap-0.5 rounded-lg border p-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{comment.author}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateDisplay(comment.dateISO)} · {comment.time}
                          </span>
                        </div>
                        <p>{comment.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Textarea
                      rows={2}
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <Button size="sm" className="self-start" disabled={!commentText.trim()} onClick={handleAddComment}>
                      Add comment
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Activity</p>
                  <div className="flex flex-col gap-3 border-l pl-4">
                    {[...task.activity].reverse().map((entry) => (
                      <div key={entry.id} className="relative text-sm">
                        <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-muted-foreground/40" />
                        <p>{entry.text}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateDisplay(entry.dateISO)} · {entry.time}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Complete task</DialogTitle>
            <DialogDescription>Add an optional note about how this was resolved.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="complete-note">Note (optional)</Label>
            <Textarea
              id="complete-note"
              rows={3}
              value={completeNote}
              onChange={(e) => setCompleteNote(e.target.value)}
              placeholder="e.g. Customer paid in full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete}>Complete task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
