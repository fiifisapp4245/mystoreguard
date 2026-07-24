"use client"

import { useMemo, useState } from "react"
import { MoreHorizontal, Plus, Scissors } from "lucide-react"

import { LiveResultCount } from "@/components/dashboard/live-result-count"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { CreateTransferDialog } from "@/components/hubs/stock/create-transfer-dialog"
import { ReceiveTransferDialog } from "@/components/hubs/stock/receive-transfer-dialog"
import { SplitStockDialog } from "@/components/hubs/stock/split-stock-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
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
import { getVisibleLocations, LOCATIONS } from "@/lib/mock-data"
import { LARRY_LOCATIONS } from "@/lib/larry-data"
import { getProductsStore, type Product } from "@/lib/pos-data"
import { getLarryProductsStore } from "@/lib/larry-data"
import {
  cancelTransfer,
  getMovementsStore,
  getLarryMovementsStore,
  movementProductLabel,
  sendTransfer,
  MOVEMENT_TYPES,
  type Movement,
  type MovementType,
  type Transfer,
} from "@/lib/stock-movements-data"
import { isMultiLocationTier } from "@/lib/modules"
import { useDemoState } from "@/hooks/use-demo-state"
import { toast } from "sonner"

type FilterOption = "All" | MovementType

function locationName(locations: { id: string; name: string }[], id: string): string {
  return locations.find((l) => l.id === id)?.name ?? id
}

function movementQuantity(m: Movement): string {
  if (m.type === "Transfer") return String(m.lines.reduce((sum, l) => sum + l.quantitySent, 0))
  if (m.type === "Split") return `+${m.baseUnitsCreated}`
  if (m.type === "Adjustment") return `${m.delta > 0 ? "+" : ""}${m.delta}`
  return String(m.quantity)
}

function movementDate(m: Movement): string {
  return m.type === "Transfer" ? m.createdDateISO : m.dateISO
}

export function MovementsTab() {
  const { state } = useDemoState()
  const isLarry = state.storePersona === "larry"
  const isMultiLocation = isMultiLocationTier(state.tier)
  const userName = "Adjoa Boateng"

  const locations = isLarry ? LARRY_LOCATIONS : LOCATIONS
  const visibleLocations = getVisibleLocations(locations, isMultiLocation)
  const products: Product[] = isLarry ? getLarryProductsStore() : getProductsStore()

  const [movements, setMovements] = useState<Movement[]>(() => (isLarry ? getLarryMovementsStore() : getMovementsStore()))
  const [prevIsLarry, setPrevIsLarry] = useState(isLarry)
  if (isLarry !== prevIsLarry) {
    setPrevIsLarry(isLarry)
    setMovements(isLarry ? getLarryMovementsStore() : getMovementsStore())
  }

  const [filter, setFilter] = useState<FilterOption>("All")
  const [transferOpen, setTransferOpen] = useState(false)
  const [receiveTarget, setReceiveTarget] = useState<Transfer | null>(null)
  const [splitPickerOpen, setSplitPickerOpen] = useState(false)
  const [splitSearch, setSplitSearch] = useState("")
  const [splitTarget, setSplitTarget] = useState<Product | null>(null)
  const [detailTarget, setDetailTarget] = useState<Movement | null>(null)

  function refresh() {
    setMovements([...(isLarry ? getLarryMovementsStore() : getMovementsStore())])
  }

  const filtered = useMemo(() => movements.filter((m) => filter === "All" || m.type === filter), [movements, filter])

  const splitMatches = splitSearch.trim()
    ? products.filter((p) => p.isActive && !p.isService && !p.pack.soldByMeasure && p.name.toLowerCase().includes(splitSearch.trim().toLowerCase())).slice(0, 6)
    : []

  function handleSendDraft(transfer: Transfer) {
    sendTransfer(isLarry, transfer.id)
    refresh()
    toast.success("Transfer sent")
  }

  function handleCancelDraft(transfer: Transfer) {
    cancelTransfer(isLarry, transfer.id)
    refresh()
    toast.success("Transfer cancelled")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={filter} onValueChange={(v) => setFilter(v as FilterOption)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All movements</SelectItem>
            {MOVEMENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setSplitPickerOpen(true)}>
            <Scissors />
            Split stock
          </Button>
          {isMultiLocation && (
            <Button onClick={() => setTransferOpen(true)}>
              <Plus />
              New transfer
            </Button>
          )}
        </div>
      </div>
      <LiveResultCount count={filtered.length} itemLabel="movement" />

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Movement no.</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Product(s)</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.id} className="cursor-pointer" onClick={() => setDetailTarget(m)}>
                <TableCell className="font-medium">{m.id}</TableCell>
                <TableCell>
                  <StatusBadge label={m.type} tone="neutral" />
                </TableCell>
                <TableCell>{movementProductLabel(m)}</TableCell>
                <TableCell>{movementQuantity(m)}</TableCell>
                <TableCell className="text-muted-foreground">{movementDate(m)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${m.id}`}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDetailTarget(m)}>View details</DropdownMenuItem>
                      {m.type === "Transfer" && m.status === "Draft" && (
                        <>
                          <DropdownMenuItem onClick={() => handleSendDraft(m)}>Send</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCancelDraft(m)}>Cancel</DropdownMenuItem>
                        </>
                      )}
                      {m.type === "Transfer" && m.status === "In transit" && (
                        <DropdownMenuItem onClick={() => setReceiveTarget(m)}>Receive</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No movements match this filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={detailTarget !== null} onOpenChange={(open) => !open && setDetailTarget(null)}>
        <SheetContent className="sm:max-w-sm">
          {detailTarget && (
            <>
              <SheetHeader>
                <SheetTitle className="font-sans">{detailTarget.id}</SheetTitle>
                <SheetDescription>{detailTarget.type} · {movementProductLabel(detailTarget)}</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-3 px-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {detailTarget.type === "Transfer" ? "From → To" : "Location"}
                  </span>
                  <span className="font-medium">
                    {detailTarget.type === "Transfer"
                      ? `${locationName(locations, detailTarget.fromLocationId)} → ${locationName(locations, detailTarget.toLocationId)}`
                      : locationName(locations, detailTarget.locationId)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-medium">{movementQuantity(detailTarget)}</span>
                </div>
                {detailTarget.type === "Transfer" && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge label={detailTarget.status} />
                  </div>
                )}
                {(detailTarget.type === "Adjustment" || detailTarget.type === "Return") && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Reason</span>
                    <span className="font-medium">{detailTarget.reason}</span>
                  </div>
                )}
                {detailTarget.type === "Transfer" && detailTarget.hasDiscrepancy && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Discrepancy</span>
                    <span className="font-medium text-destructive">{detailTarget.discrepancyReason}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">User</span>
                  <span className="font-medium">{detailTarget.type === "Transfer" ? detailTarget.createdBy : detailTarget.userName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{movementDate(detailTarget)}</span>
                </div>
                {detailTarget.type === "Transfer" && detailTarget.note && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Note</span>
                    <span>{detailTarget.note}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <CreateTransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        locations={visibleLocations}
        products={products}
        isLarry={isLarry}
        userName={userName}
        onCreated={refresh}
      />

      <ReceiveTransferDialog
        transfer={receiveTarget}
        isLarry={isLarry}
        onOpenChange={(open) => !open && setReceiveTarget(null)}
        onReceived={() => {
          refresh()
          setReceiveTarget(null)
        }}
      />

      {splitPickerOpen && !splitTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4" onClick={() => setSplitPickerOpen(false)}>
          <div className="flex w-full max-w-sm flex-col gap-3 rounded-xl bg-popover p-5 shadow-lg ring-1 ring-foreground/10" onClick={(e) => e.stopPropagation()}>
            <p className="font-medium">Split stock — choose a product</p>
            <Input value={splitSearch} onChange={(e) => setSplitSearch(e.target.value)} placeholder="Search product..." aria-label="Search product" autoFocus />
            <div className="flex flex-col divide-y">
              {splitMatches.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className="px-1 py-2 text-left text-sm hover:bg-accent/60"
                  onClick={() => {
                    setSplitTarget(product)
                    setSplitPickerOpen(false)
                    setSplitSearch("")
                  }}
                >
                  {product.name}
                </button>
              ))}
              {splitSearch.trim() && splitMatches.length === 0 && (
                <p className="py-2 text-sm text-muted-foreground">No packaged products match.</p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setSplitPickerOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <SplitStockDialog
        product={splitTarget}
        locations={locations}
        isMultiLocation={isMultiLocation}
        isLarry={isLarry}
        userName={userName}
        onOpenChange={(open) => !open && setSplitTarget(null)}
        onSplit={() => {
          refresh()
          setSplitTarget(null)
        }}
      />
    </div>
  )
}
