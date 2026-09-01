"use client"

import { useMemo, useState } from "react"
import { Search, ShoppingBag } from "lucide-react"
import { toast } from "sonner"

import { LiveResultCount } from "@/components/dashboard/live-result-count"
import { PeriodSelect } from "@/components/dashboard/period-select"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { TeachingEmptyState } from "@/components/dashboard/teaching-empty-state"
import { OnlineOrderDetailSheet } from "@/components/online-store/online-order-detail-sheet"
import {
  OrderActionDialog,
  type OrderActionKind,
  type OrderActionPayload,
} from "@/components/online-store/order-action-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useOnlineStore } from "@/hooks/use-online-store"
import { formatGHS } from "@/lib/mock-data"
import {
  awaitingPaymentCount,
  cancelOrder,
  completeOrder,
  confirmPayment,
  getOnlineOrder,
  getOnlineOrders,
  markReadyForFulfilment,
  nextActionFor,
  onlineRevenue,
  ONLINE_ORDER_STATUSES,
  orderCount,
  pendingFulfilmentCount,
  sendForDelivery,
  startProcessing,
  type OnlineOrder,
  type OnlineOrderStatus,
} from "@/lib/online-orders-data"
import { getStandardPeriodRange, isDateInRange, type StandardPeriod } from "@/lib/period-utils"

type StatusFilter = "All" | OnlineOrderStatus

export function OnlineOrdersTab() {
  const { persona, refresh } = useOnlineStore()

  const [period, setPeriod] = useState<StandardPeriod>("month")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [action, setAction] = useState<{ kind: OrderActionKind; orderId: string } | null>(null)

  const range = useMemo(() => getStandardPeriodRange(period), [period])
  const inPeriod = useMemo(() => (iso: string) => isDateInRange(iso, range), [range])

  const orders = getOnlineOrders(persona)
  const selected = selectedId ? getOnlineOrder(persona, selectedId) ?? null : null
  const actionOrder = action ? getOnlineOrder(persona, action.orderId) ?? null : null

  const rows = orders.filter((order) => {
    const query = search.trim().toLowerCase()
    const matchesSearch =
      !query || order.customerName.toLowerCase().includes(query) || order.id.toLowerCase().includes(query)
    const matchesStatus = statusFilter === "All" || order.status === statusFilter
    return matchesSearch && matchesStatus && isDateInRange(order.placedOnISO, range)
  })

  /** The one place an order moves forward — the dialog only opens for the steps that need a fact first. */
  function advance(order: OnlineOrder) {
    const next = nextActionFor(order)
    if (!next) return

    if (next.action === "confirm-payment" || next.action === "send") {
      setAction({ kind: next.action, orderId: order.id })
      return
    }

    if (next.action === "process") {
      startProcessing(persona, order.id)
      toast.success("Picking started", { description: `${order.id} is being put together.` })
    } else if (next.action === "ready") {
      markReadyForFulfilment(persona, order.id)
      toast.success(order.fulfilment === "pickup" ? "Ready for collection" : "Packed and ready to go", {
        description: `${order.id} is ready.`,
      })
    } else if (next.action === "complete") {
      const sale = completeOrder(persona, order.id)
      toast.success("Order completed", {
        description: sale ? `Recorded in your sales as ${sale.receiptNo}.` : `${order.id} is done.`,
      })
    }
    refresh()
  }

  function handleActionConfirm(payload: OrderActionPayload) {
    if (!action || !actionOrder) return

    if (action.kind === "confirm-payment") {
      const sale = confirmPayment(persona, action.orderId, payload.reference ?? "")
      toast.success("Payment confirmed", {
        description: sale
          ? `Added to your sales as ${sale.receiptNo}.`
          : "The order has been marked as paid.",
      })
    } else if (action.kind === "send") {
      const delivery = sendForDelivery(
        persona,
        action.orderId,
        payload.scheduledDateISO ?? "",
        payload.window ?? "Morning"
      )
      toast.success("Sent to Deliveries", {
        description: delivery
          ? `${delivery.id} created — assign a rider from Deliveries.`
          : "The order is on its way out.",
      })
    } else {
      cancelOrder(persona, action.orderId, payload.reason ?? "")
      toast.success("Order cancelled", { description: "The goods are back in available stock." })
    }

    setAction(null)
    refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Orders" value={String(orderCount(persona, inPeriod))} footnote="Placed by customers online" />
        <StatCard
          label="Waiting for payment"
          value={String(awaitingPaymentCount(persona))}
          caption="as of now"
          footnote="Confirm each one when the money lands"
        />
        <StatCard
          label="To pack and send"
          value={String(pendingFulfilmentCount(persona))}
          caption="as of now"
          footnote="Paid and waiting on you"
        />
        <StatCard
          label="Online revenue"
          value={formatGHS(onlineRevenue(persona, inPeriod))}
          footnote="Money actually collected"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:max-w-64">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              aria-label="Search online orders"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Every status</SelectItem>
              {ONLINE_ORDER_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <PeriodSelect value={period} onValueChange={setPeriod} className="ml-auto w-36" />
        </div>
        <LiveResultCount count={rows.length} itemLabel="order" />
      </div>

      {orders.length === 0 ? (
        <TeachingEmptyState
          icon={ShoppingBag}
          message="When a customer places an order on your store it lands here — you confirm the payment, pack it, and send it out with your riders."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>How it goes out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-40" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((order) => {
                const next = nextActionFor(order)
                return (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(order.id)}
                  >
                    <TableCell className="font-medium whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        {order.id}
                        {order.source === "auction" && (
                          <Badge variant="outline" className="font-normal">
                            Auction
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{order.customerName}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{order.placedAtLabel}</TableCell>
                    <TableCell>{formatGHS(order.total)}</TableCell>
                    <TableCell>
                      <StatusBadge label={order.paymentStatus} />
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {order.fulfilment === "pickup" ? "Collection" : `Delivery · ${order.deliveryArea}`}
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={order.status} />
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      {next && (
                        <Button size="sm" variant="outline" onClick={() => advance(order)}>
                          {next.label}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No orders match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        A confirmed payment is recorded in Sales like any other sale, and a packed order goes out through
        Deliveries — the same riders, proof of delivery and cash reconciliation you already use.
      </p>

      <OnlineOrderDetailSheet
        order={selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onAdvance={advance}
        onCancel={(order) => setAction({ kind: "cancel", orderId: order.id })}
      />

      <OrderActionDialog
        kind={action?.kind ?? null}
        order={actionOrder}
        onOpenChange={(open) => !open && setAction(null)}
        onConfirm={handleActionConfirm}
      />
    </div>
  )
}
