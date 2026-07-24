"use client"

import { useMemo, useState } from "react"
import { Plus, X } from "lucide-react"

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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AREAS, CUSTOMERS, formatGHS } from "@/lib/mock-data"
import { searchProducts } from "@/lib/pos-data"
import { INVOICES } from "@/lib/invoice-data"
import { SALES_RECORDS } from "@/lib/sales-data"
import {
  createDelivery,
  getClaimedQuantities,
  getLastClaimDate,
  getProductByName,
  type Delivery,
  type DeliveryLineItem,
} from "@/lib/deliveries-data"
import { formatDateDisplay, TODAY_ISO } from "@/lib/period-utils"

type CreationPath = "sale" | "invoice" | "manual"

const WINDOW_PRESETS = ["Morning", "Afternoon", "Evening"]

interface DraftLine extends DeliveryLineItem {
  totalQty: number
  alreadyClaimed: number
}

export function CreateDeliveryDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (delivery: Delivery) => void
}) {
  const [path, setPath] = useState<CreationPath>("sale")
  const [sourceRef, setSourceRef] = useState("")
  const [draftLines, setDraftLines] = useState<DraftLine[]>([])

  const [customer, setCustomer] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [area, setArea] = useState("")

  const [isCod, setIsCod] = useState(false)
  const [codAmount, setCodAmount] = useState("0")
  const [scheduledDateISO, setScheduledDateISO] = useState(TODAY_ISO)
  const [windowPreset, setWindowPreset] = useState("Morning")
  const [customWindow, setCustomWindow] = useState("")
  const [note, setNote] = useState("")

  const [productSearch, setProductSearch] = useState("")
  const matches = useMemo(() => (productSearch.trim() ? searchProducts(productSearch) : []), [productSearch])

  const eligibleSales = useMemo(() => SALES_RECORDS.filter((s) => s.status !== "On hold"), [])
  const eligibleInvoices = useMemo(() => INVOICES.filter((inv) => inv.status !== "Void"), [])

  function resetForm() {
    setPath("sale")
    setSourceRef("")
    setDraftLines([])
    setCustomer("")
    setPhone("")
    setAddress("")
    setArea("")
    setIsCod(false)
    setCodAmount("0")
    setScheduledDateISO(TODAY_ISO)
    setWindowPreset("Morning")
    setCustomWindow("")
    setNote("")
    setProductSearch("")
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm()
    onOpenChange(next)
  }

  function prefillCustomer(name: string) {
    const matched = CUSTOMERS.find((c) => c.name === name)
    setCustomer(name)
    setPhone(matched?.phone ?? "")
    setArea(matched?.area ?? "")
    setAddress(matched ? `${matched.area}, Accra` : "")
  }

  function handlePickSale(receiptNo: string) {
    const sale = SALES_RECORDS.find((s) => s.receiptNo === receiptNo)
    if (!sale) return
    setSourceRef(receiptNo)
    prefillCustomer(sale.customer)
    setIsCod(sale.type === "Credit" || sale.type === "Deposit")

    const claimed = getClaimedQuantities("sale", receiptNo)
    const lines: DraftLine[] = sale.lineItems.map((li) => {
      const already = claimed[li.name] ?? 0
      const remaining = Math.max(0, li.quantity - already)
      const product = getProductByName(li.name)
      return {
        productId: product?.id ?? "",
        name: li.name,
        quantity: remaining,
        unitPrice: li.unitPrice,
        totalQty: li.quantity,
        alreadyClaimed: already,
      }
    })
    setDraftLines(lines)
    const codTotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0)
    setCodAmount(String(codTotal))
  }

  function handlePickInvoice(invoiceId: string) {
    const invoice = INVOICES.find((inv) => inv.id === invoiceId)
    if (!invoice) return
    setSourceRef(invoiceId)
    prefillCustomer(invoice.customer)
    setIsCod(invoice.balance > 0)

    const claimed = getClaimedQuantities("invoice", invoiceId)
    const lines: DraftLine[] = invoice.lineItems.map((li) => {
      const already = claimed[li.name] ?? 0
      const remaining = Math.max(0, li.quantity - already)
      const product = getProductByName(li.name)
      return {
        productId: product?.id ?? "",
        name: li.name,
        quantity: remaining,
        unitPrice: li.unitPrice,
        totalQty: li.quantity,
        alreadyClaimed: already,
      }
    })
    setDraftLines(lines)
    setCodAmount(invoice.balance > 0 ? String(invoice.balance) : "0")
  }

  function handlePathChange(next: CreationPath) {
    setPath(next)
    setSourceRef("")
    setDraftLines([])
    setCustomer("")
    setPhone("")
    setAddress("")
    setArea("")
    setIsCod(false)
    setCodAmount("0")
  }

  function updateDraftQuantity(index: number, quantity: number) {
    setDraftLines((prev) => prev.map((line, i) => (i === index ? { ...line, quantity } : line)))
  }

  function addManualProduct(name: string, price: number, productId: string) {
    setDraftLines((prev) => {
      const existing = prev.findIndex((l) => l.name === name)
      if (existing >= 0) {
        return prev.map((l, i) => (i === existing ? { ...l, quantity: l.quantity + 1 } : l))
      }
      return [...prev, { productId, name, quantity: 1, unitPrice: price, totalQty: 1, alreadyClaimed: 0 }]
    })
    setProductSearch("")
  }

  function removeManualLine(index: number) {
    setDraftLines((prev) => prev.filter((_, i) => i !== index))
  }

  const effectiveWindow = windowPreset === "Custom" ? customWindow : windowPreset
  const lineItemsForCreate: DeliveryLineItem[] = draftLines
    .filter((l) => l.quantity > 0 && l.productId)
    .map((l) => ({ productId: l.productId, name: l.name, quantity: l.quantity, unitPrice: l.unitPrice }))

  const missingFields = [
    !customer.trim() && "a customer",
    lineItemsForCreate.length === 0 && "at least one item",
  ].filter(Boolean) as string[]

  function handleSubmit() {
    if (!customer.trim() || lineItemsForCreate.length === 0) return
    const delivery = createDelivery({
      customer: customer.trim(),
      phone,
      address,
      area,
      lineItems: lineItemsForCreate,
      isCod,
      codAmount: Number.parseFloat(codAmount) || 0,
      scheduledDateISO,
      window: effectiveWindow || "Morning",
      note: note.trim() || undefined,
      sourceType: path,
      fromReceiptNo: path === "sale" ? sourceRef : undefined,
      fromInvoiceNo: path === "invoice" ? sourceRef : undefined,
    })
    onCreate(delivery)
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New delivery</DialogTitle>
          <DialogDescription>Every delivery links back to where it came from — a sale, an invoice, or built manually.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-1 pb-1">
          <ToggleGroup type="single" value={path} onValueChange={(v) => v && handlePathChange(v as CreationPath)} variant="outline" className="w-full">
            <ToggleGroupItem value="sale" className="flex-1">From a sale</ToggleGroupItem>
            <ToggleGroupItem value="invoice" className="flex-1">From an invoice</ToggleGroupItem>
            <ToggleGroupItem value="manual" className="flex-1">Manual</ToggleGroupItem>
          </ToggleGroup>

          {path === "sale" && (
            <div className="flex flex-col gap-1.5">
              <Label>Select a receipt</Label>
              <Select value={sourceRef} onValueChange={handlePickSale}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Search sales..." />
                </SelectTrigger>
                <SelectContent>
                  {eligibleSales.map((sale) => (
                    <SelectItem key={sale.receiptNo} value={sale.receiptNo}>
                      {sale.receiptNo} · {sale.customer} · {formatGHS(sale.amount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {path === "invoice" && (
            <div className="flex flex-col gap-1.5">
              <Label>Select an invoice</Label>
              <Select value={sourceRef} onValueChange={handlePickInvoice}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Search invoices..." />
                </SelectTrigger>
                <SelectContent>
                  {eligibleInvoices.map((invoice) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.id} · {invoice.customer} · {formatGHS(invoice.total)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(path === "sale" || path === "invoice") && draftLines.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Items</p>
              {draftLines.map((line, index) => (
                <div key={line.name} className="flex flex-col gap-1 border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{line.name}</span>
                    <Input
                      type="number"
                      min="0"
                      value={line.quantity}
                      onChange={(event) => updateDraftQuantity(index, Number.parseFloat(event.target.value) || 0)}
                      className="h-8 w-20 px-2"
                    />
                  </div>
                  {line.alreadyClaimed > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {line.alreadyClaimed} of {line.totalQty} dispatched on{" "}
                      {formatDateDisplay(getLastClaimDate(path, sourceRef) ?? TODAY_ISO)} · {Math.max(0, line.totalQty - line.alreadyClaimed)} remaining
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {path === "manual" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="del-customer">Customer</Label>
                <Select value={customer} onValueChange={prefillCustomer}>
                  <SelectTrigger className="w-full" id="del-customer">
                    <SelectValue placeholder="Select a customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOMERS.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Items</Label>
                <div className="relative">
                  <Input
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    placeholder="Search product from catalogue..." aria-label="Search product from catalogue"
                  />
                  {matches.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-sm">
                      {matches.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addManualProduct(product.name, product.sellingPrice, product.id)}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                        >
                          <span>{product.name}</span>
                          <span className="text-muted-foreground">{formatGHS(product.sellingPrice)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col divide-y rounded-lg border">
                  {draftLines.map((line, index) => (
                    <div key={line.name} className="flex items-center gap-2 px-3 py-2 text-sm">
                      <span className="min-w-0 flex-1 truncate">{line.name}</span>
                      <Input
                        type="number"
                        min="0"
                        value={line.quantity}
                        onChange={(event) => updateDraftQuantity(index, Number.parseFloat(event.target.value) || 0)}
                        className="h-8 w-16 px-2"
                      />
                      <span className="w-20 text-right font-medium">{formatGHS(line.quantity * line.unitPrice)}</span>
                      <Button variant="ghost" size="icon-sm" onClick={() => removeManualLine(index)} aria-label={`Remove ${line.name}`}>
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                  {draftLines.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">No items yet — search above to add one.</p>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="del-phone">Contact phone</Label>
              <Input id="del-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="del-area">Area</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger className="w-full" id="del-area">
                  <SelectValue placeholder="Select area..." />
                </SelectTrigger>
                <SelectContent>
                  {AREAS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="del-address">Delivery address</Label>
            <Input id="del-address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="House number, street, landmark..." />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Cash on delivery</p>
              <p className="text-xs text-muted-foreground">Off if the sale was already paid.</p>
            </div>
            <Switch checked={isCod} onCheckedChange={setIsCod} />
          </div>

          {isCod && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="del-cod">COD amount (GHS)</Label>
              <Input id="del-cod" type="number" min="0" value={codAmount} onChange={(event) => setCodAmount(event.target.value)} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="del-date">Scheduled date</Label>
              <Input id="del-date" type="date" value={scheduledDateISO} onChange={(event) => setScheduledDateISO(event.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="del-window">Window</Label>
              <Select value={windowPreset} onValueChange={setWindowPreset}>
                <SelectTrigger className="w-full" id="del-window">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WINDOW_PRESETS.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {windowPreset === "Custom" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="del-custom-window">Custom window</Label>
              <Input id="del-custom-window" value={customWindow} onChange={(event) => setCustomWindow(event.target.value)} placeholder="e.g. 2:00 – 3:00 pm" />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="del-note">Note for the rider</Label>
            <Textarea id="del-note" value={note} onChange={(event) => setNote(event.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex flex-col items-end gap-1">
            {missingFields.length > 0 && (
              <p className="text-xs text-muted-foreground">Still needs: {missingFields.join(", ")}</p>
            )}
            <Button onClick={handleSubmit} disabled={!customer.trim() || lineItemsForCreate.length === 0}>
              <Plus />
              Create delivery
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
