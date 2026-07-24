"use client"

import { useMemo, useState } from "react"
import { X } from "lucide-react"
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
import type { Location } from "@/lib/mock-data"
import { availableAt, type Product } from "@/lib/pos-data"
import { createTransfer } from "@/lib/stock-movements-data"

interface DraftLine {
  productId: string
  productName: string
  quantitySent: string
}

export function CreateTransferDialog({
  open,
  onOpenChange,
  locations,
  products,
  isLarry,
  userName,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  locations: Location[]
  products: Product[]
  isLarry: boolean
  userName: string
  onCreated: () => void
}) {
  const [fromLocationId, setFromLocationId] = useState(locations[1]?.id ?? locations[0]?.id ?? "")
  const [toLocationId, setToLocationId] = useState(locations[0]?.id ?? "")
  const [note, setNote] = useState("")
  const [lines, setLines] = useState<DraftLine[]>([])
  const [productSearch, setProductSearch] = useState("")

  const matches = useMemo(
    () => (productSearch.trim() ? products.filter((p) => p.isActive && !p.isService && p.name.toLowerCase().includes(productSearch.trim().toLowerCase())).slice(0, 6) : []),
    [productSearch, products]
  )

  function resetForm() {
    setFromLocationId(locations[1]?.id ?? locations[0]?.id ?? "")
    setToLocationId(locations[0]?.id ?? "")
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
      if (prev.some((l) => l.productId === product.id)) return prev
      return [...prev, { productId: product.id, productName: product.name, quantitySent: "1" }]
    })
    setProductSearch("")
  }

  function updateLine(index: number, quantitySent: string) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, quantitySent } : l)))
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  const missingFields = [
    !fromLocationId && "a source location",
    !toLocationId && "a destination location",
    fromLocationId && toLocationId && fromLocationId === toLocationId && "two different locations",
    lines.length === 0 && "at least one item",
  ].filter(Boolean) as string[]
  const canSave = missingFields.length === 0

  function handleSave(sendNow: boolean) {
    if (!fromLocationId || !toLocationId || fromLocationId === toLocationId || lines.length === 0) return
    const validLines = lines
      .map((l) => ({ productId: l.productId, productName: l.productName, quantitySent: Number.parseFloat(l.quantitySent) || 0 }))
      .filter((l) => l.quantitySent > 0)
    if (validLines.length === 0) return

    const transfer = createTransfer(isLarry, {
      fromLocationId,
      toLocationId,
      lines: validLines,
      note: note.trim() || undefined,
      userName,
      sendNow,
    })
    toast.success(sendNow ? "Transfer sent" : "Transfer saved as draft", { description: `${transfer.id} — ${validLines.length} product${validLines.length === 1 ? "" : "s"}` })
    onCreated()
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New transfer</DialogTitle>
          <DialogDescription>Stock leaves the source and sits &quot;in transit&quot; until the destination confirms receipt.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-1 pb-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="transfer-from">From</Label>
              <Select value={fromLocationId} onValueChange={setFromLocationId}>
                <SelectTrigger className="w-full" id="transfer-from">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="transfer-to">To</Label>
              <Select value={toLocationId} onValueChange={setToLocationId}>
                <SelectTrigger className="w-full" id="transfer-to">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {fromLocationId === toLocationId && <p className="text-xs text-destructive">Choose two different locations.</p>}

          <div className="flex flex-col gap-2">
            <Label>Items</Label>
            <div className="relative">
              <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search product..." aria-label="Search product" />
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
                      <span className="text-muted-foreground">{availableAt(product, fromLocationId)} available at source</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col divide-y rounded-lg border">
              {lines.map((line, index) => (
                <div key={line.productId} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{line.productName}</span>
                  <Input type="number" min="0" value={line.quantitySent} onChange={(e) => updateLine(index, e.target.value)} className="h-8 w-20 px-2" />
                  <Button variant="ghost" size="icon-sm" onClick={() => removeLine(index)} aria-label={`Remove ${line.productName}`}>
                    <X className="size-3.5" />
                  </Button>
                </div>
              ))}
              {lines.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No items yet — search above to add one.</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="transfer-note">Note</Label>
            <Textarea id="transfer-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        {!canSave && missingFields.length > 0 && (
          <p className="text-right text-xs text-muted-foreground">Still needs: {missingFields.join(", ")}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={!canSave}>
            Save as draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={!canSave}>
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
