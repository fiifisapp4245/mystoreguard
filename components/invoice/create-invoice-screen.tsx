"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { toast } from "sonner"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AddCustomerDialog } from "@/components/hubs/people/add-customer-dialog"
import { CustomerPicker } from "@/components/register/customer-picker"
import { InvoiceItemsSection } from "@/components/invoice/invoice-items-section"
import { InvoicePreview } from "@/components/invoice/invoice-preview"
import { CUSTOMERS, formatGHS, type Customer } from "@/lib/mock-data"
import {
  buildInvoiceLineItemsFromQuotation,
  getQuotationsStore,
  setQuotationsStore,
} from "@/lib/estimator-data"
import {
  computeInvoiceTotals,
  getInvoicesStore,
  nextInvoiceNumber,
  setInvoicesStore,
  DUE_DATE_QUICK_OPTIONS,
  type Invoice,
  type InvoiceLineItem,
  type InvoiceStatus,
} from "@/lib/invoice-data"
import { SALES_RECORDS } from "@/lib/sales-data"
import { TODAY_ISO } from "@/lib/period-utils"

type CreationPath = "sale" | "quotation" | "blank"

export function CreateInvoiceScreen() {
  const router = useRouter()

  const [creationPath, setCreationPath] = useState<CreationPath>("sale")
  const [fromReceiptNo, setFromReceiptNo] = useState<string | undefined>()
  const [fromQuotationNo, setFromQuotationNo] = useState<string | undefined>()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerName, setCustomerName] = useState("")
  const [addCustomerOpen, setAddCustomerOpen] = useState(false)

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([])

  const [discountMode, setDiscountMode] = useState<"amount" | "percent">("amount")
  const [discountInput, setDiscountInput] = useState("0")

  const [issueDate, setIssueDate] = useState(TODAY_ISO)
  const [dueDate, setDueDate] = useState("")
  const [note, setNote] = useState("")
  const [paymentInstructions, setPaymentInstructions] = useState(
    "Payment accepted via Cash, Momo, or Bank transfer."
  )

  const displayName = customer?.name ?? customerName
  const availableQuotations = useMemo(
    () => getQuotationsStore().filter((quotation) => quotation.status === "Accepted"),
    []
  )

  const subtotalRaw = lineItems.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)
  const discountAmount =
    discountMode === "percent"
      ? Math.round(subtotalRaw * ((Number.parseFloat(discountInput) || 0) / 100) * 100) / 100
      : Number.parseFloat(discountInput) || 0

  const { subtotal, taxLines, total } = computeInvoiceTotals(lineItems, discountAmount)

  function handlePickSale(receiptNo: string) {
    const sale = SALES_RECORDS.find((s) => s.receiptNo === receiptNo)
    if (!sale) return
    setFromReceiptNo(receiptNo)
    setFromQuotationNo(undefined)
    const matched = CUSTOMERS.find((c) => c.name === sale.customer) ?? null
    setCustomer(matched)
    setCustomerName(sale.customer)
    setLineItems(sale.lineItems.map((line) => ({ name: line.name, quantity: line.quantity, unitPrice: line.unitPrice })))
  }

  function handlePickQuotation(quotationId: string) {
    const quotation = getQuotationsStore().find((q) => q.id === quotationId)
    if (!quotation) return
    setFromQuotationNo(quotationId)
    setFromReceiptNo(undefined)
    const matched = CUSTOMERS.find((c) => c.name === quotation.customer) ?? null
    setCustomer(matched)
    setCustomerName(quotation.customer)
    setLineItems(buildInvoiceLineItemsFromQuotation(quotation))
  }

  function handlePathChange(path: CreationPath) {
    setCreationPath(path)
    setFromReceiptNo(undefined)
    setFromQuotationNo(undefined)
    if (path === "blank") {
      setCustomer(null)
      setCustomerName("")
      setLineItems([])
    }
  }

  function setQuickDueDate(days: number) {
    const base = new Date(`${issueDate}T00:00:00`)
    base.setDate(base.getDate() + days)
    setDueDate(base.toISOString().slice(0, 10))
  }

  function handleAddCustomer(newCustomer: Customer) {
    setCustomer(newCustomer)
    setCustomerName(newCustomer.name)
    setAddCustomerOpen(false)
    toast.success("Customer added", { description: `${newCustomer.name} has been added.` })
  }

  function handleSave(sendImmediately: boolean) {
    if (!displayName.trim()) {
      toast.error("Add a customer before saving.")
      return
    }
    if (lineItems.length === 0) {
      toast.error("Add at least one item before saving.")
      return
    }

    const id = nextInvoiceNumber()
    const status: InvoiceStatus = sendImmediately ? "Sent" : "Draft"
    const newInvoice: Invoice = {
      id,
      customer: displayName,
      issueDate,
      dueDate,
      lineItems,
      subtotal,
      discount: discountAmount,
      taxLines,
      total,
      amountPaid: 0,
      balance: total,
      status,
      note: note.trim() || undefined,
      fromReceiptNo,
      fromQuotationNo,
    }

    setInvoicesStore([newInvoice, ...getInvoicesStore()])

    if (fromQuotationNo) {
      setQuotationsStore(
        getQuotationsStore().map((quotation) =>
          quotation.id === fromQuotationNo
            ? { ...quotation, status: "Converted", convertedToInvoiceId: id }
            : quotation
        )
      )
    }

    toast.success(sendImmediately ? "Invoice sent" : "Draft saved", {
      description: `${id} — ${formatGHS(total)}`,
    })
    router.push("/invoice/invoices")
  }

  return (
    <div className="flex h-svh flex-col">
      <div className="flex h-10 shrink-0 items-center border-b px-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.back()}
          aria-label="Cancel and go back"
          className="text-muted-foreground"
        >
          <X className="size-4" />
        </Button>
        <span className="ml-2 text-sm font-medium">New invoice</span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[40%_60%]">
        <div className="flex min-h-0 flex-col overflow-y-auto border-r">
          <div className="flex flex-col gap-6 p-6">
            <div>
              <Label className="mb-2 text-xs text-muted-foreground">Create from</Label>
              <ToggleGroup
                type="single"
                value={creationPath}
                onValueChange={(value) => value && handlePathChange(value as CreationPath)}
                variant="outline"
                className="w-full"
              >
                <ToggleGroupItem value="sale" className="flex-1">
                  From a sale
                </ToggleGroupItem>
                <ToggleGroupItem value="quotation" className="flex-1">
                  From a quotation
                </ToggleGroupItem>
                <ToggleGroupItem value="blank" className="flex-1">
                  Blank
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {creationPath === "sale" && (
              <div className="flex flex-col gap-1.5">
                <Label>Select a receipt</Label>
                <Select value={fromReceiptNo ?? ""} onValueChange={handlePickSale}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Search sales..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SALES_RECORDS.filter((sale) => sale.type !== "On-hold").map((sale) => (
                      <SelectItem key={sale.receiptNo} value={sale.receiptNo}>
                        {sale.receiptNo} — {sale.customer} — {formatGHS(sale.amount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {creationPath === "quotation" && (
              <div className="flex flex-col gap-1.5">
                <Label>Select an accepted quotation</Label>
                <Select value={fromQuotationNo ?? ""} onValueChange={handlePickQuotation}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a quotation..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableQuotations.map((quotation) => (
                      <SelectItem key={quotation.id} value={quotation.id}>
                        {quotation.id} — {quotation.customer} — {formatGHS(quotation.total)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableQuotations.length === 0 && (
                  <p className="text-xs text-muted-foreground">No accepted quotations yet.</p>
                )}
              </div>
            )}

            <Accordion type="multiple" defaultValue={["customer", "items", "totals", "details"]} className="flex flex-col gap-2">
              <AccordionItem value="customer">
                <AccordionTrigger>Customer</AccordionTrigger>
                <AccordionContent>
                  <CustomerPicker
                    customer={customer}
                    onSelect={(selectedCustomer) => {
                      setCustomer(selectedCustomer)
                      setCustomerName(selectedCustomer?.name ?? "")
                    }}
                    onAddNew={() => setAddCustomerOpen(true)}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="items">
                <AccordionTrigger>Items</AccordionTrigger>
                <AccordionContent>
                  <InvoiceItemsSection lineItems={lineItems} onChange={setLineItems} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="totals">
                <AccordionTrigger>Totals</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatGHS(subtotalRaw)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">Discount</Label>
                      <Input
                        type="number"
                        min="0"
                        value={discountInput}
                        onChange={(event) => setDiscountInput(event.target.value)}
                        className="h-8 w-24"
                      />
                      <Select value={discountMode} onValueChange={(value) => setDiscountMode(value as "amount" | "percent")}>
                        <SelectTrigger size="sm" className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="amount">GHS</SelectItem>
                          <SelectItem value="percent">%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {taxLines.map((line) => (
                      <div key={line.label} className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{line.label}</span>
                        <span>{formatGHS(line.amount)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
                      <span>Total</span>
                      <span>{formatGHS(total)}</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="details">
                <AccordionTrigger>Details</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="issue-date">Issue date</Label>
                        <Input id="issue-date" type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="due-date">Due date</Label>
                        <Input id="due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {DUE_DATE_QUICK_OPTIONS.map((option) => (
                        <Button
                          key={option.label}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickDueDate(option.days)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="note">Invoice note</Label>
                      <Textarea id="note" value={note} onChange={(event) => setNote(event.target.value)} rows={2} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="payment-instructions">Payment instructions</Label>
                      <Textarea
                        id="payment-instructions"
                        value={paymentInstructions}
                        onChange={(event) => setPaymentInstructions(event.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="mt-auto flex gap-2 border-t bg-background p-4">
            <Button variant="outline" className="flex-1" onClick={() => handleSave(false)}>
              Save draft
            </Button>
            <Button className="flex-1" onClick={() => handleSave(true)}>
              Save &amp; send
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-y-auto bg-muted/30 p-8">
          <InvoicePreview
            invoiceNo={fromQuotationNo ? "New invoice" : "New invoice"}
            customerName={displayName}
            issueDate={issueDate}
            dueDate={dueDate}
            lineItems={lineItems}
            subtotal={subtotal}
            discount={discountAmount}
            taxLines={taxLines}
            total={total}
            note={note}
            paymentInstructions={paymentInstructions}
          />
        </div>
      </div>

      <AddCustomerDialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen} onAdd={handleAddCustomer} />
    </div>
  )
}
