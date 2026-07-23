"use client"

import { useMemo, useState } from "react"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatGHS, getVisibleLocations, LOCATIONS, SUPPLIERS } from "@/lib/mock-data"
import { LARRY_LOCATIONS, LARRY_SUPPLIERS, getLarryProductsStore } from "@/lib/larry-data"
import { getProductsStore, type Product } from "@/lib/pos-data"
import { nextPONumber, purchaseOrderStoreFor, type POLineItem, type PurchaseOrder } from "@/lib/purchase-orders-data"
import { TODAY_ISO } from "@/lib/period-utils"
import { useDemoState } from "@/hooks/use-demo-state"
import { isMultiLocationTier } from "@/lib/modules"

type DraftLine = POLineItem

export function NewPODialog({
  open,
  onOpenChange,
  isLarry,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  isLarry: boolean
  onCreate: () => void
}) {
  const { state } = useDemoState()
  const isMultiLocation = isMultiLocationTier(state.tier)
  const suppliers = isLarry ? LARRY_SUPPLIERS : SUPPLIERS
  const locations = isLarry ? LARRY_LOCATIONS : LOCATIONS
  const visibleLocations = getVisibleLocations(locations, isMultiLocation)
  const products = isLarry ? getLarryProductsStore() : getProductsStore()

  const [supplierId, setSupplierId] = useState("")
  const [locationId, setLocationId] = useState(() => locations.find((l) => l.isDefaultReceiving)?.id ?? locations[0]?.id ?? "")
  const [expectedDate, setExpectedDate] = useState("")
  const [note, setNote] = useState("")
  const [lines, setLines] = useState<DraftLine[]>([])
  const [productSearch, setProductSearch] = useState("")

  const matches = useMemo(
    () => (productSearch.trim() ? products.filter((p) => p.isActive && !p.isService && p.name.toLowerCase().includes(productSearch.trim().toLowerCase())).slice(0, 6) : []),
    [productSearch, products]
  )

  function resetForm() {
    setSupplierId("")
    setLocationId(locations.find((l) => l.isDefaultReceiving)?.id ?? locations[0]?.id ?? "")
    setExpectedDate("")
    setNote("")
    setLines([])
    setProductSearch("")
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm()
    onOpenChange(next)
  }

  function addLine(product: Product) {
    setLines((prev) => {
      const existing = prev.findIndex((l) => l.productId === product.id)
      if (existing >= 0) return prev.map((l, i) => (i === existing ? { ...l, orderedQty: l.orderedQty + 1 } : l))
      const unitsPerPurchase = product.pack.soldByMeasure ? 1 : product.pack.unitsPerPurchaseUnit ?? 1
      return [...prev, { productId: product.id, productName: product.name, orderedQty: 1, receivedQty: 0, unitCost: Math.round(product.costPrice * unitsPerPurchase * 100) / 100 }]
    })
    setProductSearch("")
  }

  function updateLine(index: number, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  function unitLabel(productId: string): string {
    const product = products.find((p) => p.id === productId)
    if (!product) return ""
    return product.pack.soldByMeasure ? product.pack.baseUnit : product.pack.purchaseUnit ?? "unit"
  }

  const total = lines.reduce((sum, l) => sum + l.orderedQty * l.unitCost, 0)

  function handleSave(status: "Draft" | "Sent") {
    if (!supplierId || lines.length === 0) return
    const supplier = suppliers.find((s) => s.id === supplierId)
    const newPO: PurchaseOrder = {
      id: nextPONumber(isLarry),
      supplierId,
      supplierName: supplier?.businessName ?? "Unknown supplier",
      locationId,
      status,
      createdDate: TODAY_ISO,
      expectedDate: expectedDate || TODAY_ISO,
      lineItems: lines,
      note: note.trim() || undefined,
    }
    const store = purchaseOrderStoreFor(isLarry)
    store.set([newPO, ...store.get()])
    toast.success(status === "Sent" ? "Purchase order sent" : "Saved as draft", { description: `${newPO.id} — ${formatGHS(total)}` })
    onCreate()
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New purchase order</DialogTitle>
          <DialogDescription>Quantities are in purchase units — cartons, not tins.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-1 pb-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="po-supplier">Supplier</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger className="w-full" id="po-supplier">
                  <SelectValue placeholder="Select supplier..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="po-date">Expected delivery</Label>
              <Input id="po-date" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="po-location">Delivery location</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger className="w-full" id="po-location">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {visibleLocations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Items</Label>
            <div className="relative">
              <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search product..." />
              {matches.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-sm">
                  {matches.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addLine(product)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      <span>{product.name}</span>
                      <span className="text-muted-foreground">{formatGHS(product.costPrice)}/{product.pack.baseUnit}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col divide-y rounded-lg border">
              {lines.map((line, index) => (
                <div key={line.productId} className="grid grid-cols-[1fr_70px_90px_90px_28px] items-center gap-2 px-3 py-2 text-sm">
                  <span className="truncate">
                    {line.productName} <span className="text-xs text-muted-foreground">({unitLabel(line.productId)})</span>
                  </span>
                  <Input type="number" min="0" value={line.orderedQty} onChange={(e) => updateLine(index, { orderedQty: Number.parseFloat(e.target.value) || 0 })} className="h-8 px-2" />
                  <Input type="number" min="0" value={line.unitCost} onChange={(e) => updateLine(index, { unitCost: Number.parseFloat(e.target.value) || 0 })} className="h-8 px-2" />
                  <span className="text-right font-medium">{formatGHS(line.orderedQty * line.unitCost)}</span>
                  <Button variant="ghost" size="icon-sm" onClick={() => removeLine(index)} aria-label={`Remove ${line.productName}`}>
                    <X className="size-3.5" />
                  </Button>
                </div>
              ))}
              {lines.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No items yet — search above to add one.</p>}
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm font-semibold">
              <span>Total</span>
              <span>{formatGHS(total)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="po-note">Note</Label>
            <Textarea id="po-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => handleSave("Draft")} disabled={!supplierId || lines.length === 0}>
            Save as draft
          </Button>
          <Button onClick={() => handleSave("Sent")} disabled={!supplierId || lines.length === 0}>
            <Plus />
            Save & send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
