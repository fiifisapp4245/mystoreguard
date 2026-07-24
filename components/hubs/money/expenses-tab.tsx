"use client"

import { useMemo, useState } from "react"
import {
  CheckCircle2,
  MoreHorizontal,
  Plus,
  Receipt,
  Repeat,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { LiveResultCount } from "@/components/dashboard/live-result-count"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { CustomDateRangeRow, PeriodSelect } from "@/components/dashboard/period-select"
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
  SelectSeparator,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { formatGHS } from "@/lib/mock-data"
import {
  addCustomCategory,
  approveExpense,
  confirmRecurringExpense,
  CUSTOM_CATEGORY_NOTE,
  deleteExpense,
  EXPENSE_CATEGORIES,
  getCustomCategories,
  getExpense,
  getExpensesStore,
  PAID_FROM_OPTIONS,
  recordExpense,
  RECURRING_DEFINITIONS,
  rejectExpense,
  updateExpense,
  type Expense,
  type ExpenseStatus,
  type PaidFrom,
  type RecordExpenseInput,
} from "@/lib/expenses-data"
import {
  formatDateDisplay,
  getStandardPeriodRange,
  isDateInRange,
  STANDARD_PERIOD_OPTIONS,
  TODAY_ISO,
  type StandardPeriod,
} from "@/lib/period-utils"

const CURRENT_USER = "Adjoa Boateng"
const ADD_CUSTOM_CATEGORY_VALUE = "__add_custom_category__"

type CategoryFilter = "All" | string
type PaymentFilter = "All" | PaidFrom
type StatusFilter = "All" | ExpenseStatus

export function ExpensesTab() {
  const [expenses, setExpenses] = useState<Expense[]>(() => getExpensesStore())
  const [customCategories, setCustomCategories] = useState<string[]>(() => getCustomCategories())

  const [period, setPeriod] = useState<StandardPeriod>("today")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All")
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("All")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All")

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Expense | null>(null)
  const [viewTarget, setViewTarget] = useState<Expense | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Expense | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<{ expense: Expense; editing: boolean } | null>(null)
  const [recurringSheetOpen, setRecurringSheetOpen] = useState(false)

  function refresh() {
    setExpenses([...getExpensesStore()])
  }

  const allCategories = useMemo(() => [...EXPENSE_CATEGORIES, ...customCategories], [customCategories])

  const periodRange = useMemo(() => getStandardPeriodRange(period, customFrom, customTo), [period, customFrom, customTo])
  const periodLabel = STANDARD_PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? "Today"

  const recurringPending = useMemo(() => expenses.filter((e) => e.isRecurringPending), [expenses])
  const nonRecurring = useMemo(() => expenses.filter((e) => !e.isRecurringPending), [expenses])

  const periodApproved = useMemo(
    () => nonRecurring.filter((e) => e.status === "Approved" && isDateInRange(e.dateISO, periodRange)),
    [nonRecurring, periodRange]
  )

  const stats = useMemo(() => {
    const total = periodApproved.reduce((sum, e) => sum + e.amount, 0)

    const pendingApprovalCount = expenses.filter((e) => e.status === "Pending" && !e.isRecurringPending).length
    const recurringActiveCount = RECURRING_DEFINITIONS.filter((d) => d.active).length

    return [
      {
        label: "Total expenses",
        caption: periodLabel,
        value: formatGHS(total),
        footnote: `${periodApproved.length} approved expense${periodApproved.length === 1 ? "" : "s"}`,
      },
      {
        label: "Pending approval",
        caption: "as of now",
        value: String(pendingApprovalCount),
        footnote: pendingApprovalCount > 0 ? "Needs a decision" : "All caught up",
      },
      {
        label: "Recurring due this month",
        caption: "as of now",
        value: String(recurringActiveCount),
        footnote: "Active recurring definitions",
      },
    ]
  }, [periodApproved, expenses, periodLabel])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return nonRecurring
      .filter((e) => categoryFilter === "All" || e.category === categoryFilter)
      .filter((e) => paymentFilter === "All" || e.paidFrom === paymentFilter)
      .filter((e) => statusFilter === "All" || e.status === statusFilter)
      .filter((e) => !term || e.description.toLowerCase().includes(term) || e.paidTo.toLowerCase().includes(term))
      .sort((a, b) => b.dateISO.localeCompare(a.dateISO) || b.id.localeCompare(a.id))
  }, [nonRecurring, categoryFilter, paymentFilter, statusFilter, search])

  function handleAddCustomCategory(name: string) {
    addCustomCategory(name)
    setCustomCategories(getCustomCategories())
  }

  function handleFormSubmit(input: RecordExpenseInput, isEdit: boolean, id?: string) {
    if (isEdit && id) {
      updateExpense(id, input)
      refresh()
      toast.success("Expense updated")
    } else {
      const created = recordExpense(input)
      refresh()
      if (created.status === "Pending") {
        toast.success("Expense recorded", {
          description: `${formatGHS(created.amount)} exceeds the approval threshold — sits pending until approved.`,
        })
      } else {
        toast.success("Expense recorded", { description: "Posted immediately." })
      }
    }
    setFormOpen(false)
    setEditTarget(null)
  }

  function handleApprove(expense: Expense) {
    approveExpense(expense.id, CURRENT_USER)
    refresh()
    toast.success("Expense approved", { description: `${expense.description} — ${formatGHS(expense.amount)}.` })
  }

  function handleReject(expense: Expense, reason: string) {
    rejectExpense(expense.id, CURRENT_USER, reason)
    refresh()
    toast.success("Expense rejected")
    setRejectTarget(null)
  }

  function handleDelete(expense: Expense, reason: string) {
    deleteExpense(expense.id, reason)
    refresh()
    toast.success("Expense deleted")
    setDeleteTarget(null)
  }

  function handleConfirmRecurring(expense: Expense, patch?: Partial<RecordExpenseInput>) {
    confirmRecurringExpense(expense.id, patch, CURRENT_USER)
    refresh()
    const updated = getExpense(expense.id)
    if (updated?.status === "Pending") {
      toast.success("Recurring expense confirmed", {
        description: `${formatGHS(updated.amount)} exceeds the approval threshold — sits pending until approved.`,
      })
    } else {
      toast.success("Recurring expense confirmed", { description: "Posted immediately." })
    }
    setConfirmTarget(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description or paid to..." aria-label="Search description or paid to"
              className="w-full sm:w-56"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All categories</SelectItem>
                {allCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as PaymentFilter)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All payment methods</SelectItem>
                {PAID_FROM_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All statuses</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PeriodSelect value={period} onValueChange={setPeriod} />
            <Button variant="outline" onClick={() => setRecurringSheetOpen(true)}>
              <Repeat />
              Recurring expenses
            </Button>
            <Button
              onClick={() => {
                setEditTarget(null)
                setFormOpen(true)
              }}
            >
              <Plus />
              Record expense
            </Button>
          </div>
        </div>
        {period === "custom" && <CustomDateRangeRow from={customFrom} to={customTo} onFromChange={setCustomFrom} onToChange={setCustomTo} />}
        <LiveResultCount count={filtered.length} itemLabel="expense" />
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid from</TableHead>
                <TableHead>Paid to</TableHead>
                <TableHead>Recorded by</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10">Receipt</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {recurringPending.map((expense) => (
                <TableRow key={expense.id} className="bg-amber-500/10 hover:bg-amber-500/15">
                  <TableCell className="text-muted-foreground">{formatDateDisplay(expense.dateISO)}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell className="font-medium">{formatGHS(expense.amount)}</TableCell>
                  <TableCell>{expense.paidFrom}</TableCell>
                  <TableCell>{expense.paidTo}</TableCell>
                  <TableCell>{expense.recordedBy}</TableCell>
                  <TableCell>
                    <StatusBadge label="Awaiting confirmation" tone="warning" />
                  </TableCell>
                  <TableCell>
                    <ReceiptIndicator hasReceipt={expense.hasReceipt} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${expense.description}`}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleConfirmRecurring(expense)}>Confirm</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setConfirmTarget({ expense, editing: true })}>
                          Edit &amp; confirm
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.map((expense) => (
                <TableRow key={expense.id} className="cursor-pointer" onClick={() => setViewTarget(expense)}>
                  <TableCell className="text-muted-foreground">{formatDateDisplay(expense.dateISO)}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell className="font-medium">{formatGHS(expense.amount)}</TableCell>
                  <TableCell>{expense.paidFrom}</TableCell>
                  <TableCell>{expense.paidTo}</TableCell>
                  <TableCell>{expense.recordedBy}</TableCell>
                  <TableCell>
                    <StatusBadge label={expense.status} />
                  </TableCell>
                  <TableCell>
                    <ReceiptIndicator hasReceipt={expense.hasReceipt} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${expense.description}`}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewTarget(expense)}>View</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditTarget(expense)
                            setFormOpen(true)
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        {expense.status === "Pending" && (
                          <DropdownMenuItem onClick={() => handleApprove(expense)}>Approve</DropdownMenuItem>
                        )}
                        {expense.status === "Pending" && (
                          <DropdownMenuItem variant="destructive" onClick={() => setRejectTarget(expense)}>
                            Reject
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(expense)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && recurringPending.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    No expenses match this filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditTarget(null)
        }}
        expense={editTarget ?? undefined}
        categories={allCategories}
        recordedBy={CURRENT_USER}
        onAddCustomCategory={handleAddCustomCategory}
        onSubmit={handleFormSubmit}
      />

      <ExpenseDetailSheet expense={viewTarget} onOpenChange={(open) => !open && setViewTarget(null)} />

      <RejectExpenseDialog expense={rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)} onReject={handleReject} />

      <DeleteExpenseDialog expense={deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)} onDelete={handleDelete} />

      <ConfirmRecurringDialog
        target={confirmTarget}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        onConfirm={handleConfirmRecurring}
      />

      <RecurringDefinitionsSheet open={recurringSheetOpen} onOpenChange={setRecurringSheetOpen} />
    </div>
  )
}

function ReceiptIndicator({ hasReceipt }: { hasReceipt: boolean }) {
  if (!hasReceipt) {
    return (
      <span className="text-muted-foreground" aria-label="No receipt on file">
        —
      </span>
    )
  }
  return (
    <Receipt className="size-4 text-emerald-600 dark:text-emerald-400" aria-label="Receipt attached">
      <title>Receipt attached</title>
    </Receipt>
  )
}

// ---------------------------------------------------------------------------
// Record / edit expense form
// ---------------------------------------------------------------------------

interface ExpenseFormValues {
  dateISO: string
  category: string
  description: string
  amount: string
  paidFrom: PaidFrom
  paidTo: string
  reference: string
  note: string
  hasReceipt: boolean
}

function toFormValues(expense?: Expense): ExpenseFormValues {
  return {
    dateISO: expense?.dateISO ?? TODAY_ISO,
    category: expense?.category ?? "",
    description: expense?.description ?? "",
    amount: expense ? String(expense.amount) : "",
    paidFrom: expense?.paidFrom ?? "Cash from till",
    paidTo: expense?.paidTo ?? "",
    reference: expense?.reference ?? "",
    note: expense?.note ?? "",
    hasReceipt: expense?.hasReceipt ?? false,
  }
}

function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  categories,
  recordedBy,
  onAddCustomCategory,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense
  categories: string[]
  recordedBy: string
  onAddCustomCategory: (name: string) => void
  onSubmit: (input: RecordExpenseInput, isEdit: boolean, id?: string) => void
}) {
  const [values, setValues] = useState<ExpenseFormValues>(() => toFormValues(expense))
  const [prevId, setPrevId] = useState<string | null>(null)
  const [fileName, setFileName] = useState("")
  const [customPanelOpen, setCustomPanelOpen] = useState(false)
  const [customName, setCustomName] = useState("")

  const isEdit = Boolean(expense)
  const currentId = expense?.id ?? null

  // Reset the form each time a different expense is opened (or a fresh "new"
  // form) — adjusting state during render rather than in an effect, since
  // Dialog's onOpenChange only fires on user-driven open/close.
  if (open && currentId !== prevId) {
    setPrevId(currentId)
    setValues(toFormValues(expense))
    setFileName("")
    setCustomPanelOpen(false)
    setCustomName("")
  }

  function update(patch: Partial<ExpenseFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  function handleCategorySelect(value: string) {
    if (value === ADD_CUSTOM_CATEGORY_VALUE) {
      setCustomPanelOpen(true)
      return
    }
    update({ category: value })
  }

  function handleAddCustom() {
    const trimmed = customName.trim()
    if (!trimmed) return
    onAddCustomCategory(trimmed)
    update({ category: trimmed })
    setCustomName("")
    setCustomPanelOpen(false)
  }

  const amountNum = Number.parseFloat(values.amount)
  const missingExpenseFields = [
    !values.category.trim() && "a category",
    !values.description.trim() && "a description",
    !values.paidTo.trim() && "who it was paid to",
    !(amountNum > 0) && "a valid amount",
  ].filter(Boolean) as string[]
  const canSubmit = missingExpenseFields.length === 0

  function handleSubmit() {
    if (!canSubmit) return
    const input: RecordExpenseInput = {
      dateISO: values.dateISO,
      category: values.category,
      description: values.description.trim(),
      amount: amountNum,
      paidFrom: values.paidFrom,
      paidTo: values.paidTo.trim(),
      reference: values.reference.trim() || undefined,
      note: values.note.trim() || undefined,
      hasReceipt: values.hasReceipt || fileName !== "",
      recordedBy,
    }
    onSubmit(input, isEdit, expense?.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit expense" : "Record expense"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this expense."
              : "Only for money spent on running the business — goods bought for resale go through a purchase order, not here."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-1 pb-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expense-date">Date</Label>
              <Input id="expense-date" type="date" value={values.dateISO} onChange={(e) => update({ dateISO: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expense-category">Category</Label>
              <Select value={values.category || undefined} onValueChange={handleCategorySelect}>
                <SelectTrigger id="expense-category" className="w-full">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value={ADD_CUSTOM_CATEGORY_VALUE}>+ Add custom category</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {customPanelOpen && (
            <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
              <p className="text-xs text-muted-foreground">{CUSTOM_CATEGORY_NOTE}</p>
              <div className="flex gap-2">
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Category name" aria-label="Category name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddCustom()
                    }
                  }}
                />
                <Button type="button" onClick={handleAddCustom} disabled={!customName.trim()}>
                  Add
                </Button>
              </div>
              {!customName.trim() && (
                <p className="text-xs text-muted-foreground">Still needs: a category name</p>
              )}
              <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setCustomPanelOpen(false)}>
                Cancel
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expense-description">Description</Label>
            <Input id="expense-description" value={values.description} onChange={(e) => update({ description: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expense-amount">Amount (GHS)</Label>
              <Input id="expense-amount" type="number" min="0" step="0.01" value={values.amount} onChange={(e) => update({ amount: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expense-paid-from">Paid from</Label>
              <Select value={values.paidFrom} onValueChange={(v) => update({ paidFrom: v as PaidFrom })}>
                <SelectTrigger id="expense-paid-from" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAID_FROM_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expense-paid-to">Paid to</Label>
              <Input id="expense-paid-to" value={values.paidTo} onChange={(e) => update({ paidTo: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expense-reference">Reference (optional)</Label>
              <Input id="expense-reference" value={values.reference} onChange={(e) => update({ reference: e.target.value })} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expense-note">Note (optional)</Label>
            <Textarea id="expense-note" rows={2} value={values.note} onChange={(e) => update({ note: e.target.value })} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expense-receipt">Receipt photo (optional)</Label>
            <Input
              id="expense-receipt"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const name = e.target.files?.[0]?.name ?? ""
                setFileName(name)
                update({ hasReceipt: name !== "" })
              }}
            />
            {fileName && <p className="text-xs text-muted-foreground">Attached: {fileName}</p>}
          </div>
        </div>

        {missingExpenseFields.length > 0 && (
          <p className="text-right text-xs text-muted-foreground">Still needs: {missingExpenseFields.join(", ")}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isEdit ? "Save changes" : "Record expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Detail sheet
// ---------------------------------------------------------------------------

function ExpenseDetailSheet({ expense, onOpenChange }: { expense: Expense | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={expense !== null} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-sm">
        {expense && (
          <>
            <SheetHeader>
              <SheetTitle className="font-sans">{expense.description}</SheetTitle>
              <SheetDescription>{expense.category} · {formatDateDisplay(expense.dateISO)}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-3 px-4 text-sm">
              <Row label="Amount" value={formatGHS(expense.amount)} />
              <Row label="Paid from" value={expense.paidFrom} />
              <Row label="Paid to" value={expense.paidTo} />
              {expense.reference && <Row label="Reference" value={expense.reference} />}
              <Row label="Recorded by" value={expense.recordedBy} />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge label={expense.status} />
              </div>
              {expense.approvedBy && (
                <Row label={expense.status === "Rejected" ? "Rejected by" : "Approved by"} value={expense.approvedBy} />
              )}
              {expense.approvalDateISO && <Row label="Decision date" value={formatDateDisplay(expense.approvalDateISO)} />}
              {expense.approvalNote && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Note</span>
                  <span>{expense.approvalNote}</span>
                </div>
              )}
              {expense.note && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Note</span>
                  <span>{expense.note}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Receipt</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <ReceiptIndicator hasReceipt={expense.hasReceipt} />
                  {expense.hasReceipt ? "On file" : "None"}
                </span>
              </div>
              {expense.fromRecurringId && <Row label="Source" value="Recurring expense" />}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Reject / delete (reason required)
// ---------------------------------------------------------------------------

function RejectExpenseDialog({
  expense,
  onOpenChange,
  onReject,
}: {
  expense: Expense | null
  onOpenChange: (open: boolean) => void
  onReject: (expense: Expense, reason: string) => void
}) {
  const [reason, setReason] = useState("")
  const [prevId, setPrevId] = useState<string | null>(null)

  if (expense && expense.id !== prevId) {
    setPrevId(expense.id)
    setReason("")
  }

  const canSubmit = reason.trim() !== ""

  return (
    <Dialog open={expense !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {expense && (
          <>
            <DialogHeader>
              <DialogTitle>Reject expense</DialogTitle>
              <DialogDescription>
                {expense.description} — {formatGHS(expense.amount)}. A reason is required for the record.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reject-reason">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea id="reject-reason" rows={3} autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Missing receipt, needs re-submission" />
            </div>
            {!canSubmit && <p className="text-right text-xs text-muted-foreground">Still needs: a reason</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => onReject(expense, reason.trim())} disabled={!canSubmit}>
                Reject expense
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DeleteExpenseDialog({
  expense,
  onOpenChange,
  onDelete,
}: {
  expense: Expense | null
  onOpenChange: (open: boolean) => void
  onDelete: (expense: Expense, reason: string) => void
}) {
  const [reason, setReason] = useState("")
  const [prevId, setPrevId] = useState<string | null>(null)

  if (expense && expense.id !== prevId) {
    setPrevId(expense.id)
    setReason("")
  }

  const canSubmit = reason.trim() !== ""

  return (
    <Dialog open={expense !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {expense && (
          <>
            <DialogHeader>
              <DialogTitle>Delete expense</DialogTitle>
              <DialogDescription>
                This permanently removes {expense.description} ({formatGHS(expense.amount)}). A reason is required for the record.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="delete-reason">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea id="delete-reason" rows={3} autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Entered in error, duplicate" />
            </div>
            {!canSubmit && <p className="text-right text-xs text-muted-foreground">Still needs: a reason</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => onDelete(expense, reason.trim())} disabled={!canSubmit}>
                Delete expense
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Confirm / edit-and-confirm recurring instance
// ---------------------------------------------------------------------------

function ConfirmRecurringDialog({
  target,
  onOpenChange,
  onConfirm,
}: {
  target: { expense: Expense; editing: boolean } | null
  onOpenChange: (open: boolean) => void
  onConfirm: (expense: Expense, patch?: Partial<RecordExpenseInput>) => void
}) {
  const [amount, setAmount] = useState("")
  const [paidTo, setPaidTo] = useState("")
  const [dateISO, setDateISO] = useState(TODAY_ISO)
  const [prevId, setPrevId] = useState<string | null>(null)

  const expense = target?.expense ?? null

  if (expense && expense.id !== prevId) {
    setPrevId(expense.id)
    setAmount(String(expense.amount))
    setPaidTo(expense.paidTo)
    setDateISO(expense.dateISO)
  }

  const amountNum = Number.parseFloat(amount)
  const missingConfirmFields = [
    !(amountNum > 0) && "a valid amount",
    !paidTo.trim() && "who it was paid to",
  ].filter(Boolean) as string[]
  const canSubmit = missingConfirmFields.length === 0

  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {expense && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm recurring expense</DialogTitle>
              <DialogDescription>
                {expense.description} · {expense.category} · usually {formatGHS(expense.amount)} paid from {expense.paidFrom}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm-rec-date">Date</Label>
                <Input id="confirm-rec-date" type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm-rec-amount">Amount (GHS)</Label>
                <Input id="confirm-rec-amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-rec-paid-to">Paid to</Label>
              <Input id="confirm-rec-paid-to" value={paidTo} onChange={(e) => setPaidTo(e.target.value)} />
            </div>
            {missingConfirmFields.length > 0 && (
              <p className="text-right text-xs text-muted-foreground">Still needs: {missingConfirmFields.join(", ")}</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => onConfirm(expense, { amount: amountNum, paidTo: paidTo.trim(), dateISO })}
                disabled={!canSubmit}
              >
                Confirm
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Recurring definitions (read-only)
// ---------------------------------------------------------------------------

function RecurringDefinitionsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="font-sans">Recurring expenses</SheetTitle>
          <SheetDescription>Configured schedules — each generates a pending entry to confirm on its day of month.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4">
          {RECURRING_DEFINITIONS.map((def) => (
            <div key={def.id} className="flex flex-col gap-1.5 rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{def.description}</span>
                {def.active ? (
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="size-4 text-muted-foreground" />
                )}
              </div>
              <Row label="Category" value={def.category} />
              <Row label="Amount" value={formatGHS(def.amount)} />
              <Row label="Paid from" value={def.paidFrom} />
              <Row label="Paid to" value={def.paidTo} />
              <Row label="Day of month" value={String(def.dayOfMonth)} />
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
