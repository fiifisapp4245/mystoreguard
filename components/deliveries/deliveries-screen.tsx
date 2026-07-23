"use client"

import { useMemo, useState } from "react"
import { LayoutGrid, List, MoreHorizontal, Plus, Search } from "lucide-react"
import { toast } from "sonner"

import { CustomDateRangeRow, PeriodSelect } from "@/components/dashboard/period-select"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { AssignRiderDialog } from "@/components/deliveries/assign-rider-dialog"
import { ConfirmActionDialog } from "@/components/deliveries/confirm-action-dialog"
import { CreateDeliveryDialog } from "@/components/deliveries/create-delivery-dialog"
import { DeliveryBoard } from "@/components/deliveries/delivery-board"
import { DeliveryDetailSheet } from "@/components/deliveries/delivery-detail-sheet"
import { MarkFailedDialog } from "@/components/deliveries/mark-failed-dialog"
import { ProofOfDeliveryDialog } from "@/components/deliveries/proof-of-delivery-dialog"
import { RescheduleDialog } from "@/components/deliveries/reschedule-dialog"
import { RiderReconciliationPanel } from "@/components/deliveries/rider-reconciliation-panel"
import { WaybillDialog } from "@/components/deliveries/waybill-dialog"
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { formatGHS } from "@/lib/mock-data"
import {
  assignRider,
  cancelDelivery,
  getDeliveriesStore,
  getRider,
  markDelivered,
  markFailed,
  markOutForDelivery,
  rescheduleDelivery,
  returnFailedToStore,
  type Delivery,
  type DeliveryStatus,
} from "@/lib/deliveries-data"
import {
  getStandardPeriodRange,
  isDateInRange,
  STANDARD_PERIOD_OPTIONS,
  type StandardPeriod,
} from "@/lib/period-utils"

type FilterChip = "All" | DeliveryStatus
type ViewMode = "list" | "board"

const FILTER_CHIPS: FilterChip[] = [
  "All",
  "Scheduled",
  "Assigned",
  "Out for delivery",
  "Delivered",
  "Failed",
  "Cancelled",
]

export function DeliveriesScreen() {
  const [deliveries, setDeliveries] = useState<Delivery[]>(() => getDeliveriesStore())
  const [view, setView] = useState<ViewMode>("list")
  const [period, setPeriod] = useState<StandardPeriod>("today")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [filter, setFilter] = useState<FilterChip>("All")
  const [search, setSearch] = useState("")

  const [selected, setSelected] = useState<Delivery | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState<Delivery | null>(null)
  const [proofTarget, setProofTarget] = useState<Delivery | null>(null)
  const [failTarget, setFailTarget] = useState<Delivery | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<Delivery | null>(null)
  const [waybillTarget, setWaybillTarget] = useState<Delivery | null>(null)
  const [returnConfirmTarget, setReturnConfirmTarget] = useState<Delivery | null>(null)
  const [cancelConfirmTarget, setCancelConfirmTarget] = useState<Delivery | null>(null)

  function refreshFromStore() {
    setDeliveries([...getDeliveriesStore()])
  }

  const periodRange = useMemo(
    () => getStandardPeriodRange(period, customFrom, customTo),
    [period, customFrom, customTo]
  )
  const periodLabel = STANDARD_PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? "Today"

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return deliveries.filter((delivery) => {
      const matchesFilter = filter === "All" || delivery.status === filter
      const riderName = getRider(delivery.riderId)?.name ?? ""
      const matchesSearch =
        !query ||
        delivery.id.toLowerCase().includes(query) ||
        delivery.customer.toLowerCase().includes(query) ||
        riderName.toLowerCase().includes(query)
      return matchesFilter && matchesSearch
    })
  }, [deliveries, filter, search])

  const stats = useMemo(() => {
    const inPeriod = deliveries.filter((d) => isDateInRange(d.scheduledDateISO, periodRange))
    const deliveredInPeriod = inPeriod.filter((d) => d.status === "Delivered").length
    const outForDelivery = deliveries.filter((d) => d.status === "Out for delivery").length
    const cashToCollect = deliveries
      .filter((d) => d.isCod && ["Scheduled", "Assigned", "Out for delivery"].includes(d.status))
      .reduce((sum, d) => sum + d.codAmount, 0)

    return [
      { label: "Deliveries", caption: periodLabel, value: String(inPeriod.length) },
      { label: "Out for delivery", caption: "as of now", value: String(outForDelivery) },
      { label: "Delivered", caption: periodLabel, value: String(deliveredInPeriod) },
      { label: "Cash to collect", caption: "as of now", value: formatGHS(cashToCollect) },
    ]
  }, [deliveries, periodRange, periodLabel])

  function handleCreate(delivery: Delivery) {
    refreshFromStore()
    toast.success("Delivery created", { description: `${delivery.id} for ${delivery.customer}.` })
  }

  function handleAssignRider(riderId: string, dateISO: string, window: string) {
    if (!assignTarget) return
    assignRider(assignTarget.id, riderId, dateISO, window)
    refreshFromStore()
    setAssignTarget(null)
    setSelected(null)
    toast.success("Rider assigned")
  }

  function handleMarkOutForDelivery(delivery: Delivery) {
    markOutForDelivery(delivery.id)
    refreshFromStore()
    setSelected(null)
    const itemCount = delivery.lineItems.reduce((sum, li) => sum + li.quantity, 0)
    toast.success("Out for delivery", { description: `${itemCount} item${itemCount === 1 ? "" : "s"} left stock.` })
  }

  function handleMarkDelivered(proof: Parameters<typeof markDelivered>[1]) {
    if (!proofTarget) return
    markDelivered(proofTarget.id, proof)
    refreshFromStore()
    setProofTarget(null)
    setSelected(null)
    toast.success("Delivered", { description: `${proofTarget.id} — proof captured.` })
  }

  function handleMarkFailed(reason: string, note: string) {
    if (!failTarget) return
    markFailed(failTarget.id, reason, note)
    refreshFromStore()
    setFailTarget(null)
    setSelected(null)
    toast.success("Marked failed")
  }

  function handleReschedule(newDateISO: string) {
    if (!rescheduleTarget) return
    rescheduleDelivery(rescheduleTarget.id, newDateISO)
    refreshFromStore()
    setRescheduleTarget(null)
    setSelected(null)
    toast.success("Delivery rescheduled")
  }

  function handleReturnToStore() {
    if (!returnConfirmTarget) return
    returnFailedToStore(returnConfirmTarget.id)
    refreshFromStore()
    setReturnConfirmTarget(null)
    setSelected(null)
    toast.success("Returned to store", { description: "On hand restored." })
  }

  function handleCancel() {
    if (!cancelConfirmTarget) return
    cancelDelivery(cancelConfirmTarget.id)
    refreshFromStore()
    setCancelConfirmTarget(null)
    setSelected(null)
    toast.success("Delivery cancelled")
  }

  function rowActions(delivery: Delivery) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${delivery.id}`}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setSelected(delivery)}>View</DropdownMenuItem>
          {delivery.status === "Scheduled" && (
            <DropdownMenuItem onClick={() => setAssignTarget(delivery)}>Assign rider</DropdownMenuItem>
          )}
          {delivery.status === "Assigned" && (
            <DropdownMenuItem onClick={() => handleMarkOutForDelivery(delivery)}>Mark out for delivery</DropdownMenuItem>
          )}
          {delivery.status === "Out for delivery" && (
            <>
              <DropdownMenuItem onClick={() => setProofTarget(delivery)}>Mark delivered</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFailTarget(delivery)}>Mark failed</DropdownMenuItem>
            </>
          )}
          {delivery.status === "Failed" && (
            <>
              <DropdownMenuItem onClick={() => setRescheduleTarget(delivery)}>Reschedule</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setReturnConfirmTarget(delivery)}>Return to store</DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem onClick={() => setWaybillTarget(delivery)}>Print waybill</DropdownMenuItem>
          {(delivery.status === "Scheduled" || delivery.status === "Assigned") && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setCancelConfirmTarget(delivery)}>
                Cancel delivery
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Deliveries</h1>
          <p className="text-sm text-muted-foreground">Getting goods into the customer&apos;s hands, from dispatch to confirmed receipt.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          New delivery
        </Button>
      </div>

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
                placeholder="Search delivery no., customer, or rider..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full pl-8 sm:w-72"
              />
            </div>
            <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as ViewMode)} variant="outline">
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="board" aria-label="Board view">
                <LayoutGrid className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {period === "custom" && (
          <CustomDateRangeRow from={customFrom} to={customTo} onFromChange={setCustomFrom} onToChange={setCustomTo} />
        )}
      </div>

      {view === "list" ? (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Delivery</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>COD</TableHead>
                <TableHead>Rider</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((delivery) => (
                <TableRow key={delivery.id} className="cursor-pointer" onClick={() => setSelected(delivery)}>
                  <TableCell className="font-medium">{delivery.id}</TableCell>
                  <TableCell>{delivery.customer}</TableCell>
                  <TableCell className="text-muted-foreground">{delivery.area}</TableCell>
                  <TableCell>{delivery.lineItems.reduce((sum, li) => sum + li.quantity, 0)}</TableCell>
                  <TableCell>{delivery.isCod ? formatGHS(delivery.codAmount) : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{getRider(delivery.riderId)?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{delivery.scheduledDateISO} · {delivery.window}</TableCell>
                  <TableCell>
                    <StatusBadge label={delivery.status} />
                  </TableCell>
                  <TableCell onClick={(event) => event.stopPropagation()}>{rowActions(delivery)}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    No deliveries match this filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <DeliveryBoard deliveries={filtered} onSelect={setSelected} />
      )}

      <RiderReconciliationPanel deliveries={deliveries} />

      <DeliveryDetailSheet
        delivery={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onAssignRider={() => selected && setAssignTarget(selected)}
        onMarkOutForDelivery={() => selected && handleMarkOutForDelivery(selected)}
        onMarkDelivered={() => selected && setProofTarget(selected)}
        onMarkFailed={() => selected && setFailTarget(selected)}
        onReschedule={() => selected && setRescheduleTarget(selected)}
        onReturnToStore={() => selected && setReturnConfirmTarget(selected)}
        onCancel={() => selected && setCancelConfirmTarget(selected)}
        onPrintWaybill={() => selected && setWaybillTarget(selected)}
      />

      <CreateDeliveryDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={handleCreate} />

      <AssignRiderDialog
        delivery={assignTarget}
        onOpenChange={(open) => !open && setAssignTarget(null)}
        onAssign={handleAssignRider}
      />

      <ProofOfDeliveryDialog
        delivery={proofTarget}
        onOpenChange={(open) => !open && setProofTarget(null)}
        onSubmit={handleMarkDelivered}
      />

      <MarkFailedDialog
        delivery={failTarget}
        onOpenChange={(open) => !open && setFailTarget(null)}
        onMarkFailed={handleMarkFailed}
      />

      <RescheduleDialog
        delivery={rescheduleTarget}
        onOpenChange={(open) => !open && setRescheduleTarget(null)}
        onReschedule={handleReschedule}
      />

      <WaybillDialog delivery={waybillTarget} onOpenChange={(open) => !open && setWaybillTarget(null)} />

      <ConfirmActionDialog
        open={returnConfirmTarget !== null}
        onOpenChange={(open) => !open && setReturnConfirmTarget(null)}
        title="Return to store?"
        description={`${returnConfirmTarget?.id} — items go back on hand and this delivery closes out.`}
        confirmLabel="Return to store"
        onConfirm={handleReturnToStore}
      />

      <ConfirmActionDialog
        open={cancelConfirmTarget !== null}
        onOpenChange={(open) => !open && setCancelConfirmTarget(null)}
        title="Cancel delivery?"
        description={`${cancelConfirmTarget?.id} — set aside stock will be released back to Available.`}
        confirmLabel="Cancel delivery"
        onConfirm={handleCancel}
      />
    </div>
  )
}
