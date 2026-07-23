"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { AlertTriangle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { formatGHS } from "@/lib/mock-data"
import { formatDateDisplay } from "@/lib/period-utils"
import { computeCashierReport, computeExpensesByCategory, computeSalesPerformance } from "@/lib/reports-data"
import {
  closeDay,
  computeExpectedCashBreakdown,
  countedCashTotal,
  COIN_DENOMINATIONS,
  emptyDenominationCounts,
  expectedCashTotal,
  getPastSessions,
  getTodaySession,
  NOTE_DENOMINATIONS,
  openDay,
  recordCashDrop,
  reopenDay,
  saveDenominationCounts,
  VARIANCE_REASONS,
  type DaySession,
  type DenominationCount,
} from "@/lib/day-close-data"
import { cn } from "@/lib/utils"

const STAFF_NAME = "Adjoa Boateng"
const VARIANCE_HIGHLIGHT_THRESHOLD = 20

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function formatDenomValue(value: number): string {
  return value >= 1 ? String(value) : value.toFixed(2)
}

const DENOMINATION_ROWS: { value: number; kind: "note" | "coin" }[] = [
  ...NOTE_DENOMINATIONS.map((value) => ({ value, kind: "note" as const })),
  ...COIN_DENOMINATIONS.map((value) => ({ value, kind: "coin" as const })),
]

function VarianceValue({ variance }: { variance: number }) {
  const rounded = roundMoney(variance)
  const tone = rounded < 0 ? "text-destructive" : rounded > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
  const sign = rounded > 0 ? "+ " : rounded < 0 ? "− " : ""
  return <span className={cn("font-mono tabular-nums", tone)}>{sign}{formatGHS(Math.abs(rounded))}</span>
}

// ---------------------------------------------------------------------------
// Expected cash breakdown — always itemised, never one opaque number.
// ---------------------------------------------------------------------------

function ExpectedCashCard({ session }: { session: DaySession }) {
  const lines = useMemo(() => computeExpectedCashBreakdown(session), [session])
  const total = useMemo(() => expectedCashTotal(session), [session])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expected cash</CardTitle>
        <CardDescription>Every line that should have moved cash today — never a single opaque number.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-0">
        {lines.map((line) => (
          <div key={line.label} className="flex items-center justify-between gap-4 border-b py-2 text-sm last:border-b-0">
            {line.href ? (
              <Link href={line.href} className="text-foreground underline-offset-2 hover:underline">
                {line.label}
              </Link>
            ) : (
              <span>{line.label}</span>
            )}
            <span className={cn("font-mono tabular-nums", line.amount < 0 && "text-muted-foreground")}>
              {line.amount < 0 ? "− " : line.label !== "Opening float" && line.amount > 0 ? "+ " : ""}
              {formatGHS(Math.abs(line.amount))}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 border-t-2 pt-3 text-sm font-semibold">
          <span>= Expected in drawer</span>
          <span className="font-mono text-base tabular-nums">{formatGHS(total)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Count the drawer
// ---------------------------------------------------------------------------

function CountDrawerCard({
  counts,
  onQuantityChange,
  countedTotal,
}: {
  counts: DenominationCount[]
  onQuantityChange: (value: number, quantity: string) => void
  countedTotal: number
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Count the drawer</CardTitle>
        <CardDescription>Enter how many of each note and coin are physically in the drawer.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Denomination</TableHead>
                <TableHead className="w-28">Quantity</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DENOMINATION_ROWS.map(({ value, kind }) => {
                const qty = counts.find((c) => c.value === value)?.quantity ?? 0
                return (
                  <TableRow key={`${kind}-${value}`}>
                    <TableCell>GHS {formatDenomValue(value)} {kind}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={qty}
                        onChange={(event) => onQuantityChange(value, event.target.value)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{formatGHS(value * qty)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t pt-3 text-sm font-semibold">
          <span>Counted total</span>
          <span className="font-mono text-base tabular-nums">{formatGHS(countedTotal)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Variance
// ---------------------------------------------------------------------------

function VarianceCard({
  variance,
  reason,
  setReason,
  note,
  setNote,
}: {
  variance: number
  reason: string
  setReason: (value: string) => void
  note: string
  setNote: (value: string) => void
}) {
  const rounded = roundMoney(variance)
  const hasVariance = rounded !== 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Variance</CardTitle>
        <CardDescription>Counted minus expected. A non-zero variance needs a reason before the day can close.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Counted − expected</span>
          <span className="text-xl font-semibold">
            <VarianceValue variance={rounded} />
          </span>
        </div>
        {hasVariance && (
          <div className="flex flex-col gap-3 rounded-lg border border-dashed p-3">
            <div className="flex flex-col gap-1.5">
              <Label>
                Reason for variance <span className="text-destructive">*</span>
              </Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {VARIANCE_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Note (optional)</Label>
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Add context for the discrepancy..."
                rows={2}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Cash drop dialog
// ---------------------------------------------------------------------------

function CashDropDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (amount: number, note?: string) => void
}) {
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setAmount("")
          setNote("")
        }
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record cash drop to safe</DialogTitle>
          <DialogDescription>
            Moves cash out of the drawer and into the safe — reduces what&rsquo;s expected in the drawer for the rest of the day.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Amount (GHS)</Label>
            <Input type="number" min={0} step={0.01} value={amount} onChange={(event) => setAmount(event.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Note (optional)</Label>
            <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. Midday drop" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const parsed = Number(amount)
              if (!Number.isFinite(parsed) || parsed <= 0) {
                toast.error("Enter a valid drop amount.")
                return
              }
              onSubmit(parsed, note.trim() || undefined)
              setAmount("")
              setNote("")
            }}
          >
            Record drop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Reopen day dialog
// ---------------------------------------------------------------------------

function ReopenDayDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (reason: string) => void
}) {
  const [reason, setReason] = useState("")

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason("")
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reopen day</DialogTitle>
          <DialogDescription>Reopening lets you make corrections to the drawer count. A reason is required.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label>
            Reason <span className="text-destructive">*</span>
          </Label>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Why does this day need to be reopened?"
            rows={2}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!reason.trim()) {
                toast.error("Enter a reason to reopen the day.")
                return
              }
              onSubmit(reason.trim())
              setReason("")
            }}
          >
            Reopen day
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Closed-day summary
// ---------------------------------------------------------------------------

function ClosedDaySummary({
  session,
  justClosed,
  onReopenClick,
}: {
  session: DaySession
  justClosed: boolean
  onReopenClick: () => void
}) {
  const salesByTender = useMemo(
    () => computeSalesPerformance(session.dateISO, session.dateISO).byPaymentType,
    [session.dateISO]
  )
  const cashierRows = useMemo(() => computeCashierReport(session.dateISO, session.dateISO), [session.dateISO])
  const expenseRows = useMemo(() => computeExpensesByCategory(session.dateISO, session.dateISO), [session.dateISO])
  const expensesTotal = expenseRows.reduce((sum, e) => sum + e.amount, 0)
  const expectedTotal = expectedCashTotal(session)
  const countedTotal = countedCashTotal(session.denominationCounts)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Day closed — {formatDateDisplay(session.dateISO)}</CardTitle>
          <CardDescription>
            Closed by {session.closedBy ?? "—"} at {session.closedAtLabel ?? "—"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Expected</p>
            <p className="text-lg font-semibold font-mono tabular-nums">{formatGHS(expectedTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Counted</p>
            <p className="text-lg font-semibold font-mono tabular-nums">{formatGHS(countedTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Variance</p>
            <p className="text-lg font-semibold">
              <VarianceValue variance={session.variance ?? 0} />
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cash drops</p>
            <p className="text-lg font-semibold font-mono tabular-nums">
              {formatGHS(session.cashDrops.reduce((sum, d) => sum + d.amount, 0))}
            </p>
          </div>
        </CardContent>
        {session.varianceReason && (
          <CardContent className="border-t pt-4 text-sm">
            <p>
              <span className="text-muted-foreground">Variance reason: </span>
              {session.varianceReason}
            </p>
            {session.varianceNote && <p className="mt-1 text-muted-foreground">{session.varianceNote}</p>}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales by tender</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment type</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Transactions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesByTender.map((row) => (
                <TableRow key={row.type}>
                  <TableCell className="font-medium">{row.type}</TableCell>
                  <TableCell>{formatGHS(row.revenue)}</TableCell>
                  <TableCell>{row.transactions}</TableCell>
                </TableRow>
              ))}
              {salesByTender.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                    No sales recorded for this day.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expenses — {formatGHS(expensesTotal)}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenseRows.map((row) => (
                <TableRow key={row.category}>
                  <TableCell className="font-medium">{row.category}</TableCell>
                  <TableCell>{formatGHS(row.amount)}</TableCell>
                </TableRow>
              ))}
              {expenseRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="py-6 text-center text-muted-foreground">
                    No expenses recorded for this day.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cashier breakdown</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cashier</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Discounts</TableHead>
                <TableHead>Returns</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashierRows.map((row) => (
                <TableRow key={row.cashier}>
                  <TableCell className="font-medium">{row.cashier}</TableCell>
                  <TableCell>{formatGHS(row.sales)}</TableCell>
                  <TableCell>{row.transactions}</TableCell>
                  <TableCell>{formatGHS(row.discountsApplied)}</TableCell>
                  <TableCell>{formatGHS(row.returns)}</TableCell>
                </TableRow>
              ))}
              {cashierRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    No sales recorded for this day.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={() => toast.info(justClosed ? "Printing..." : "Reprinting...", { description: "Print isn't wired up in this prototype." })}
        >
          {justClosed ? "Print summary" : "Reprint summary"}
        </Button>
        <Button variant="outline" onClick={() => toast.info("Export coming soon", { description: "Day summary export isn't wired up in this prototype." })}>
          Export
        </Button>
        <Button variant="outline" onClick={onReopenClick}>
          Reopen day
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// History table
// ---------------------------------------------------------------------------

function HistoryTable({ sessions }: { sessions: DaySession[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Past sessions</CardTitle>
        <CardDescription>
          A recurring short on the same cashier is the pattern worth spotting — variances over {formatGHS(VARIANCE_HIGHLIGHT_THRESHOLD)} are highlighted.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Opened by</TableHead>
              <TableHead>Closed by</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Counted</TableHead>
              <TableHead>Variance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => {
              const expected = expectedCashTotal(session)
              const counted = countedCashTotal(session.denominationCounts)
              const variance = session.variance ?? roundMoney(counted - expected)
              const isFlagged = Math.abs(variance) > VARIANCE_HIGHLIGHT_THRESHOLD
              return (
                <TableRow key={session.id} className={isFlagged ? "bg-destructive/5" : undefined}>
                  <TableCell className="font-medium">{formatDateDisplay(session.dateISO)}</TableCell>
                  <TableCell className="text-muted-foreground">{session.openedBy}</TableCell>
                  <TableCell className="text-muted-foreground">{session.closedBy ?? "—"}</TableCell>
                  <TableCell>{formatGHS(expected)}</TableCell>
                  <TableCell>{formatGHS(counted)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1">
                      {isFlagged && <AlertTriangle className="size-3.5 text-destructive" />}
                      <VarianceValue variance={variance} />
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={session.status === "Open" ? "default" : "outline"}>{session.status}</Badge>
                  </TableCell>
                </TableRow>
              )
            })}
            {sessions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No past sessions yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main tab
// ---------------------------------------------------------------------------

export function DayCloseTab() {
  const [session, setSession] = useState<DaySession | undefined>(() => getTodaySession())
  const [counts, setCounts] = useState<DenominationCount[]>(() => session?.denominationCounts ?? emptyDenominationCounts())
  const [varianceReason, setVarianceReason] = useState("")
  const [varianceNote, setVarianceNote] = useState("")
  const [justClosed, setJustClosed] = useState(false)
  const [openingFloatInput, setOpeningFloatInput] = useState("200")
  const [dropDialogOpen, setDropDialogOpen] = useState(false)
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false)

  const pastSessions = useMemo(() => getPastSessions(), [])

  const expectedTotal = useMemo(() => (session ? expectedCashTotal(session) : 0), [session])
  const countedTotal = useMemo(() => countedCashTotal(counts), [counts])
  const variance = useMemo(() => roundMoney(countedTotal - expectedTotal), [countedTotal, expectedTotal])
  const canClose = variance === 0 || Boolean(varianceReason)

  function handleOpenDay() {
    const floatValue = Number(openingFloatInput)
    if (!Number.isFinite(floatValue) || floatValue < 0) {
      toast.error("Enter a valid opening float.")
      return
    }
    const created = openDay(STAFF_NAME, floatValue)
    setSession(created)
    setCounts(created.denominationCounts)
    setVarianceReason("")
    setVarianceNote("")
    setJustClosed(false)
    toast.success("Day opened", { description: `Opening float ${formatGHS(floatValue)} recorded.` })
  }

  function handleQuantityChange(value: number, quantityRaw: string) {
    if (!session) return
    const quantity = Math.max(0, Math.floor(Number(quantityRaw) || 0))
    const next = counts.map((c) => (c.value === value ? { ...c, quantity } : c))
    setCounts(next)
    saveDenominationCounts(session.id, next)
  }

  function handleRecordDrop(amount: number, note?: string) {
    if (!session) return
    recordCashDrop(session.id, amount, note, STAFF_NAME)
    setSession(getTodaySession())
    setDropDialogOpen(false)
    toast.success("Cash drop recorded", { description: `${formatGHS(amount)} moved to the safe.` })
  }

  function handleCloseDay() {
    if (!session) return
    if (variance !== 0 && !varianceReason) {
      toast.error("Select a reason for the variance before closing.")
      return
    }
    closeDay(session.id, STAFF_NAME, variance, variance !== 0 ? varianceReason : undefined, variance !== 0 ? varianceNote.trim() || undefined : undefined)
    setSession(getTodaySession())
    setJustClosed(true)
    toast.success("Day closed", {
      description: variance === 0 ? "Drawer balanced." : `Variance of ${formatGHS(variance)} recorded.`,
    })
  }

  function handleReopenDay(reason: string) {
    if (!session) return
    reopenDay(session.id, STAFF_NAME, reason)
    const reopened = getTodaySession()
    setSession(reopened)
    setCounts(reopened?.denominationCounts ?? emptyDenominationCounts())
    setVarianceReason("")
    setVarianceNote("")
    setJustClosed(false)
    setReopenDialogOpen(false)
    toast.success("Day reopened", { description: "The drawer is open again for corrections." })
  }

  // Defensive — the seed data always has a today session, but handle the gap gracefully.
  if (!session) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardTitle>Start the day</CardTitle>
            <CardDescription>Open the drawer with a starting float before the first sale.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            <Label htmlFor="opening-float">Opening float (GHS)</Label>
            <Input
              id="opening-float"
              type="number"
              min={0}
              step={0.01}
              value={openingFloatInput}
              onChange={(event) => setOpeningFloatInput(event.target.value)}
            />
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleOpenDay}>
              Open day
            </Button>
          </CardFooter>
        </Card>
        {pastSessions.length > 0 && <HistoryTable sessions={pastSessions} />}
      </div>
    )
  }

  if (session.status === "Closed") {
    return (
      <div className="flex flex-col gap-6">
        <ClosedDaySummary session={session} justClosed={justClosed} onReopenClick={() => setReopenDialogOpen(true)} />
        <HistoryTable sessions={pastSessions} />
        <ReopenDayDialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen} onSubmit={handleReopenDay} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Today&rsquo;s session — {formatDateDisplay(session.dateISO)}</CardTitle>
          <CardDescription>
            Opened by {session.openedBy} at {session.openedAtLabel} · Opening float {formatGHS(session.openingFloat)}
          </CardDescription>
        </CardHeader>
      </Card>

      <ExpectedCashCard session={session} />
      <CountDrawerCard counts={counts} onQuantityChange={handleQuantityChange} countedTotal={countedTotal} />
      <VarianceCard variance={variance} reason={varianceReason} setReason={setVarianceReason} note={varianceNote} setNote={setVarianceNote} />

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => setDropDialogOpen(true)}>
          Record cash drop to safe
        </Button>
        <Button onClick={handleCloseDay} disabled={!canClose}>
          Close day
        </Button>
      </div>

      <HistoryTable sessions={pastSessions} />

      <CashDropDialog open={dropDialogOpen} onOpenChange={setDropDialogOpen} onSubmit={handleRecordDrop} />
    </div>
  )
}
