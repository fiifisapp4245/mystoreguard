"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { TODAY_ISO } from "@/lib/period-utils"
import {
  createPromoCode,
  findPromoCode,
  updatePromoCode,
  type PromoCode,
  type PromoDiscountType,
  type PromoEligibility,
  type PromoScope,
} from "@/lib/promo-codes-data"

interface PromoFormValues {
  code: string
  discountType: PromoDiscountType
  value: string
  scope: PromoScope
  scopeDetail: string
  minSpend: string
  validFromISO: string
  validToISO: string
  totalUsesLimit: string
  usesPerCustomerLimit: string
  eligibility: PromoEligibility
  eligibilityDetail: string
  canCombine: boolean
  priority: string
}

function toFormValues(promo?: PromoCode): PromoFormValues {
  return {
    code: promo?.id ?? "",
    discountType: promo?.discountType ?? "percentage",
    value: promo ? String(promo.value) : "",
    scope: promo?.scope ?? "all",
    scopeDetail: promo?.scopeDetail ?? "",
    minSpend: promo?.minSpend !== undefined ? String(promo.minSpend) : "",
    validFromISO: promo?.validFromISO ?? TODAY_ISO,
    validToISO: promo?.validToISO ?? "",
    totalUsesLimit: promo?.totalUsesLimit !== undefined ? String(promo.totalUsesLimit) : "",
    usesPerCustomerLimit: promo?.usesPerCustomerLimit !== undefined ? String(promo.usesPerCustomerLimit) : "",
    eligibility: promo?.eligibility ?? "everyone",
    eligibilityDetail: promo?.eligibilityDetail ?? "",
    canCombine: promo?.canCombine ?? false,
    priority: String(promo?.priority ?? 1),
  }
}

function generatePromoCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"
  const length = 6 + Math.floor(Math.random() * 3)
  let code = ""
  for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export function PromoCodeDialog({
  open,
  onOpenChange,
  promo,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  promo?: PromoCode
  onSaved: () => void
}) {
  const isEdit = Boolean(promo)
  const [values, setValues] = useState<PromoFormValues>(() => toFormValues(promo))
  const [prevPromoId, setPrevPromoId] = useState<string | null>(null)

  const currentId = promo?.id ?? null
  if (open && currentId !== prevPromoId) {
    setPrevPromoId(currentId)
    setValues(toFormValues(promo))
  }

  function update(patch: Partial<PromoFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  function handleOpenChange(next: boolean) {
    if (!next) setValues(toFormValues(undefined))
    onOpenChange(next)
  }

  const trimmedCode = values.code.trim().toUpperCase()
  const needsValue = values.discountType !== "free-delivery"
  const needsScopeDetail = values.scope === "category" || values.scope === "products"
  const needsMinSpend = values.scope === "min-spend"
  const needsEligibilityDetail = values.eligibility !== "everyone"

  const canSubmit =
    trimmedCode !== "" &&
    (!needsValue || Number(values.value) > 0) &&
    values.validFromISO !== "" &&
    values.validToISO !== "" &&
    values.validFromISO <= values.validToISO &&
    (!needsScopeDetail || values.scopeDetail.trim() !== "") &&
    (!needsMinSpend || Number(values.minSpend) > 0) &&
    (!needsEligibilityDetail || values.eligibilityDetail.trim() !== "")

  const missingFields = [
    trimmedCode === "" && "a code",
    needsValue && !(Number(values.value) > 0) && "a value greater than 0",
    values.validFromISO === "" && "a start date",
    values.validToISO === "" && "an end date",
    values.validFromISO !== "" &&
      values.validToISO !== "" &&
      values.validFromISO > values.validToISO &&
      "an end date on or after the start date",
    needsScopeDetail &&
      values.scopeDetail.trim() === "" &&
      (values.scope === "category" ? "a category" : "the specific products"),
    needsMinSpend && !(Number(values.minSpend) > 0) && "a minimum spend greater than 0",
    needsEligibilityDetail &&
      values.eligibilityDetail.trim() === "" &&
      (values.eligibility === "tier" ? "a tier" : "a segment"),
  ].filter(Boolean) as string[]

  function handleSave() {
    if (!canSubmit) return
    if (!isEdit && findPromoCode(trimmedCode)) {
      toast.error("A promo code with that name already exists")
      return
    }

    const commonFields = {
      discountType: values.discountType,
      value: needsValue ? Number.parseFloat(values.value) || 0 : 0,
      scope: values.scope,
      scopeDetail: needsScopeDetail ? values.scopeDetail.trim() : undefined,
      minSpend: needsMinSpend ? Number.parseFloat(values.minSpend) || 0 : undefined,
      validFromISO: values.validFromISO,
      validToISO: values.validToISO,
      totalUsesLimit: values.totalUsesLimit.trim() ? Number.parseInt(values.totalUsesLimit, 10) : undefined,
      usesPerCustomerLimit: values.usesPerCustomerLimit.trim() ? Number.parseInt(values.usesPerCustomerLimit, 10) : undefined,
      eligibility: values.eligibility,
      eligibilityDetail: needsEligibilityDetail ? values.eligibilityDetail.trim() : undefined,
      canCombine: values.canCombine,
      priority: Number.parseInt(values.priority, 10) || 1,
    }

    if (isEdit && promo) {
      updatePromoCode(promo.id, commonFields)
      toast.success("Promo code updated", { description: promo.id })
    } else {
      createPromoCode({ id: trimmedCode, ...commonFields })
      toast.success("Promo code created", { description: trimmedCode })
    }
    onSaved()
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit promo code" : "Create promo code"}</DialogTitle>
          <DialogDescription>Set the discount, who it applies to, and how long it runs.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-1 pb-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="promo-code">
              Code <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-1.5">
              <Input
                id="promo-code"
                value={values.code}
                disabled={isEdit}
                onChange={(e) => update({ code: e.target.value.toUpperCase() })}
                placeholder="e.g. SAVE15"
                className="uppercase"
              />
              {!isEdit && (
                <Button type="button" variant="outline" size="icon" onClick={() => update({ code: generatePromoCode() })} aria-label="Generate code">
                  <Sparkles className="size-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="promo-discount-type">Discount type</Label>
              <Select value={values.discountType} onValueChange={(v) => update({ discountType: v as PromoDiscountType })}>
                <SelectTrigger className="w-full" id="promo-discount-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed amount</SelectItem>
                  <SelectItem value="free-delivery">Free delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {needsValue && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="promo-value">
                  {values.discountType === "percentage" ? "Value (%)" : "Value (GHS)"} <span className="text-destructive">*</span>
                </Label>
                <Input id="promo-value" type="number" min="0" value={values.value} onChange={(e) => update({ value: e.target.value })} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="promo-scope">Applies to</Label>
              <Select value={values.scope} onValueChange={(v) => update({ scope: v as PromoScope })}>
                <SelectTrigger className="w-full" id="promo-scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="products">Specific products</SelectItem>
                  <SelectItem value="min-spend">Minimum spend</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {needsScopeDetail && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="promo-scope-detail">
                  {values.scope === "category" ? "Category" : "Products"} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="promo-scope-detail"
                  value={values.scopeDetail}
                  onChange={(e) => update({ scopeDetail: e.target.value })}
                  placeholder={values.scope === "category" ? "e.g. Beverages" : "e.g. 3 SKUs"}
                />
              </div>
            )}
            {needsMinSpend && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="promo-min-spend">
                  Minimum spend (GHS) <span className="text-destructive">*</span>
                </Label>
                <Input id="promo-min-spend" type="number" min="0" value={values.minSpend} onChange={(e) => update({ minSpend: e.target.value })} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="promo-valid-from">
                Valid from <span className="text-destructive">*</span>
              </Label>
              <Input id="promo-valid-from" type="date" value={values.validFromISO} onChange={(e) => update({ validFromISO: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="promo-valid-to">
                Valid to <span className="text-destructive">*</span>
              </Label>
              <Input id="promo-valid-to" type="date" value={values.validToISO} onChange={(e) => update({ validToISO: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="promo-total-limit">Total uses limit</Label>
              <Input
                id="promo-total-limit"
                type="number"
                min="0"
                placeholder="Unlimited"
                value={values.totalUsesLimit}
                onChange={(e) => update({ totalUsesLimit: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="promo-per-customer-limit">Uses per customer</Label>
              <Input
                id="promo-per-customer-limit"
                type="number"
                min="0"
                placeholder="Unlimited"
                value={values.usesPerCustomerLimit}
                onChange={(e) => update({ usesPerCustomerLimit: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="promo-eligibility">Customer eligibility</Label>
              <Select value={values.eligibility} onValueChange={(v) => update({ eligibility: v as PromoEligibility })}>
                <SelectTrigger className="w-full" id="promo-eligibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="segment">A loyalty segment</SelectItem>
                  <SelectItem value="tier">A specific tier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {needsEligibilityDetail && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="promo-eligibility-detail">
                  {values.eligibility === "tier" ? "Tier" : "Segment"} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="promo-eligibility-detail"
                  value={values.eligibilityDetail}
                  onChange={(e) => update({ eligibilityDetail: e.target.value })}
                  placeholder={values.eligibility === "tier" ? "Bronze, Silver, Gold..." : "e.g. Lapsed customers"}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Can combine with other discounts</p>
                <p className="text-xs text-muted-foreground">Off means this code can&apos;t be stacked with another active code.</p>
              </div>
              <Switch checked={values.canCombine} onCheckedChange={(checked) => update({ canCombine: checked })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="promo-priority">Priority</Label>
              <Input id="promo-priority" type="number" min="1" value={values.priority} onChange={(e) => update({ priority: e.target.value })} className="w-24" />
              <p className="text-xs text-muted-foreground">Lower number wins when more than one code could apply.</p>
            </div>
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
            <Button onClick={handleSave} disabled={!canSubmit}>
              {isEdit ? "Save changes" : "Create promo code"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
