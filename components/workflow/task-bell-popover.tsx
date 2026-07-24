"use client"

import Link from "next/link"
import { Bell } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useDemoState } from "@/hooks/use-demo-state"
import { dueBucketFor, mostUrgentTasksForRole, openTaskCountForRole } from "@/lib/workflow-data"

/** The header task indicator — mounted once in components/shell.tsx. */
export function TaskBellPopover() {
  const { state } = useDemoState()
  const count = openTaskCountForRole(state.role)
  const urgent = mostUrgentTasksForRole(state.role, 5)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Open tasks">
          <Bell className="size-4" />
          {count > 0 && (
            <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 min-w-4 justify-center px-1 text-[10px] tabular-nums">
              {count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-3">
          <p className="text-sm font-medium">Open tasks</p>
          <p className="text-xs text-muted-foreground">The 5 most urgent for {state.role}</p>
        </div>
        <div className="flex flex-col divide-y">
          {urgent.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nothing urgent right now.</p>}
          {urgent.map((task) => (
            <Link key={task.id} href={`/workflow/my-tasks?task=${task.id}`} className="flex flex-col gap-0.5 p-3 text-sm transition-colors hover:bg-accent/40">
              <span className="font-medium">{task.title}</span>
              <span className="text-xs text-muted-foreground">
                {dueBucketFor(task)} · {task.priority}
              </span>
            </Link>
          ))}
        </div>
        <div className="border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full justify-center">
            <Link href="/workflow/my-tasks">Open My tasks</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
