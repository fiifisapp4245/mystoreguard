"use client"

import { useState } from "react"
import { ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { DEFAULT_EXPENSE_APPROVAL_THRESHOLD, getExpenseApprovalThreshold, setExpenseApprovalThreshold } from "@/lib/expenses-data"
import { formatGHS } from "@/lib/mock-data"

export function ExpenseApprovalCard() {
  const [threshold, setThreshold] = useState(() => getExpenseApprovalThreshold())

  function handleSave() {
    setExpenseApprovalThreshold(threshold)
    toast.success("Expense approval threshold saved")
  }

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
          <CardTitle className="font-sans text-base">Expense approvals</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          If staff can record expenses, anything above this amount sits pending until you approve it.
        </p>
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="approval-threshold">Threshold (GHS)</Label>
            <Input
              id="approval-threshold"
              type="number"
              min={0}
              className="w-32"
              value={threshold}
              onChange={(e) => setThreshold(Number.parseFloat(e.target.value) || 0)}
            />
          </div>
          <Button variant="outline" onClick={handleSave}>
            Save
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Default is {formatGHS(DEFAULT_EXPENSE_APPROVAL_THRESHOLD)}. Expenses at or below this amount post immediately.
        </p>
      </CardContent>
    </Card>
  )
}
