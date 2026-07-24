"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Phone } from "lucide-react"
import { toast } from "sonner"

import { LiveResultCount } from "@/components/dashboard/live-result-count"
import { ConceptTooltip } from "@/components/help/concept-tooltip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader } from "@/components/ui/card"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatGHS, SUPPLIERS } from "@/lib/mock-data"
import {
  AGEING_BUCKET_LABELS,
  getPayables,
  getReceivables,
  isDueThisWeek,
  payablesByBucket,
  payablesTotal,
  receivablesByBucket,
  receivablesTotal,
  recordPayablePayment,
  recordReceivablePayment,
  type AgeingBucket,
  type PayableEntry,
  type PayableMethod,
  type ReceivableEntry,
} from "@/lib/money-owed-data"
import { formatDateDisplay, TODAY_ISO } from "@/lib/period-utils"
import { cn } from "@/lib/utils"

const BUCKET_ORDER: AgeingBucket[] = ["current", "1-30", "31-60", "60+"]

const RECEIVABLE_PAYMENT_METHODS = ["Cash", "Momo", "Bank transfer", "Cheque"] as const
type ReceivablePaymentMethod = (typeof RECEIVABLE_PAYMENT_METHODS)[number]

const PAYABLE_PAYMENT_METHODS: PayableMethod[] = ["Cash", "Momo", "Bank transfer"]

function formatDaysOverdue(daysOverdue: number): string {
  if (daysOverdue > 0) return `${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue`
  if (daysOverdue === 0) return "Due today"
  return `Due in ${-daysOverdue} day${-daysOverdue === 1 ? "" : "s"}`
}

function supplierPhone(supplierName: string): string | undefined {
  return SUPPLIERS.find((s) => s.businessName === supplierName)?.phone
}

export function MoneyOwedTab() {
  const [view, setView] = useState<"receivable" | "payable">("receivable")

  const [receivables, setReceivables] = useState<ReceivableEntry[]>(() => getReceivables())
  const [payables, setPayables] = useState<PayableEntry[]>(() => getPayables())

  const [recvBucket, setRecvBucket] = useState<AgeingBucket | null>(null)
  const [payBucket, setPayBucket] = useState<AgeingBucket | null>(null)
  const [dueThisWeekOnly, setDueThisWeekOnly] = useState(false)

  const [paymentTarget, setPaymentTarget] = useState<ReceivableEntry | null>(null)
  const [supplierPaymentTarget, setSupplierPaymentTarget] = useState<PayableEntry | null>(null)

  const router = useRouter()

  const receivablesTotalValue = useMemo(() => receivablesTotal(receivables), [receivables])
  const payablesTotalValue = useMemo(() => payablesTotal(payables), [payables])
  const netPosition = Math.round((receivablesTotalValue - payablesTotalValue) * 100) / 100

  const recvBucketTotals = useMemo(() => receivablesByBucket(receivables), [receivables])
  const payBucketTotals = useMemo(() => payablesByBucket(payables), [payables])

  const filteredReceivables = useMemo(
    () => receivables.filter((e) => !recvBucket || e.bucket === recvBucket),
    [receivables, recvBucket]
  )
  const filteredPayables = useMemo(
    () =>
      payables
        .filter((e) => !payBucket || e.bucket === payBucket)
        .filter((e) => !dueThisWeekOnly || isDueThisWeek(e)),
    [payables, payBucket, dueThisWeekOnly]
  )

  const canBulkRemind = recvBucket === "31-60" || recvBucket === "60+"
  const bulkRemindHint = canBulkRemind ? null : "Select the 31-60 or 60+ days bucket first"

  function refreshReceivables() {
    setReceivables([...getReceivables()])
  }

  function refreshPayables() {
    setPayables([...getPayables()])
  }

  function handleRecordReceivablePayment(entry: ReceivableEntry, amount: number) {
    recordReceivablePayment(entry, amount)
    refreshReceivables()
    toast.success("Payment recorded", { description: `${formatGHS(amount)} received from ${entry.customerName}.` })
    setPaymentTarget(null)
  }

  function handleRecordSupplierPayment(entry: PayableEntry, amount: number) {
    recordPayablePayment(entry, amount)
    refreshPayables()
    toast.success("Payment recorded", { description: `${formatGHS(amount)} paid to ${entry.supplierName}.` })
    setSupplierPaymentTarget(null)
  }

  function handleSendReminder(entry: ReceivableEntry) {
    router.push(`/message/message-compose?customerName=${encodeURIComponent(entry.customerName)}&amountOwed=${entry.balance}`)
  }

  function handleBulkReminder() {
    if (!canBulkRemind) return
    const count = filteredReceivables.length
    toast.success(`Reminder queued for ${count} customer${count === 1 ? "" : "s"}`, {
      description: `${AGEING_BUCKET_LABELS[recvBucket as AgeingBucket]} bucket.`,
    })
  }

  function handleContactSupplier(entry: PayableEntry) {
    const phone = supplierPhone(entry.supplierName)
    if (!phone) {
      toast.info("No phone number on file", { description: `${entry.supplierName} isn't in your supplier contacts.` })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="gap-3 py-5">
          <CardHeader className="gap-1.5 px-5">
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              Owed to me <ConceptTooltip conceptKey="receivable-payable" />
            </p>
            <span className="text-2xl font-semibold">{formatGHS(receivablesTotalValue)}</span>
            <p className="text-xs text-muted-foreground">
              {receivables.length} outstanding balance{receivables.length === 1 ? "" : "s"}
            </p>
          </CardHeader>
        </Card>
        <Card className="gap-3 py-5">
          <CardHeader className="gap-1.5 px-5">
            <p className="text-sm text-muted-foreground">I owe</p>
            <span className="text-2xl font-semibold">{formatGHS(payablesTotalValue)}</span>
            <p className="text-xs text-muted-foreground">
              {payables.length} outstanding bill{payables.length === 1 ? "" : "s"}
            </p>
          </CardHeader>
        </Card>
        <Card className="gap-3 py-5">
          <CardHeader className="gap-1.5 px-5">
            <p className="text-sm text-muted-foreground">Net position</p>
            <span
              className={cn(
                "text-2xl font-semibold",
                netPosition > 0 && "text-emerald-600 dark:text-emerald-400",
                netPosition < 0 && "text-destructive"
              )}
            >
              {formatGHS(netPosition)}
            </span>
            <p className="text-xs text-muted-foreground">
              {netPosition >= 0 ? "More is owed to you than you owe" : "You owe more than is owed to you"}
            </p>
          </CardHeader>
        </Card>
      </div>

      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(v) => v && setView(v as "receivable" | "payable")}
        variant="outline"
        className="w-full sm:w-auto"
      >
        <ToggleGroupItem value="receivable" className="flex-1 sm:flex-none">
          Owed to me
        </ToggleGroupItem>
        <ToggleGroupItem value="payable" className="flex-1 sm:flex-none">
          I owe
        </ToggleGroupItem>
      </ToggleGroup>

      {view === "receivable" ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
              {BUCKET_ORDER.map((bucket) => {
                const isSelected = recvBucket === bucket
                return (
                  <button
                    key={bucket}
                    type="button"
                    onClick={() => setRecvBucket((prev) => (prev === bucket ? null : bucket))}
                    className={cn(
                      "flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
                      isSelected ? "border-primary bg-primary/10" : "hover:bg-accent/40"
                    )}
                  >
                    <span className="text-xs text-muted-foreground">{AGEING_BUCKET_LABELS[bucket]}</span>
                    <span className="text-lg font-semibold">{formatGHS(recvBucketTotals[bucket])}</span>
                  </button>
                )
              })}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {bulkRemindHint && <p className="text-xs text-muted-foreground">{bulkRemindHint}</p>}
              <Button variant="outline" disabled={!canBulkRemind} onClick={handleBulkReminder}>
                Send reminder to all overdue
              </Button>
            </div>
          </div>
          <LiveResultCount count={filteredReceivables.length} itemLabel="receivable" />

          <div className="overflow-hidden rounded-xl border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Amount paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead>Days overdue</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceivables.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.customerName}</TableCell>
                      <TableCell>
                        <Link href={entry.documentHref} className="text-primary underline-offset-3 hover:underline">
                          {entry.document}
                        </Link>
                      </TableCell>
                      <TableCell>{formatGHS(entry.amount)}</TableCell>
                      <TableCell>{formatGHS(entry.amountPaid)}</TableCell>
                      <TableCell className="font-medium">{formatGHS(entry.balance)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateDisplay(entry.dueDateISO)}</TableCell>
                      <TableCell className={entry.daysOverdue > 0 ? "text-destructive" : "text-muted-foreground"}>
                        {formatDaysOverdue(entry.daysOverdue)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{entry.customerPhone ?? "—"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${entry.customerName}`}>
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPaymentTarget(entry)}>Record payment</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendReminder(entry)}>Send reminder</DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={entry.documentHref}>View document</Link>
                            </DropdownMenuItem>
                            {entry.customerPhone && (
                              <DropdownMenuItem asChild>
                                <a href={`tel:${entry.customerPhone}`}>
                                  <Phone className="size-4" />
                                  Call
                                </a>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredReceivables.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                        Nothing owed to you in this bucket.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
              {BUCKET_ORDER.map((bucket) => {
                const isSelected = payBucket === bucket
                return (
                  <button
                    key={bucket}
                    type="button"
                    onClick={() => setPayBucket((prev) => (prev === bucket ? null : bucket))}
                    className={cn(
                      "flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
                      isSelected ? "border-primary bg-primary/10" : "hover:bg-accent/40"
                    )}
                  >
                    <span className="text-xs text-muted-foreground">{AGEING_BUCKET_LABELS[bucket]}</span>
                    <span className="text-lg font-semibold">{formatGHS(payBucketTotals[bucket])}</span>
                  </button>
                )
              })}
            </div>
            <Button
              variant={dueThisWeekOnly ? "default" : "outline"}
              onClick={() => setDueThisWeekOnly((v) => !v)}
              className="shrink-0"
            >
              Due this week
            </Button>
          </div>
          <LiveResultCount count={filteredPayables.length} itemLabel="payable" />

          <div className="overflow-hidden rounded-xl border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Amount paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead>Days overdue</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayables.map((entry) => {
                    const phone = supplierPhone(entry.supplierName)
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.supplierName}</TableCell>
                        <TableCell className="text-muted-foreground">{entry.reference}</TableCell>
                        <TableCell>
                          <Badge variant={entry.tag === "inventory" ? "secondary" : "outline"}>
                            {entry.tag === "inventory" ? "Inventory" : "Operating"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatGHS(entry.amount)}</TableCell>
                        <TableCell>{formatGHS(entry.amountPaid)}</TableCell>
                        <TableCell className="font-medium">{formatGHS(entry.balance)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDateDisplay(entry.dueDateISO)}</TableCell>
                        <TableCell className={entry.daysOverdue > 0 ? "text-destructive" : "text-muted-foreground"}>
                          {formatDaysOverdue(entry.daysOverdue)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${entry.supplierName}`}>
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSupplierPaymentTarget(entry)}>
                                Record payment to supplier
                              </DropdownMenuItem>
                              {entry.poId && (
                                <DropdownMenuItem asChild>
                                  <Link href="/inventory/purchase-orders">View PO</Link>
                                </DropdownMenuItem>
                              )}
                              {phone ? (
                                <DropdownMenuItem asChild>
                                  <a href={`tel:${phone}`}>
                                    <Phone className="size-4" />
                                    Contact supplier
                                  </a>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleContactSupplier(entry)}>Contact supplier</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {filteredPayables.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                        Nothing owed to suppliers in this bucket.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Paying an inventory bill settles a liability that already increased your stock — it isn&apos;t a new expense. Paying an
            operating bill settles an expense that was already recorded when the bill arrived.
          </p>
        </div>
      )}

      <RecordReceivablePaymentDialog entry={paymentTarget} onOpenChange={(open) => !open && setPaymentTarget(null)} onSubmit={handleRecordReceivablePayment} />

      <RecordSupplierPaymentDialog
        entry={supplierPaymentTarget}
        onOpenChange={(open) => !open && setSupplierPaymentTarget(null)}
        onSubmit={handleRecordSupplierPayment}
      />
    </div>
  )
}

function RecordReceivablePaymentDialog({
  entry,
  onOpenChange,
  onSubmit,
}: {
  entry: ReceivableEntry | null
  onOpenChange: (open: boolean) => void
  onSubmit: (entry: ReceivableEntry, amount: number) => void
}) {
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<ReceivablePaymentMethod>("Cash")
  const [reference, setReference] = useState("")
  const [dateISO, setDateISO] = useState(TODAY_ISO)
  const [note, setNote] = useState("")
  const [prevId, setPrevId] = useState<string | null>(null)

  if (entry && entry.id !== prevId) {
    setPrevId(entry.id)
    setAmount(String(entry.balance))
    setMethod("Cash")
    setReference("")
    setDateISO(TODAY_ISO)
    setNote("")
  }

  const amountNum = Number.parseFloat(amount)
  const missingFields = [!(amountNum > 0) && "a valid amount"].filter(Boolean) as string[]
  const canSubmit = missingFields.length === 0

  return (
    <Dialog open={entry !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {entry && (
          <>
            <DialogHeader>
              <DialogTitle>Record payment — {entry.customerName}</DialogTitle>
              <DialogDescription>
                {entry.document} · balance {formatGHS(entry.balance)}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="recv-pay-amount">Amount (GHS)</Label>
                <Input id="recv-pay-amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="recv-pay-method">Method</Label>
                <Select value={method} onValueChange={(v) => setMethod(v as ReceivablePaymentMethod)}>
                  <SelectTrigger id="recv-pay-method" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECEIVABLE_PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="recv-pay-date">Date</Label>
                <Input id="recv-pay-date" type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="recv-pay-ref">Reference (optional)</Label>
                <Input id="recv-pay-ref" value={reference} onChange={(e) => setReference(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recv-pay-note">Note (optional)</Label>
              <Textarea id="recv-pay-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <div className="flex flex-col items-end gap-1">
                {!canSubmit && missingFields.length > 0 && (
                  <p className="text-xs text-muted-foreground">Still needs: {missingFields.join(", ")}</p>
                )}
                <Button onClick={() => onSubmit(entry, amountNum)} disabled={!canSubmit}>
                  Record payment
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function RecordSupplierPaymentDialog({
  entry,
  onOpenChange,
  onSubmit,
}: {
  entry: PayableEntry | null
  onOpenChange: (open: boolean) => void
  onSubmit: (entry: PayableEntry, amount: number) => void
}) {
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<PayableMethod>("Cash")
  const [reference, setReference] = useState("")
  const [dateISO, setDateISO] = useState(TODAY_ISO)
  const [prevId, setPrevId] = useState<string | null>(null)

  if (entry && entry.id !== prevId) {
    setPrevId(entry.id)
    setAmount(String(entry.balance))
    setMethod("Cash")
    setReference("")
    setDateISO(TODAY_ISO)
  }

  const amountNum = Number.parseFloat(amount)
  const missingFields = [!(amountNum > 0) && "a valid amount"].filter(Boolean) as string[]
  const canSubmit = missingFields.length === 0

  return (
    <Dialog open={entry !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {entry && (
          <>
            <DialogHeader>
              <DialogTitle>Record payment to {entry.supplierName}</DialogTitle>
              <DialogDescription>
                {entry.reference} · balance {formatGHS(entry.balance)}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pay-amount">Amount (GHS)</Label>
                <Input id="pay-amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pay-method">Method</Label>
                <Select value={method} onValueChange={(v) => setMethod(v as PayableMethod)}>
                  <SelectTrigger id="pay-method" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYABLE_PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pay-date">Date</Label>
                <Input id="pay-date" type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pay-ref">Reference (optional)</Label>
                <Input id="pay-ref" value={reference} onChange={(e) => setReference(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <div className="flex flex-col items-end gap-1">
                {!canSubmit && missingFields.length > 0 && (
                  <p className="text-xs text-muted-foreground">Still needs: {missingFields.join(", ")}</p>
                )}
                <Button onClick={() => onSubmit(entry, amountNum)} disabled={!canSubmit}>
                  Record payment
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
