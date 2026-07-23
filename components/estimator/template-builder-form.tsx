"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { LiveTestPanel } from "@/components/estimator/live-test-panel"
import { RuleBlockEditor } from "@/components/estimator/rule-block-editor"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatGHS } from "@/lib/mock-data"
import {
  getTemplatesStore,
  setTemplatesStore,
  type FieldType,
  type RuleBlock,
  type Template,
  type TemplateField,
  type TemplateLineItem,
} from "@/lib/estimator-data"
import { TODAY_ISO } from "@/lib/period-utils"
import { demoStateToParams, useDemoState } from "@/hooks/use-demo-state"
import { cn } from "@/lib/utils"

const FIELD_TYPES: FieldType[] = ["number", "text", "select"]
const FIELD_UNITS = ["inch", "mm", "ft", "m", "none"]
const DOMAINS = ["Décor", "Aluminium", "Printing", "Upholstery", "Flooring", "Other"]

const STEPS = ["Basics", "Inputs", "Calculation", "Pricing", "Review & save"]

function emptyLineItem(): TemplateLineItem {
  return {
    name: "",
    variableKey: "",
    unit: "",
    defaultDiscountPercent: 0,
    computation: { blocks: [], outputUnit: "" },
  }
}

function slugify(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "field"
}

export function TemplateBuilderForm({ templateId }: { templateId?: string }) {
  const router = useRouter()
  const { state } = useDemoState()
  const [initialTemplate] = useState<Template | undefined>(() =>
    templateId ? getTemplatesStore().find((t) => t.id === templateId) : undefined
  )
  const isEdit = Boolean(templateId)
  const templatesListHref = (() => {
    const qs = demoStateToParams(state).toString()
    return qs ? `/estimator/templates?${qs}` : "/estimator/templates"
  })()

  const [step, setStep] = useState(0)
  const [maxStepReached, setMaxStepReached] = useState(0)

  const [name, setName] = useState(initialTemplate?.name ?? "")
  const [domain, setDomain] = useState(initialTemplate?.domain ?? DOMAINS[0])
  const [validityDays, setValidityDays] = useState(String(initialTemplate?.validityDays ?? 30))

  const [fields, setFields] = useState<TemplateField[]>(initialTemplate?.fields ?? [])
  const [lineItems, setLineItems] = useState<TemplateLineItem[]>(initialTemplate?.lineItems ?? [emptyLineItem()])

  const [markupPercent, setMarkupPercent] = useState(String(initialTemplate?.markupPercent ?? 20))
  const [discountPercent, setDiscountPercent] = useState(String(initialTemplate?.discountPercent ?? 0))
  const [minimumCharge, setMinimumCharge] = useState(String(initialTemplate?.minimumCharge ?? 0))

  const previewTemplate: Template = {
    id: initialTemplate?.id ?? "preview",
    name: name || "Untitled template",
    domain,
    status: initialTemplate?.status ?? "Active",
    validityDays: Number.parseInt(validityDays, 10) || 30,
    markupPercent: Number.parseFloat(markupPercent) || 0,
    discountPercent: Number.parseFloat(discountPercent) || 0,
    minimumCharge: Number.parseFloat(minimumCharge) || 0,
    currency: "GHS",
    createdDate: initialTemplate?.createdDate ?? TODAY_ISO,
    fields,
    lineItems,
  }

  function goToStep(index: number) {
    if (index <= maxStepReached) setStep(index)
  }

  function handleNext() {
    const next = Math.min(step + 1, STEPS.length - 1)
    setStep(next)
    setMaxStepReached((m) => Math.max(m, next))
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1))
  }

  function addField() {
    setFields((prev) => [...prev, { key: `field_${prev.length + 1}`, label: "", type: "number", unit: "", required: true }])
  }

  function updateField(index: number, patch: Partial<TemplateField>) {
    setFields((prev) =>
      prev.map((field, i) => {
        if (i !== index) return field
        const next = { ...field, ...patch }
        if (patch.label !== undefined) next.key = slugify(patch.label)
        return next
      })
    )
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, emptyLineItem()])
  }

  function updateLineItem(index: number, patch: Partial<TemplateLineItem>) {
    setLineItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index))
  }

  function updateBlocks(lineIndex: number, blocks: RuleBlock[]) {
    const outputUnit = blocks.length > 0 ? lineItems[lineIndex].computation.outputUnit : ""
    updateLineItem(lineIndex, { computation: { blocks, outputUnit } })
  }

  function availableVariablesFor(lineIndex: number) {
    const fieldVars = fields.map((f) => ({ key: f.key, label: f.label || f.key }))
    const priorLineVars = lineItems.slice(0, lineIndex).map((li) => ({ key: li.variableKey, label: li.name || li.variableKey }))
    return [...fieldVars, ...priorLineVars]
  }

  function handleSave(status: "Active" | "Inactive") {
    if (!name.trim()) {
      toast.error("Give the template a name.")
      setStep(0)
      return
    }

    const template: Template = {
      ...previewTemplate,
      status,
      lineItems: lineItems.map((item) => ({
        ...item,
        variableKey: item.variableKey || slugify(item.name),
        computation: { ...item.computation, outputUnit: item.unit },
      })),
    }

    const current = getTemplatesStore()
    if (isEdit) {
      setTemplatesStore(current.map((t) => (t.id === template.id ? template : t)))
    } else {
      template.id = `tpl-${slugify(name)}`
      setTemplatesStore([template, ...current])
    }

    toast.success(status === "Active" ? (isEdit ? "Template updated" : "Template created") : "Saved as draft", {
      description: template.name,
    })
    router.push(templatesListHref)
  }

  if (isEdit && !initialTemplate) {
    return (
      <Card className="items-center gap-3 py-16 text-center">
        <CardContent className="px-5">
          <p className="text-sm text-muted-foreground">Template not found.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{isEdit ? "Edit template" : "New template"}</h1>
        <p className="text-sm text-muted-foreground">Input fields and rule blocks that compute price from measurements.</p>
      </div>

      <div className="flex items-center gap-2">
        {STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => goToStep(index)}
            disabled={index > maxStepReached}
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              index === step
                ? "bg-primary/10 text-primary"
                : index <= maxStepReached
                  ? "text-muted-foreground hover:bg-accent"
                  : "cursor-not-allowed text-muted-foreground/40"
            )}
          >
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full border text-xs",
                index === step ? "border-primary text-primary" : index < maxStepReached ? "border-success bg-success/15 text-success" : "border-muted-foreground/30"
              )}
            >
              {index < maxStepReached ? <Check className="size-3" /> : index + 1}
            </span>
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          {step === 0 && (
            <Card>
              <CardContent className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="template-name">Name</Label>
                  <Input id="template-name" value={name} onChange={(event) => setName(event.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="template-domain">Domain tag</Label>
                  <Select value={domain} onValueChange={setDomain}>
                    <SelectTrigger className="w-full" id="template-domain">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOMAINS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="template-validity">Validity (days)</Label>
                  <Input
                    id="template-validity"
                    type="number"
                    value={validityDays}
                    onChange={(event) => setValidityDays(event.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <Card>
              <CardContent className="flex flex-col gap-3 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Measured fields</p>
                  <Button variant="outline" size="sm" onClick={addField}>
                    <Plus />
                    Add field
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <div key={index} className="grid grid-cols-[1fr_110px_100px_80px_28px] items-end gap-2 border-b pb-3 last:border-0">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={field.label}
                        onChange={(event) => updateField(index, { label: event.target.value })}
                        placeholder="e.g. Enter Height"
                        className="h-8"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Type</Label>
                      <Select value={field.type} onValueChange={(v) => updateField(index, { type: v as FieldType })}>
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Unit</Label>
                      <Select value={field.unit || "none"} onValueChange={(v) => updateField(index, { unit: v === "none" ? "" : v })}>
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_UNITS.map((u) => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Required</Label>
                      <Button
                        type="button"
                        variant={field.required ? "default" : "outline"}
                        size="sm"
                        className="h-8"
                        onClick={() => updateField(index, { required: !field.required })}
                      >
                        {field.required ? "Yes" : "No"}
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => removeField(index)} aria-label="Remove field">
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
                {fields.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No fields yet — add one above.</p>}
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Line items</p>
                <Button variant="outline" size="sm" onClick={addLineItem}>
                  <Plus />
                  Add line item
                </Button>
              </div>
              {lineItems.map((lineItem, index) => (
                <Card key={index}>
                  <CardContent className="flex flex-col gap-4 py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Line item {index + 1}</p>
                      <Button variant="ghost" size="icon-sm" onClick={() => removeLineItem(index)} aria-label="Remove line item">
                        <X className="size-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={lineItem.name}
                          onChange={(event) =>
                            updateLineItem(index, { name: event.target.value, variableKey: slugify(event.target.value) })
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Unit</Label>
                        <Input value={lineItem.unit} onChange={(event) => updateLineItem(index, { unit: event.target.value })} placeholder="e.g. Yards or GHS" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Default discount %</Label>
                        <Input
                          type="number"
                          value={lineItem.defaultDiscountPercent}
                          onChange={(event) => updateLineItem(index, { defaultDiscountPercent: Number.parseFloat(event.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Calculation</Label>
                      <RuleBlockEditor
                        blocks={lineItem.computation.blocks}
                        onChange={(blocks) => updateBlocks(index, blocks)}
                        availableVariables={availableVariablesFor(index)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {step === 3 && (
            <Card>
              <CardContent className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="template-markup">Markup %</Label>
                  <Input id="template-markup" type="number" value={markupPercent} onChange={(event) => setMarkupPercent(event.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="template-discount">Default discount %</Label>
                  <Input id="template-discount" type="number" value={discountPercent} onChange={(event) => setDiscountPercent(event.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="template-minimum">Minimum charge (GHS)</Label>
                  <Input id="template-minimum" type="number" value={minimumCharge} onChange={(event) => setMinimumCharge(event.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Currency</Label>
                  <Input value="GHS" disabled />
                </div>
                {lineItems
                  .filter((li) => li.unit === "GHS")
                  .map((li, index) => (
                    <div key={index} className="flex flex-col gap-1.5 sm:col-span-2">
                      <Label className="text-xs">Rate per unit — {li.name || "line item"}</Label>
                      <Input
                        type="number"
                        value={li.ratePerUnit ?? ""}
                        onChange={(event) => {
                          const value = Number.parseFloat(event.target.value) || 0
                          setLineItems((prev) => prev.map((item) => (item === li ? { ...item, ratePerUnit: value } : item)))
                        }}
                        placeholder="Informational — the actual rate lives in the Calculate block"
                      />
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardContent className="flex flex-col gap-3 py-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{name || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Domain</span>
                  <span className="font-medium">{domain}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Validity</span>
                  <span className="font-medium">{validityDays} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fields</span>
                  <span className="font-medium">{fields.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Line items</span>
                  <span className="font-medium">{lineItems.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pricing</span>
                  <span className="font-medium">
                    {markupPercent}% markup · {discountPercent}% discount · min {formatGHS(Number.parseFloat(minimumCharge) || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push(templatesListHref)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={() => handleSave("Inactive")}>
                Save as draft
              </Button>
            </div>
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button onClick={handleNext}>Next</Button>
              ) : (
                <Button onClick={() => handleSave("Active")}>{isEdit ? "Save changes" : "Save template"}</Button>
              )}
            </div>
          </div>
        </div>

        <LiveTestPanel template={previewTemplate} />
      </div>
    </div>
  )
}
