"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/dashboard/page-header"
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
import { Textarea } from "@/components/ui/textarea"
import {
  getTemplatesStore,
  setTemplatesStore,
  type FieldType,
  type Template,
  type TemplateField,
  type TemplateLineItem,
} from "@/lib/estimator-data"
import { TODAY_ISO } from "@/lib/period-utils"
import { demoStateToParams, useDemoState } from "@/hooks/use-demo-state"

const FIELD_TYPES: FieldType[] = ["number", "text", "select"]

function emptyLineItem(): TemplateLineItem {
  return {
    name: "",
    variableKey: "",
    unit: "",
    defaultDiscountPercent: 0,
    fields: [],
    computation: { formula: "", outputUnit: "" },
  }
}

export function TemplateBuilderForm({ initialTemplate }: { initialTemplate?: Template }) {
  const router = useRouter()
  const { state } = useDemoState()
  const isEdit = Boolean(initialTemplate)
  const templatesListHref = (() => {
    const qs = demoStateToParams(state).toString()
    return qs ? `/estimator/templates?${qs}` : "/estimator/templates"
  })()

  const [name, setName] = useState(initialTemplate?.name ?? "")
  const [domain, setDomain] = useState(initialTemplate?.domain ?? "")
  const [validityDays, setValidityDays] = useState(String(initialTemplate?.validityDays ?? 30))
  const [markupPercent, setMarkupPercent] = useState(String(initialTemplate?.markupPercent ?? 20))
  const [discountPercent, setDiscountPercent] = useState(String(initialTemplate?.discountPercent ?? 0))
  const [minimumCharge, setMinimumCharge] = useState(String(initialTemplate?.minimumCharge ?? 0))
  const [lineItems, setLineItems] = useState<TemplateLineItem[]>(
    initialTemplate?.lineItems ?? [emptyLineItem()]
  )

  function updateLineItem(index: number, patch: Partial<TemplateLineItem>) {
    setLineItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, emptyLineItem()])
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index))
  }

  function addField(lineIndex: number) {
    const field: TemplateField = { key: "", label: "", type: "number", unit: "" }
    updateLineItem(lineIndex, { fields: [...lineItems[lineIndex].fields, field] })
  }

  function updateField(lineIndex: number, fieldIndex: number, patch: Partial<TemplateField>) {
    const nextFields = lineItems[lineIndex].fields.map((field, i) => (i === fieldIndex ? { ...field, ...patch } : field))
    updateLineItem(lineIndex, { fields: nextFields })
  }

  function removeField(lineIndex: number, fieldIndex: number) {
    updateLineItem(lineIndex, { fields: lineItems[lineIndex].fields.filter((_, i) => i !== fieldIndex) })
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error("Give the template a name.")
      return
    }

    const template: Template = {
      id: initialTemplate?.id ?? `tpl-${name.trim().toLowerCase().replace(/\s+/g, "-")}`,
      name: name.trim(),
      domain: domain.trim() || "General",
      status: initialTemplate?.status ?? "Active",
      validityDays: Number.parseInt(validityDays, 10) || 30,
      markupPercent: Number.parseFloat(markupPercent) || 0,
      discountPercent: Number.parseFloat(discountPercent) || 0,
      minimumCharge: Number.parseFloat(minimumCharge) || 0,
      currency: "GHS",
      createdDate: initialTemplate?.createdDate ?? TODAY_ISO,
      lineItems,
    }

    const current = getTemplatesStore()
    if (isEdit) {
      setTemplatesStore(current.map((t) => (t.id === template.id ? template : t)))
    } else {
      setTemplatesStore([template, ...current])
    }

    toast.success(isEdit ? "Template updated" : "Template created", { description: template.name })
    router.push(templatesListHref)
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title={isEdit ? "Edit template" : "New template"} subtitle="Input fields and formulas that compute price from measurements." />

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template-name">Name</Label>
            <Input id="template-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template-domain">Domain tag</Label>
            <Input id="template-domain" value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="e.g. Décor" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template-validity">Validity (days)</Label>
            <Input id="template-validity" type="number" value={validityDays} onChange={(event) => setValidityDays(event.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template-markup">Markup %</Label>
            <Input id="template-markup" type="number" value={markupPercent} onChange={(event) => setMarkupPercent(event.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template-discount">Discount %</Label>
            <Input id="template-discount" type="number" value={discountPercent} onChange={(event) => setDiscountPercent(event.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template-minimum">Minimum charge (GHS)</Label>
            <Input id="template-minimum" type="number" value={minimumCharge} onChange={(event) => setMinimumCharge(event.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Line items</p>
          <Button variant="outline" size="sm" onClick={addLineItem}>
            <Plus />
            Add line item
          </Button>
        </div>

        {lineItems.map((lineItem, lineIndex) => (
          <Card key={lineIndex}>
            <CardContent className="flex flex-col gap-4 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Line item {lineIndex + 1}</p>
                <Button variant="ghost" size="icon-sm" onClick={() => removeLineItem(lineIndex)} aria-label="Remove line item">
                  <X className="size-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input value={lineItem.name} onChange={(event) => updateLineItem(lineIndex, { name: event.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Variable key</Label>
                  <Input
                    value={lineItem.variableKey}
                    onChange={(event) => updateLineItem(lineIndex, { variableKey: event.target.value })}
                    className="font-mono"
                    placeholder="e.g. curtains_yards"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Unit</Label>
                  <Input value={lineItem.unit} onChange={(event) => updateLineItem(lineIndex, { unit: event.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Default discount %</Label>
                  <Input
                    type="number"
                    value={lineItem.defaultDiscountPercent}
                    onChange={(event) =>
                      updateLineItem(lineIndex, { defaultDiscountPercent: Number.parseFloat(event.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs">Fields</Label>
                {lineItem.fields.map((field, fieldIndex) => (
                  <div key={fieldIndex} className="grid grid-cols-[1fr_1fr_90px_90px_28px] items-center gap-2">
                    <Input
                      placeholder="Label (e.g. Enter Height)"
                      value={field.label}
                      onChange={(event) => updateField(lineIndex, fieldIndex, { label: event.target.value })}
                    />
                    <Input
                      placeholder="Variable key (e.g. height)"
                      value={field.key}
                      onChange={(event) => updateField(lineIndex, fieldIndex, { key: event.target.value })}
                      className="font-mono"
                    />
                    <Select
                      value={field.type}
                      onValueChange={(value) => updateField(lineIndex, fieldIndex, { type: value as FieldType })}
                    >
                      <SelectTrigger size="sm" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Unit"
                      value={field.unit ?? ""}
                      onChange={(event) => updateField(lineIndex, fieldIndex, { unit: event.target.value })}
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeField(lineIndex, fieldIndex)}
                      aria-label="Remove field"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-fit" onClick={() => addField(lineIndex)}>
                  <Plus />
                  Add field
                </Button>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Formula</Label>
                <Textarea
                  value={lineItem.computation.formula}
                  onChange={(event) =>
                    updateLineItem(lineIndex, {
                      computation: { ...lineItem.computation, formula: event.target.value },
                    })
                  }
                  className="font-mono text-sm"
                  rows={2}
                  placeholder="e.g. width * ifelse(height > 100, 3.6, 3) / 36"
                />
                <p className="text-xs text-muted-foreground">
                  Available variables:{" "}
                  {lineItem.fields.filter((f) => f.key).map((f) => f.key).join(", ") || "none yet — add fields above"}
                </p>
                <Input
                  className="mt-1"
                  placeholder="Output unit (e.g. Yards, GHS)"
                  value={lineItem.computation.outputUnit}
                  onChange={(event) =>
                    updateLineItem(lineIndex, {
                      computation: { ...lineItem.computation, outputUnit: event.target.value },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push(templatesListHref)}>
          Cancel
        </Button>
        <Button onClick={handleSave}>{isEdit ? "Save changes" : "Create template"}</Button>
      </div>
    </div>
  )
}
