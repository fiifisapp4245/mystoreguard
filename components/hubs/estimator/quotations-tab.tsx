"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, MoreHorizontal, Plus } from "lucide-react"
import { toast } from "sonner"

import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { TeachingEmptyState } from "@/components/dashboard/teaching-empty-state"
import { QuotationDetailSheet } from "@/components/hubs/estimator/quotation-detail-sheet"
import { RecordDepositDialog } from "@/components/hubs/estimator/record-deposit-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { cn } from "@/lib/utils"
import { formatGHS } from "@/lib/mock-data"
import {
  buildInvoiceLineItemsFromQuotation,
  getQuotationsStore,
  recordDeposit,
  setQuotationsStore,
  type Quotation,
  type QuotationStatus,
} from "@/lib/estimator-data"
import {
  computeInvoiceTotals,
  getInvoicesStore,
  nextInvoiceNumber,
  setInvoicesStore,
  type Invoice,
} from "@/lib/invoice-data"
import { formatDateDisplay, TODAY_ISO } from "@/lib/period-utils"
import { demoStateToParams, useDemoState } from "@/hooks/use-demo-state"

type FilterOption = "All" | QuotationStatus

const QUOTATION_STATUSES: QuotationStatus[] = ["Draft", "Sent", "Accepted", "Rejected", "Expired", "Converted"]

function daysUntil(dateISO: string): number {
  const target = new Date(`${dateISO}T00:00:00`)
  const today = new Date(`${TODAY_ISO}T00:00:00`)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function QuotationsTab() {
  const router = useRouter()
  const { state } = useDemoState()
  const isLarry = state.storePersona === "larry"
  const demoQuery = demoStateToParams(state).toString()
  const withDemoQuery = (path: string) => (demoQuery ? `${path}${path.includes("?") ? "&" : "?"}${demoQuery}` : path)

  const [quotations, setQuotations] = useState<Quotation[]>(() => (isLarry ? getQuotationsStore() : []))
  const [prevIsLarry, setPrevIsLarry] = useState(isLarry)
  if (isLarry !== prevIsLarry) {
    setPrevIsLarry(isLarry)
    setQuotations(isLarry ? getQuotationsStore() : [])
  }
  const [filter, setFilter] = useState<FilterOption>("All")
  const [selected, setSelected] = useState<Quotation | null>(null)
  const [depositTarget, setDepositTarget] = useState<Quotation | null>(null)

  function persist(next: Quotation[]) {
    setQuotations(next)
    setQuotationsStore(next)
  }

  const filtered = useMemo(
    () => quotations.filter((quotation) => filter === "All" || quotation.status === filter),
    [quotations, filter]
  )

  const statusCounts = useMemo(() => {
    const counts: Record<QuotationStatus, number> = {
      Draft: 0,
      Sent: 0,
      Accepted: 0,
      Rejected: 0,
      Expired: 0,
      Converted: 0,
    }
    quotations.forEach((quotation) => {
      counts[quotation.status] += 1
    })
    return counts
  }, [quotations])

  const valueBreakdown = useMemo(() => {
    const totalValue = quotations.reduce((sum, quotation) => sum + quotation.total, 0)
    const acceptedValue = quotations
      .filter((quotation) => quotation.status === "Accepted" || quotation.status === "Converted")
      .reduce((sum, quotation) => sum + quotation.total, 0)
    const pipelineValue = quotations
      .filter((quotation) => quotation.status === "Draft" || quotation.status === "Sent")
      .reduce((sum, quotation) => sum + quotation.total, 0)
    return { totalValue, acceptedValue, pipelineValue }
  }, [quotations])

  function handleConvertToInvoice(quotation: Quotation) {
    if (quotation.status !== "Accepted") return
    const invoiceId = nextInvoiceNumber()
    const lineItems = buildInvoiceLineItemsFromQuotation(quotation)
    const { subtotal, taxLines, total } = computeInvoiceTotals(lineItems, 0)

    const newInvoice: Invoice = {
      id: invoiceId,
      customer: quotation.customer,
      issueDate: TODAY_ISO,
      dueDate: "",
      lineItems,
      subtotal,
      discount: 0,
      taxLines,
      total,
      amountPaid: 0,
      balance: total,
      status: "Sent",
      fromQuotationNo: quotation.id,
    }
    setInvoicesStore([newInvoice, ...getInvoicesStore()])

    persist(
      quotations.map((q) => (q.id === quotation.id ? { ...q, status: "Converted", convertedToInvoiceId: invoiceId } : q))
    )
    setSelected(null)
    toast.success("Converted to invoice", { description: `${invoiceId} created from ${quotation.id}.` })
  }

  function handleDuplicate(quotation: Quotation) {
    const newQuotation: Quotation = {
      ...quotation,
      id: `QUO-${TODAY_ISO.replace(/-/g, "")}-${String(quotations.length + 1).padStart(3, "0")}`,
      status: "Draft",
      createdDate: TODAY_ISO,
      convertedToInvoiceId: undefined,
    }
    persist([newQuotation, ...quotations])
    toast.success("Quotation duplicated", { description: `Created ${newQuotation.id} as a draft.` })
  }

  function handleMarkRejected(quotation: Quotation) {
    persist(quotations.map((q) => (q.id === quotation.id ? { ...q, status: "Rejected" as QuotationStatus } : q)))
    setSelected(null)
    toast.success("Quotation marked rejected")
  }

  function handleSend(quotation: Quotation) {
    persist(quotations.map((q) => (q.id === quotation.id && q.status === "Draft" ? { ...q, status: "Sent" as QuotationStatus } : q)))
    toast.success("Quotation sent", { description: `${quotation.id} sent to ${quotation.customer}.` })
  }

  function handleRecordDeposit(amount: number) {
    if (!depositTarget) return
    recordDeposit(depositTarget.id, amount)
    persist(getQuotationsStore())
    setDepositTarget(null)
    setSelected(null)
    toast.success("Deposit recorded", { description: `${formatGHS(amount)} for ${depositTarget.id}.` })
  }

  if (!isLarry) {
    return (
      <Card className="items-center gap-3 py-16 text-center">
        <CardContent className="flex flex-col items-center gap-2 px-5">
          <p className="max-w-sm text-sm text-muted-foreground">
            No quotations for Adwoa&apos;s Provisions yet — a grocery store doesn&apos;t usually need parametric
            quotes. Switch the &quot;Store persona&quot; demo control to Larry&apos;s Curtains &amp; Décor to see
            the Estimator in action.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Total quotations" value={String(quotations.length)} />
        <StatCard label="Draft" value={String(statusCounts.Draft)} />
        <StatCard label="Sent" value={String(statusCounts.Sent)} />
        <StatCard label="Accepted" value={String(statusCounts.Accepted)} />
        <StatCard label="Rejected" value={String(statusCounts.Rejected)} />
        <StatCard label="Expired" value={String(statusCounts.Expired)} />
        <StatCard label="Converted" value={String(statusCounts.Converted)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Value breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Total value</p>
            <p className="text-xl font-semibold">{formatGHS(valueBreakdown.totalValue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Accepted value</p>
            <p className="text-xl font-semibold text-success">{formatGHS(valueBreakdown.acceptedValue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pipeline value</p>
            <p className="text-xl font-semibold">{formatGHS(valueBreakdown.pipelineValue)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={filter} onValueChange={(v) => setFilter(v as FilterOption)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All statuses</SelectItem>
            {QUOTATION_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button asChild>
          <Link href={withDemoQuery("/estimator/quotations/new")}>
            <Plus />
            New quotation
          </Link>
        </Button>
      </div>

      {filtered.length === 0 ? (
        <TeachingEmptyState
          message="A quotation is a price you send a customer before the sale. If they accept, it becomes an invoice with one click."
          actionLabel="New quotation"
          actionHref={withDemoQuery("/estimator/quotations/new")}
        />
      ) : (
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quotation</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Valid until</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((quotation) => {
              const expiringSoon =
                (quotation.status === "Sent" || quotation.status === "Draft") &&
                daysUntil(quotation.validUntil) >= 0 &&
                daysUntil(quotation.validUntil) <= 7

              return (
                <TableRow key={quotation.id} className="cursor-pointer" onClick={() => setSelected(quotation)}>
                  <TableCell className="font-medium whitespace-nowrap">{quotation.id}</TableCell>
                  <TableCell className="whitespace-nowrap">{quotation.customer}</TableCell>
                  <TableCell>{quotation.lineItems.length}</TableCell>
                  <TableCell>{formatGHS(quotation.total)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className={cn("flex items-center gap-1.5", expiringSoon && "font-medium text-amber-700 dark:text-amber-400")}>
                      {expiringSoon && <AlertTriangle className="size-3.5" />}
                      {formatDateDisplay(quotation.validUntil)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge label={quotation.status} />
                  </TableCell>
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${quotation.id}`}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelected(quotation)}>View</DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={withDemoQuery(`/estimator/quotations/new?edit=${quotation.id}`)}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSend(quotation)}>Send</DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={quotation.status !== "Accepted"}
                          onClick={() => handleConvertToInvoice(quotation)}
                        >
                          Convert to invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={quotation.status !== "Accepted" || quotation.depositAmount !== undefined}
                          onClick={() => setDepositTarget(quotation)}
                        >
                          Record deposit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(quotation)}>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={quotation.status === "Rejected" || quotation.status === "Converted"}
                          onClick={() => handleMarkRejected(quotation)}
                        >
                          Mark rejected
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      )}

      <QuotationDetailSheet
        quotation={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onEdit={() => selected && router.push(withDemoQuery(`/estimator/quotations/new?edit=${selected.id}`))}
        onSend={() => selected && handleSend(selected)}
        onConvert={() => selected && handleConvertToInvoice(selected)}
        onDuplicate={() => selected && handleDuplicate(selected)}
        onMarkRejected={() => selected && handleMarkRejected(selected)}
        onRecordDeposit={() => selected && setDepositTarget(selected)}
      />

      <RecordDepositDialog
        quotation={depositTarget}
        onOpenChange={(open) => !open && setDepositTarget(null)}
        onRecord={handleRecordDeposit}
      />
    </div>
  )
}
