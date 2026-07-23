"use client"

import { useState } from "react"
import { ScanLine } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { PAYMENT_TERMS, formatGHS, getVisibleLocations, LOCATIONS } from "@/lib/mock-data"
import { LARRY_LOCATIONS, getLarryProductsStore } from "@/lib/larry-data"
import { findProductByBarcode } from "@/lib/pos-data"
import { receivePurchaseOrder, type CostChangeNote, type PurchaseOrder, type SupplierBill } from "@/lib/purchase-orders-data"
import { TODAY_ISO } from "@/lib/period-utils"
import { useDemoState } from "@/hooks/use-demo-state"
import { isMultiLocationTier } from "@/lib/modules"

interface ReceiveLineState {
  productId: string
  productName: string
  ordered: number
  alreadyReceived: number
  receivingNow: string
  unitCost: string
}

export function ReceiveGoodsSheet({
  po,
  isLarry,
  onOpenChange,
  onReceived,
}: {
  po: PurchaseOrder | null
  isLarry: boolean
  onOpenChange: (open: boolean) => void
  onReceived: () => void
}) {
  const { state } = useDemoState()
  const isMultiLocation = isMultiLocationTier(state.tier)
  const locations = isLarry ? LARRY_LOCATIONS : LOCATIONS
  const visibleLocations = getVisibleLocations(locations, isMultiLocation)

  const [locationId, setLocationId] = useState("")
  const [lines, setLines] = useState<ReceiveLineState[]>([])
  const [closeShort, setCloseShort] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [invoiceDate, setInvoiceDate] = useState(TODAY_ISO)
  const [invoiceAmount, setInvoiceAmount] = useState("")
  const [paymentTerms, setPaymentTerms] = useState(PAYMENT_TERMS[0])
  const [isPaid, setIsPaid] = useState(false)
  const [prevPOId, setPrevPOId] = useState<string | null>(null)
  const [costNotes, setCostNotes] = useState<CostChangeNote[]>([])

  if (po && po.id !== prevPOId) {
    setPrevPOId(po.id)
    setLocationId(po.locationId)
    setLines(
      po.lineItems.map((li) => ({
        productId: li.productId,
        productName: li.productName,
        ordered: li.orderedQty,
        alreadyReceived: li.receivedQty,
        receivingNow: String(Math.max(0, li.orderedQty - li.receivedQty)),
        unitCost: String(li.unitCost),
      }))
    )
    setCloseShort(false)
    setInvoiceNumber("")
    setInvoiceDate(TODAY_ISO)
    setInvoiceAmount(String(po.lineItems.reduce((sum, li) => sum + Math.max(0, li.orderedQty - li.receivedQty) * li.unitCost, 0)))
    setPaymentTerms(PAYMENT_TERMS[0])
    setIsPaid(false)
    setCostNotes([])
  }

  const [scanValue, setScanValue] = useState("")

  function handleScanSubmit() {
    if (!scanValue.trim()) return
    scanProduct(scanValue.trim())
    setScanValue("")
  }

  function updateLine(productId: string, patch: Partial<ReceiveLineState>) {
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, ...patch } : l)))
  }

  function scanProduct(barcode: string) {
    const trimmed = barcode.trim()
    const product = isLarry
      ? getLarryProductsStore().find((p) => p.barcode === trimmed)
      : findProductByBarcode(trimmed)
    if (!product) {
      toast.error("Barcode not recognised for this order.")
      return
    }
    const onOrder = lines.some((l) => l.productId === product.id)
    if (!onOrder) {
      toast.error(`${product.name} isn't a line on this order.`)
      return
    }
    setLines((prev) => prev.map((l) => (l.productId === product.id ? { ...l, receivingNow: String((Number.parseFloat(l.receivingNow) || 0) + 1) } : l)))
  }

  const total = lines.reduce((sum, l) => sum + (Number.parseFloat(l.receivingNow) || 0) * (Number.parseFloat(l.unitCost) || 0), 0)
  const anyShort = lines.some((l) => (Number.parseFloat(l.receivingNow) || 0) + l.alreadyReceived < l.ordered)

  function handleConfirm() {
    if (!po) return
    const receiveLines = lines
      .filter((l) => (Number.parseFloat(l.receivingNow) || 0) > 0)
      .map((l) => ({ productId: l.productId, receivingNow: Number.parseFloat(l.receivingNow) || 0, unitCost: Number.parseFloat(l.unitCost) || 0 }))

    if (receiveLines.length === 0) {
      toast.error("Enter at least one quantity to receive.")
      return
    }

    const bill: SupplierBill | undefined = invoiceNumber.trim()
      ? { invoiceNumber: invoiceNumber.trim(), invoiceDate, amount: Number.parseFloat(invoiceAmount) || 0, paymentTerms, isPaid }
      : undefined

    const notes = receivePurchaseOrder(isLarry, po.id, locationId, receiveLines, bill, closeShort)
    setCostNotes(notes)

    toast.success("Goods received", { description: `${po.id} — ${formatGHS(total)} received.` })
    onReceived()
  }

  return (
    <Sheet open={po !== null} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-xl">
        {po && (
          <>
            <SheetHeader>
              <SheetTitle className="font-sans">Receive goods — {po.id}</SheetTitle>
              <SheetDescription>{po.supplierName}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="receive-location">Receiving location</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger className="w-full" id="receive-location">
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

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="receive-scan">Scan barcode</Label>
                <div className="relative">
                  <ScanLine className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="receive-scan"
                    value={scanValue}
                    onChange={(e) => setScanValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleScanSubmit()
                      }
                    }}
                    placeholder="Scan or type a barcode, then press Enter..."
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Scanning a product on this order increments its receiving-now quantity.</p>
              </div>

              <div className="flex flex-col divide-y rounded-lg border">
                <div className="grid grid-cols-[1fr_70px_80px_90px_90px_80px] gap-2 px-3 py-1.5 text-xs text-muted-foreground">
                  <span>Product</span>
                  <span>Ordered</span>
                  <span>Received</span>
                  <span>Receiving now</span>
                  <span>Unit cost</span>
                  <span className="text-right">Line total</span>
                </div>
                {lines.map((line) => (
                  <div key={line.productId} className="grid grid-cols-[1fr_70px_80px_90px_90px_80px] items-center gap-2 px-3 py-2 text-sm">
                    <span className="truncate">{line.productName}</span>
                    <span className="text-muted-foreground">{line.ordered}</span>
                    <span className="text-muted-foreground">{line.alreadyReceived}</span>
                    <Input
                      type="number"
                      min="0"
                      value={line.receivingNow}
                      onChange={(e) => updateLine(line.productId, { receivingNow: e.target.value })}
                      className="h-8 px-2"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={line.unitCost}
                      onChange={(e) => updateLine(line.productId, { unitCost: e.target.value })}
                      className="h-8 px-2"
                    />
                    <span className="text-right font-medium">{formatGHS((Number.parseFloat(line.receivingNow) || 0) * (Number.parseFloat(line.unitCost) || 0))}</span>
                  </div>
                ))}
              </div>

              {anyShort && (
                <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <div>
                    <p className="text-sm font-medium">This delivery is short</p>
                    <p className="text-xs text-muted-foreground">Close the remainder as never coming, or leave it open to receive later.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="close-short" className="text-xs">Close short</Label>
                    <Switch id="close-short" checked={closeShort} onCheckedChange={setCloseShort} />
                  </div>
                </div>
              )}

              {costNotes.length > 0 && (
                <div className="flex flex-col gap-1.5 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                  {costNotes.map((note) => (
                    <p key={note.productName}>
                      Cost updated: {formatGHS(note.fromCost)} → {formatGHS(note.toCost)} (weighted average of {note.existingQty} existing @ {formatGHS(note.existingCost)} and {note.receivedQty} received @ {formatGHS(note.receivedCostPerBase)})
                    </p>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-3 rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase">Supplier bill</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="bill-invoice">Invoice number</Label>
                    <Input id="bill-invoice" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="bill-date">Invoice date</Label>
                    <Input id="bill-date" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="bill-amount">Amount</Label>
                    <Input id="bill-amount" type="number" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="bill-terms">Payment terms</Label>
                    <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                      <SelectTrigger className="w-full" id="bill-terms">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_TERMS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="bill-paid" className="text-sm font-normal">
                    Paid now
                  </Label>
                  <Switch id="bill-paid" checked={isPaid} onCheckedChange={setIsPaid} />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3 text-base font-semibold">
                <span>Receiving total</span>
                <span>{formatGHS(total)}</span>
              </div>
            </div>

            <SheetFooter>
              <Button onClick={handleConfirm}>Confirm receipt</Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
