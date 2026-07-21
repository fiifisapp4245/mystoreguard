"use client"

import { Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import type { DashboardWidgets } from "@/hooks/use-dashboard-widgets"

const WIDGETS: { key: keyof DashboardWidgets; label: string }[] = [
  { key: "revenue", label: "Revenue" },
  { key: "itemsSold", label: "Items sold" },
  { key: "expenses", label: "Expenses" },
  { key: "profit", label: "Gross profit" },
  { key: "chart", label: "Income vs expenses chart" },
  { key: "recentSales", label: "Recent sales table" },
]

export function CustomizeDashboard({
  widgets,
  onToggle,
}: {
  widgets: DashboardWidgets
  onToggle: (key: keyof DashboardWidgets) => void
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 />
          Customize
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Customize dashboard</DialogTitle>
          <DialogDescription>Choose what shows on your dashboard.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          {WIDGETS.map((widget) => (
            <div key={widget.key} className="flex items-center justify-between gap-4">
              <span className="text-sm">{widget.label}</span>
              <Switch checked={widgets[widget.key]} onCheckedChange={() => onToggle(widget.key)} />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
