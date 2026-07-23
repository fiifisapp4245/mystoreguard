"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AddCustomerDialog } from "@/components/hubs/people/add-customer-dialog"
import { CustomerPicker } from "@/components/register/customer-picker"
import { InvoiceItemsSection } from "@/components/invoice/invoice-items-section"
import { QuotationPreview } from "@/components/estimator/quotation-preview"
import { demoStateToParams, STORE_PERSONA_LABEL, useDemoState } from "@/hooks/use-demo-state"
import { formatGHS, type Customer } from "@/lib/mock-data"
import {
  applyTemplatePricing,
  computeTemplateLineItems,
  getQuotationsStore,
  getTemplatesStore,
  LARRY_CUSTOMERS,
  nextQuotationNumber,
  setQuotationsStore,
  type ComputedLineItem,
  type Quotation,
  type QuotationStatus,
} from "@/lib/estimator-data"
import { TODAY_ISO } from "@/lib/period-utils"

type CreationPath = "template" | "catalogue"

export function CreateQuotationScreen({ editId }: { editId?: string }) {
  const router = useRouter()
  const { state } = useDemoState()
  const storeLabel = STORE_PERSONA_LABEL.larry
  const quotationsListHref = (() => {
    const qs = demoStateToParams(state).toString()
    return qs ? `/estimator/quotations?${qs}` : "/estimator/quotations"
  })()
  const existingQuotation = useMemo(
    () => (editId ? getQuotationsStore().find((q) => q.id === editId) : undefined),
    [editId]
  )

  const templates = getTemplatesStore()

  const [creationPath, setCreationPath] = useState<CreationPath>(
    existingQuotation && !existingQuotation.templateId ? "catalogue" : "template"
  )
  const [templateId, setTemplateId] = useState(existingQuotation?.templateId ?? "")
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [catalogueLineItems, setCatalogueLineItems] = useState<ComputedLineItem[]>(
    existingQuotation && !existingQuotation.templateId ? existingQuotation.lineItems : []
  )

  const [customer, setCustomer] = useState<Customer | null>(
    () => LARRY_CUSTOMERS.find((c) => c.name === existingQuotation?.customer) ?? null
  )
  const [customerName, setCustomerName] = useState(existingQuotation?.customer ?? "")
  const [addCustomerOpen, setAddCustomerOpen] = useState(false)

  const [validUntil, setValidUntil] = useState(existingQuotation?.validUntil ?? "")
  const [note, setNote] = useState(existingQuotation?.note ?? "")
  const [terms, setTerms] = useState("Valid for the period stated above. Prices in GHS.")

  const displayName = customer?.name ?? customerName
  const selectedTemplate = templates.find((t) => t.id === templateId)

  function handleSelectTemplate(id: string) {
    setTemplateId(id)
    setFieldValues({})
    const template = templates.find((t) => t.id === id)
    if (template) {
      const due = new Date(`${TODAY_ISO}T00:00:00`)
      due.setDate(due.getDate() + template.validityDays)
      setValidUntil(due.toISOString().slice(0, 10))
    }
  }

  const allFields = useMemo(() => {
    const template = getTemplatesStore().find((t) => t.id === templateId)
    return template?.lineItems.flatMap((li) => li.fields) ?? []
  }, [templateId])

  const computedLineItems = useMemo(() => {
    const template = getTemplatesStore().find((t) => t.id === templateId)
    if (!template) return []
    const numericValues: Record<string, number> = {}
    for (const field of template.lineItems.flatMap((li) => li.fields)) {
      numericValues[field.key] = Number.parseFloat(fieldValues[field.key] || "0") || 0
    }
    return computeTemplateLineItems(template, numericValues)
  }, [templateId, fieldValues])

  const activeLineItems = creationPath === "template" ? computedLineItems : catalogueLineItems
  const isKnownTemplate = creationPath === "template" && selectedTemplate && computedLineItems.length > 0
  const baseCost = activeLineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  const pricing =
    creationPath === "template" && selectedTemplate
      ? applyTemplatePricing(baseCost, selectedTemplate)
      : { subtotal: baseCost, discount: 0, total: baseCost }

  function handleAddCustomer(newCustomer: Customer) {
    setCustomer(newCustomer)
    setCustomerName(newCustomer.name)
    setAddCustomerOpen(false)
    toast.success("Customer added", { description: `${newCustomer.name} has been added.` })
  }

  function handleSave() {
    if (!displayName.trim()) {
      toast.error("Add a customer before saving.")
      return
    }
    if (activeLineItems.length === 0) {
      toast.error("Add at least one item before saving.")
      return
    }

    const id = existingQuotation?.id ?? nextQuotationNumber()
    const status: QuotationStatus = existingQuotation?.status ?? "Draft"
    const newQuotation: Quotation = {
      id,
      customer: displayName,
      templateId: creationPath === "template" ? templateId : undefined,
      lineItems: activeLineItems,
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      total: pricing.total,
      validUntil,
      createdDate: existingQuotation?.createdDate ?? TODAY_ISO,
      status,
      note: note.trim() || undefined,
      convertedToInvoiceId: existingQuotation?.convertedToInvoiceId,
    }

    const current = getQuotationsStore()
    if (existingQuotation) {
      setQuotationsStore(current.map((q) => (q.id === id ? newQuotation : q)))
    } else {
      setQuotationsStore([newQuotation, ...current])
    }

    toast.success(existingQuotation ? "Quotation updated" : "Quotation created", {
      description: `${id} — ${formatGHS(pricing.total)}`,
    })
    router.push(quotationsListHref)
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
        <span className="ml-2 text-sm font-medium">{existingQuotation ? "Edit quotation" : "New quotation"}</span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[40%_60%]">
        <div className="flex min-h-0 flex-col overflow-y-auto border-r">
          <div className="flex flex-col gap-6 p-6">
            <div>
              <Label className="mb-2 text-xs text-muted-foreground">Create from</Label>
              <ToggleGroup
                type="single"
                value={creationPath}
                onValueChange={(value) => value && setCreationPath(value as CreationPath)}
                variant="outline"
                className="w-full"
              >
                <ToggleGroupItem value="template" className="flex-1">
                  From a template
                </ToggleGroupItem>
                <ToggleGroupItem value="catalogue" className="flex-1">
                  From catalogue
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {creationPath === "template" && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="template-select">Template</Label>
                  <Select value={templateId} onValueChange={handleSelectTemplate}>
                    <SelectTrigger id="template-select" className="w-full">
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} · {template.domain}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && !isKnownTemplate && (
                  <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    This is a custom template — its formula is stored for reference, but live computation isn&apos;t
                    wired up for custom templates in this prototype. Use one of the three built-in templates to see
                    the live calculation.
                  </p>
                )}

                {selectedTemplate && allFields.length > 0 && (
                  <div className="flex flex-col gap-3 rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Measurements</p>
                    {allFields.map((field) => (
                      <div key={field.key} className="flex flex-col gap-1.5">
                        <Label htmlFor={`field-${field.key}`}>
                          {field.label} {field.unit && <span className="text-muted-foreground">({field.unit})</span>}
                        </Label>
                        <Input
                          id={`field-${field.key}`}
                          type="number"
                          value={fieldValues[field.key] ?? ""}
                          onChange={(event) =>
                            setFieldValues((prev) => ({ ...prev, [field.key]: event.target.value }))
                          }
                        />
                      </div>
                    ))}
                    {isKnownTemplate && (
                      <div className="rounded-md bg-muted/60 p-2.5 text-sm">
                        <span className="text-muted-foreground">Computed: </span>
                        <span className="font-medium">{computedLineItems[0]?.computedDetail}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {creationPath === "catalogue" && (
              <div className="flex flex-col gap-1.5">
                <Label>Items</Label>
                <InvoiceItemsSection lineItems={catalogueLineItems} onChange={setCatalogueLineItems} />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label>Customer</Label>
              <CustomerPicker
                customer={customer}
                customers={LARRY_CUSTOMERS}
                placeholder="Select a customer"
                onSelect={(selectedCustomer) => {
                  setCustomer(selectedCustomer)
                  setCustomerName(selectedCustomer?.name ?? "")
                }}
                onAddNew={() => setAddCustomerOpen(true)}
              />
            </div>

            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatGHS(pricing.subtotal)}</span>
              </div>
              {pricing.discount > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Discount</span>
                  <span>− {formatGHS(pricing.discount)}</span>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span>{formatGHS(pricing.total)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valid-until">Valid until</Label>
              <Input id="valid-until" type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quote-note">Note</Label>
              <Textarea id="quote-note" value={note} onChange={(event) => setNote(event.target.value)} rows={2} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quote-terms">Terms</Label>
              <Textarea id="quote-terms" value={terms} onChange={(event) => setTerms(event.target.value)} rows={2} />
            </div>
          </div>

          <div className="mt-auto flex gap-2 border-t bg-background p-4">
            <Button variant="outline" className="flex-1" onClick={() => router.push(quotationsListHref)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              {existingQuotation ? "Save changes" : "Save quotation"}
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-y-auto bg-muted/30 p-8">
          <QuotationPreview
            quotationNo={existingQuotation?.id ?? "New quotation"}
            customerName={displayName}
            validUntil={validUntil}
            lineItems={activeLineItems}
            subtotal={pricing.subtotal}
            discount={pricing.discount}
            total={pricing.total}
            note={note}
            terms={terms}
            storeName={storeLabel.name}
            storeAddress={storeLabel.location}
          />
        </div>
      </div>

      <AddCustomerDialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen} onAdd={handleAddCustomer} />
    </div>
  )
}
