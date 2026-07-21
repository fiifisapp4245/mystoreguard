import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ModulePageData } from "@/components/dashboard-pages/registry"

const STATS = [
  {
    label: "Active tasks",
    value: "11",
    trend: { value: 2, direction: "up" as const, tone: "negative" as const },
  },
  {
    label: "Completed this week",
    value: "34",
    trend: { value: 15, direction: "up" as const, tone: "positive" as const },
  },
  {
    label: "Overdue",
    value: "2",
    trend: { value: 1, direction: "down" as const, tone: "positive" as const },
  },
  {
    label: "Templates in use",
    value: "5",
    trend: { value: 0, direction: "up" as const, tone: "positive" as const },
  },
]

const TASKS = [
  { task: "Morning opening checklist", assignedTo: "Adjoa Boateng", template: "Opening procedure", status: "Completed", due: "21 Jul 2026" },
  { task: "Receive Kasapreko delivery", assignedTo: "Kwabena Owusu", template: "Receiving stock", status: "In progress", due: "21 Jul 2026" },
  { task: "Weekly stocktake — Makola Shop", assignedTo: "Abena Darko", template: "Stocktaking", status: "Pending", due: "22 Jul 2026" },
  { task: "Reconcile till float", assignedTo: "Adjoa Boateng", template: "Closing procedure", status: "Overdue", due: "19 Jul 2026" },
  { task: "Approve Unilever purchase order", assignedTo: "Kwabena Owusu", template: "PO approval", status: "Pending", due: "23 Jul 2026" },
]

const TEMPLATES = [
  { name: "Opening procedure", steps: 6, lastUsed: "21 Jul 2026" },
  { name: "Closing procedure", steps: 5, lastUsed: "20 Jul 2026" },
  { name: "Receiving stock", steps: 4, lastUsed: "21 Jul 2026" },
  { name: "Stocktaking", steps: 3, lastUsed: "15 Jul 2026" },
  { name: "PO approval", steps: 2, lastUsed: "18 Jul 2026" },
]

export function WorkflowPage({ module }: { module: ModulePageData }) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-10">
      <PageHeader title={module.name} subtitle={module.description} search="Search tasks..." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Tasks</CardTitle>
          <CardDescription>Work assigned to staff and tracked to completion.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TASKS.map((task) => (
                <TableRow key={task.task}>
                  <TableCell className="font-medium">{task.task}</TableCell>
                  <TableCell className="text-muted-foreground">{task.assignedTo}</TableCell>
                  <TableCell className="text-muted-foreground">{task.template}</TableCell>
                  <TableCell>
                    <StatusBadge label={task.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{task.due}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Templates</CardTitle>
          <CardDescription>Reusable checklists for things the business does repeatedly.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {TEMPLATES.map((template) => (
            <div
              key={template.name}
              className="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{template.name}</p>
                <p className="text-sm text-muted-foreground">{template.steps} steps</p>
              </div>
              <span className="text-sm text-muted-foreground">Last used {template.lastUsed}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
