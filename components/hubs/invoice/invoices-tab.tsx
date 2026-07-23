"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { MoreHorizontal, Plus, Search } from "lucide-react"
import { toast } from "sonner"

import { CustomDateRangeRow, PeriodSelect } from "@/components/dashboard/period-select"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { InvoiceDetailSheet } from "@/components/hubs/invoice/invoice-detail-sheet"
import { RecordPaymentDialog } from "@/components/hubs/invoice/record-payment-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatGHS } from "@/lib/mock-data"
import {
  addPaymentToStore,
  getInvoicesStore,
  getPaymentsStore,
  nextInvoiceNumber,
  recomputeInvoiceStatus,
  setInvoicesStore,
  type Invoice,
  type InvoiceStatus,
  type PaymentMethod,
} from "@/lib/invoice-data"
import {
  formatDateDisplay,
  getStandardPeriodRange,
  isDateInRange,
  STANDARD_PERIOD_OPTIONS,
  TODAY_ISO,
  type StandardPeriod,
} from "@/lib/period-utils"

type FilterChip = "All" | InvoiceStatus

const FILTER_CHIPS: FilterChip[] = ["All", "Draft", "Sent", "Partially paid", "Overdue", "Paid"]

export function InvoicesTab() {
  const [invoices, setInvoices] = useState<Invoice[]>(() => getInvoicesStore())
  const [period, setPeriod] = useState<StandardPeriod>("today")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [filter, setFilter] = useState<FilterChip>("All")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null)

  function persist(next: Invoice[]) {
    setInvoices(next)
    setInvoicesStore(next)
  }

  const periodRange = useMemo(
    () => getStandardPeriodRange(period, customFrom, customTo),
    [period, customFrom, customTo]
  )
  const periodLabel = STANDARD_PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? "Today"

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return invoices.filter((invoice) => {
      const matchesFilter = filter === "All" || invoice.status === filter
      const matchesSearch =
        !query || invoice.id.toLowerCase().includes(query) || invoice.customer.toLowerCase().includes(query)
      return matchesFilter && matchesSearch
    })
  }, [invoices, filter, search])

  const stats = useMemo(() => {
    const inPeriod = invoices.filter((invoice) => isDateInRange(invoice.issueDate, periodRange))
    const totalInvoiced = inPeriod.reduce((sum, invoice) => sum + invoice.total, 0)
    const outstanding = invoices
      .filter((invoice) => invoice.status !== "Void")
      .reduce((sum, invoice) => sum + invoice.balance, 0)
    const paidThisPeriod = getPaymentsStore()
      .filter((payment) => isDateInRange(payment.dateISO, periodRange))
      .reduce((sum, payment) => sum + payment.amount, 0)
    const overdueCount = invoices.filter((invoice) => invoice.status === "Overdue").length

    return [
      { label: "Total invoiced", caption: periodLabel, value: formatGHS(totalInvoiced) },
      { label: "Outstanding", caption: "as of now", value: formatGHS(outstanding) },
      { label: "Paid this period", caption: periodLabel, value: formatGHS(paidThisPeriod) },
      { label: "Overdue", caption: "as of now", value: String(overdueCount) },
    ]
  }, [invoices, periodRange, periodLabel])

  function handleRecordPayment(payment: { amount: number; method: PaymentMethod; reference?: string; dateISO: string; note?: string }) {
    if (!paymentInvoice) return

    const newAmountPaid = Math.round((paymentInvoice.amountPaid + payment.amount) * 100) / 100
    const newBalance = Math.max(0, Math.round((paymentInvoice.total - newAmountPaid) * 100) / 100)
    const newStatus = recomputeInvoiceStatus(paymentInvoice.total, newAmountPaid, paymentInvoice.dueDate, TODAY_ISO)

    const next = invoices.map((invoice) =>
      invoice.id === paymentInvoice.id
        ? { ...invoice, amountPaid: newAmountPaid, balance: newBalance, status: newStatus }
        : invoice
    )
    persist(next)

    addPaymentToStore({
      id: `pay-${paymentInvoice.id}-${Math.random().toString(36).slice(2, 8)}`,
      invoiceId: paymentInvoice.id,
      dateISO: payment.dateISO,
      customer: paymentInvoice.customer,
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference,
      recordedBy: "Adjoa Boateng",
    })

    setPaymentInvoice(null)
    if (selected?.id === paymentInvoice.id) {
      setSelected(next.find((invoice) => invoice.id === paymentInvoice.id) ?? null)
    }
    toast.success("Payment recorded", {
      description: `${formatGHS(payment.amount)} against ${paymentInvoice.id}.`,
    })
  }

  function handleDuplicate(invoice: Invoice) {
    const newInvoice: Invoice = {
      ...invoice,
      id: nextInvoiceNumber(),
      status: "Draft",
      amountPaid: 0,
      balance: invoice.total,
      dueDate: "",
      fromReceiptNo: undefined,
      fromQuotationNo: undefined,
    }
    persist([newInvoice, ...invoices])
    toast.success("Invoice duplicated", { description: `Created ${newInvoice.id} as a draft.` })
  }

  function handleVoid(invoice: Invoice) {
    persist(invoices.map((inv) => (inv.id === invoice.id ? { ...inv, status: "Void" as InvoiceStatus } : inv)))
    setSelected(null)
    toast.success("Invoice voided", { description: `${invoice.id} has been voided.` })
  }

  function handleSend(invoice: Invoice) {
    toast.success("Invoice sent", { description: `${invoice.id} sent to ${invoice.customer}.` })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setFilter(chip)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                  filter === chip
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                {chip}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PeriodSelect value={period} onValueChange={setPeriod} />
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search invoice no. or customer..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full pl-8 sm:w-64"
              />
            </div>
            <Button asChild>
              <Link href="/invoice/new">
                <Plus />
                New invoice
              </Link>
            </Button>
          </div>
        </div>

        {period === "custom" && (
          <CustomDateRangeRow from={customFrom} to={customTo} onFromChange={setCustomFrom} onToChange={setCustomTo} />
        )}
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((invoice) => (
              <TableRow key={invoice.id} className="cursor-pointer" onClick={() => setSelected(invoice)}>
                <TableCell className="font-medium whitespace-nowrap">{invoice.id}</TableCell>
                <TableCell className="whitespace-nowrap">{invoice.customer}</TableCell>
                <TableCell>{formatGHS(invoice.total)}</TableCell>
                <TableCell className="text-muted-foreground">{formatGHS(invoice.amountPaid)}</TableCell>
                <TableCell>{formatGHS(invoice.balance)}</TableCell>
                <TableCell>
                  <StatusBadge label={invoice.status} />
                </TableCell>
                <TableCell
                  className={cn(
                    "whitespace-nowrap",
                    invoice.status === "Overdue" ? "font-medium text-destructive" : "text-muted-foreground"
                  )}
                >
                  {formatDateDisplay(invoice.dueDate)}
                </TableCell>
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${invoice.id}`}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelected(invoice)}>View</DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={invoice.balance <= 0 || invoice.status === "Void"}
                        onClick={() => setPaymentInvoice(invoice)}
                      >
                        Record payment
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSend(invoice)}>Send</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(invoice)}>Duplicate</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={invoice.status === "Void"}
                        onClick={() => handleVoid(invoice)}
                      >
                        Void
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  No invoices match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <InvoiceDetailSheet
        invoice={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onRecordPayment={() => selected && setPaymentInvoice(selected)}
        onSend={() => selected && handleSend(selected)}
        onDuplicate={() => selected && handleDuplicate(selected)}
        onVoid={() => selected && handleVoid(selected)}
      />

      <RecordPaymentDialog
        open={paymentInvoice !== null}
        onOpenChange={(open) => !open && setPaymentInvoice(null)}
        invoice={paymentInvoice}
        onRecord={handleRecordPayment}
      />
    </div>
  )
}
