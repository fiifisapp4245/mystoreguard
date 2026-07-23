"use client"

import { useMemo, useState } from "react"
import { MoreHorizontal, Plus, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { NewPODialog } from "@/components/hubs/inventory/new-po-dialog"
import { PODetailSheet } from "@/components/hubs/inventory/po-detail-sheet"
import { ReceiveGoodsSheet } from "@/components/hubs/inventory/receive-goods-sheet"
import { Button } from "@/components/ui/button"
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
import { formatGHS, SUPPLIERS } from "@/lib/mock-data"
import { LARRY_SUPPLIERS } from "@/lib/larry-data"
import {
  generateLowStockDraftOrders,
  getPurchaseOrdersStore,
  getLarryPurchaseOrdersStore,
  poFullyReceived,
  poOutstandingValue,
  poTotal,
  PO_STATUSES,
  setPurchaseOrdersStore,
  setLarryPurchaseOrdersStore,
  type POStatus,
  type PurchaseOrder,
} from "@/lib/purchase-orders-data"
import { formatDateDisplay, getStandardPeriodRange, isDateInRange, STANDARD_PERIOD_OPTIONS, type StandardPeriod } from "@/lib/period-utils"
import { CustomDateRangeRow, PeriodSelect } from "@/components/dashboard/period-select"
import { useDemoState } from "@/hooks/use-demo-state"

type FilterOption = "All" | POStatus

export function PurchaseOrdersTab() {
  const { state } = useDemoState()
  const isLarry = state.storePersona === "larry"
  const suppliers = isLarry ? LARRY_SUPPLIERS : SUPPLIERS

  const [pos, setPos] = useState<PurchaseOrder[]>(() => (isLarry ? getLarryPurchaseOrdersStore() : getPurchaseOrdersStore()))
  const [prevIsLarry, setPrevIsLarry] = useState(isLarry)
  if (isLarry !== prevIsLarry) {
    setPrevIsLarry(isLarry)
    setPos(isLarry ? getLarryPurchaseOrdersStore() : getPurchaseOrdersStore())
  }

  const [period, setPeriod] = useState<StandardPeriod>("today")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [filter, setFilter] = useState<FilterOption>("All")

  const [newPOOpen, setNewPOOpen] = useState(false)
  const [receiveTarget, setReceiveTarget] = useState<PurchaseOrder | null>(null)
  const [detailTarget, setDetailTarget] = useState<PurchaseOrder | null>(null)

  function persist(next: PurchaseOrder[]) {
    setPos(next)
    if (isLarry) setLarryPurchaseOrdersStore(next)
    else setPurchaseOrdersStore(next)
  }

  const periodRange = useMemo(() => getStandardPeriodRange(period, customFrom, customTo), [period, customFrom, customTo])
  const periodLabel = STANDARD_PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? "Today"

  const filtered = useMemo(() => pos.filter((po) => filter === "All" || po.status === filter), [pos, filter])

  const stats = useMemo(() => {
    const open = pos.filter((po) => po.status === "Draft" || po.status === "Sent" || po.status === "Partially received").length
    const awaiting = pos.filter((po) => po.status === "Sent" || po.status === "Partially received").length
    const receivedThisPeriod = pos.filter((po) => po.status === "Received" && isDateInRange(po.createdDate, periodRange)).length
    const outstanding = pos
      .filter((po) => po.status === "Sent" || po.status === "Partially received")
      .reduce((sum, po) => sum + poOutstandingValue(po), 0)
    return [
      { label: "Open POs", value: String(open) },
      { label: "Awaiting delivery", value: String(awaiting) },
      { label: "Received", caption: periodLabel, value: String(receivedThisPeriod) },
      { label: "Value outstanding", caption: "as of now", value: formatGHS(outstanding) },
    ]
  }, [pos, periodRange, periodLabel])

  function handleOrderLowStock() {
    const created = generateLowStockDraftOrders(isLarry, suppliers)
    if (created.length === 0) {
      toast.info("Nothing to order", { description: "No products are at or below their reorder point." })
      return
    }
    setPos(isLarry ? getLarryPurchaseOrdersStore() : getPurchaseOrdersStore())
    toast.success(`${created.length} draft order${created.length === 1 ? "" : "s"} created`, {
      description: created.map((po) => po.id).join(", "),
    })
  }

  function handleSend(po: PurchaseOrder) {
    persist(pos.map((p) => (p.id === po.id ? { ...p, status: "Sent" } : p)))
    toast.success("Purchase order sent", { description: `${po.id} sent to ${po.supplierName}.` })
  }

  function handleCancel(po: PurchaseOrder) {
    persist(pos.map((p) => (p.id === po.id ? { ...p, status: "Cancelled" } : p)))
    toast.success("Purchase order cancelled")
  }

  function handleReceived() {
    setPos(isLarry ? getLarryPurchaseOrdersStore() : getPurchaseOrdersStore())
    setReceiveTarget(null)
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
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterOption)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All statuses</SelectItem>
              {PO_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap items-center gap-2">
            <PeriodSelect value={period} onValueChange={setPeriod} />
            <Button variant="outline" onClick={handleOrderLowStock}>
              <Sparkles />
              Order low stock
            </Button>
            <Button onClick={() => setNewPOOpen(true)}>
              <Plus />
              New purchase order
            </Button>
          </div>
        </div>
        {period === "custom" && <CustomDateRangeRow from={customFrom} to={customTo} onFromChange={setCustomFrom} onToChange={setCustomTo} />}
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO no.</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total value</TableHead>
              <TableHead>Expected date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((po) => (
              <TableRow key={po.id} className="cursor-pointer" onClick={() => setDetailTarget(po)}>
                <TableCell className="font-medium">{po.id}</TableCell>
                <TableCell>{po.supplierName}</TableCell>
                <TableCell>{po.lineItems.length}</TableCell>
                <TableCell>{formatGHS(poTotal(po))}</TableCell>
                <TableCell className="text-muted-foreground">{formatDateDisplay(po.expectedDate)}</TableCell>
                <TableCell>
                  <StatusBadge label={po.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${po.id}`}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDetailTarget(po)}>View</DropdownMenuItem>
                      {po.status === "Draft" && <DropdownMenuItem onClick={() => handleSend(po)}>Send</DropdownMenuItem>}
                      {(po.status === "Sent" || po.status === "Partially received") && (
                        <DropdownMenuItem onClick={() => setReceiveTarget(po)}>Receive goods</DropdownMenuItem>
                      )}
                      {(po.status === "Draft" || po.status === "Sent") && (
                        <DropdownMenuItem variant="destructive" onClick={() => handleCancel(po)}>
                          Cancel
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No purchase orders match this filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <NewPODialog
        open={newPOOpen}
        onOpenChange={setNewPOOpen}
        isLarry={isLarry}
        onCreate={() => {
          setPos(isLarry ? getLarryPurchaseOrdersStore() : getPurchaseOrdersStore())
        }}
      />

      <PODetailSheet
        po={detailTarget}
        onOpenChange={(open) => !open && setDetailTarget(null)}
        onReceive={() => {
          if (detailTarget) {
            setReceiveTarget(detailTarget)
            setDetailTarget(null)
          }
        }}
        fullyReceived={detailTarget ? poFullyReceived(detailTarget) : false}
      />

      <ReceiveGoodsSheet po={receiveTarget} isLarry={isLarry} onOpenChange={(open) => !open && setReceiveTarget(null)} onReceived={handleReceived} />
    </div>
  )
}
