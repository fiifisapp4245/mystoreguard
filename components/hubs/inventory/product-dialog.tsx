"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"

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
import { formatGHS } from "@/lib/mock-data"
import type { Supplier } from "@/lib/mock-data"
import { totalOnHand, type Product } from "@/lib/pos-data"
import { cn } from "@/lib/utils"
import { useDemoState } from "@/hooks/use-demo-state"
import { canSeeCostPrices } from "@/lib/permissions-data"

function randomBarcode(): string {
  let digits = "6"
  for (let i = 0; i < 12; i++) digits += Math.floor(Math.random() * 10)
  return digits
}

const STEPS = [
  { label: "Basics" },
  { label: "Pack structure" },
  { label: "Pricing" },
  { label: "Stock control" },
] as const

export interface ProductFormValues {
  name: string
  description: string
  barcode: string
  category: string
  soldByMeasure: boolean
  baseUnit: string
  purchaseUnit: string
  unitsPerPurchaseUnit: string
  sellingPrice: string
  taxTreatment: "standard" | "exempt"
  reorderPoint: string
  preferredSupplierId: string
  isService: boolean
}

function toFormValues(product?: Product): ProductFormValues {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    barcode: product?.barcode ?? "",
    category: product?.category ?? "",
    soldByMeasure: product?.pack.soldByMeasure ?? false,
    baseUnit: product?.pack.baseUnit ?? "",
    purchaseUnit: product?.pack.purchaseUnit ?? "",
    unitsPerPurchaseUnit: String(product?.pack.unitsPerPurchaseUnit ?? ""),
    sellingPrice: String(product?.sellingPrice ?? 0),
    taxTreatment: product?.taxTreatment ?? "standard",
    reorderPoint: String(product?.reorderPoint ?? 0),
    preferredSupplierId: product?.preferredSupplierId ?? "",
    isService: product?.isService ?? false,
  }
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  suppliers,
  categories,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product
  suppliers: Supplier[]
  categories: string[]
  onSave: (values: ProductFormValues) => void
}) {
  const { state } = useDemoState()
  const showCostPrice = canSeeCostPrices(state.role)

  const [values, setValues] = useState<ProductFormValues>(() => toFormValues(product))
  const [step, setStep] = useState(0)
  const [prevProductId, setPrevProductId] = useState<string | null>(null)
  const isEdit = Boolean(product)

  // Reset form each time a different product is opened (or "new") — adjusting state during
  // render rather than in an effect, since Dialog's onOpenChange only fires on user-driven
  // open/close, not when the parent sets `product` externally.
  const currentId = product?.id ?? null
  if (open && currentId !== prevProductId) {
    setPrevProductId(currentId)
    setValues(toFormValues(product))
    setStep(0)
  }

  function update(patch: Partial<ProductFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  function isStepValid(i: number): boolean {
    if (i === 0) return values.name.trim() !== ""
    if (i === 1) {
      if (!values.baseUnit.trim()) return false
      if (values.soldByMeasure) return true
      return values.purchaseUnit.trim() !== "" && Number(values.unitsPerPurchaseUnit) > 0
    }
    if (i === 2) return Number(values.sellingPrice) > 0
    return true
  }

  function canJumpTo(i: number): boolean {
    for (let k = 0; k < i; k++) {
      if (!isStepValid(k)) return false
    }
    return true
  }

  const canSubmit = STEPS.every((_, i) => isStepValid(i))

  function handleSave() {
    if (!canSubmit) return
    onSave(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>
            Pack structure drives splitting, purchase orders, and stocktaking everywhere else — set it once here.
          </DialogDescription>
          <p className="text-xs text-muted-foreground">
            Fields marked <span className="text-destructive">*</span> are required.
          </p>
        </DialogHeader>

        <div className="flex items-center gap-1 border-b pb-3">
          {STEPS.map((s, i) => {
            const reachable = canJumpTo(i)
            return (
              <button
                key={s.label}
                type="button"
                disabled={!reachable}
                onClick={() => reachable && setStep(i)}
                title={reachable ? undefined : "Complete the earlier steps first"}
                className={cn(
                  "flex flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  i === step
                    ? "bg-primary/10 text-primary"
                    : reachable
                      ? "text-muted-foreground hover:bg-accent"
                      : "cursor-not-allowed text-muted-foreground/40"
                )}
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full text-[10px]",
                    i === step ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  {i + 1}
                </span>
                <span className="hidden truncate sm:inline">{s.label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto px-1 pb-1">
          {step === 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground uppercase">Basics</p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prod-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input id="prod-name" value={values.name} onChange={(e) => update({ name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="prod-category">Category</Label>
                <Input id="prod-category" list="prod-categories" value={values.category} onChange={(e) => update({ category: e.target.value })} />
                <datalist id="prod-categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="prod-barcode">Barcode</Label>
                <div className="flex gap-1.5">
                  <Input id="prod-barcode" value={values.barcode} onChange={(e) => update({ barcode: e.target.value })} />
                  <Button type="button" variant="outline" size="icon" onClick={() => update({ barcode: randomBarcode() })} aria-label="Generate barcode">
                    <Sparkles className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prod-description">Description</Label>
              <Textarea id="prod-description" rows={2} value={values.description} onChange={(e) => update({ description: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Image</Label>
              <div className="flex h-20 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                Visual only in this prototype
              </div>
            </div>
          </div>
          )}

          {step === 1 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground uppercase">Pack structure</p>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Sold by measure</p>
                <p className="text-xs text-muted-foreground">Continuous measure (fabric per yard) — no carton/piece conversion.</p>
              </div>
              <Switch checked={values.soldByMeasure} onCheckedChange={(checked) => update({ soldByMeasure: checked })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="prod-base-unit">
                  Base sellable unit <span className="text-destructive">*</span>
                </Label>
                <Input id="prod-base-unit" placeholder="e.g. Tin, Yard" value={values.baseUnit} onChange={(e) => update({ baseUnit: e.target.value })} />
              </div>
              {!values.soldByMeasure && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="prod-purchase-unit">
                    Purchase unit <span className="text-destructive">*</span>
                  </Label>
                  <Input id="prod-purchase-unit" placeholder="e.g. Carton" value={values.purchaseUnit} onChange={(e) => update({ purchaseUnit: e.target.value })} />
                </div>
              )}
            </div>
            {!values.soldByMeasure && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="prod-units-per-pack">
                  Units per pack <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="prod-units-per-pack"
                  type="number"
                  value={values.unitsPerPurchaseUnit}
                  onChange={(e) => update({ unitsPerPurchaseUnit: e.target.value })}
                />
              </div>
            )}
          </div>
          )}

          {step === 2 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground uppercase">Pricing</p>
            {showCostPrice && (
              <div className="flex flex-col gap-1.5">
                <Label>Cost price</Label>
                <Input value={product ? formatGHS(product.costPrice) : formatGHS(0)} disabled />
                <p className="text-xs text-muted-foreground">Set automatically when stock is received.</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="prod-selling-price">
                  Selling price (per base unit) <span className="text-destructive">*</span>
                </Label>
                <Input id="prod-selling-price" type="number" value={values.sellingPrice} onChange={(e) => update({ sellingPrice: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="prod-tax">Tax treatment</Label>
                <Select value={values.taxTreatment} onValueChange={(v) => update({ taxTreatment: v as "standard" | "exempt" })}>
                  <SelectTrigger className="w-full" id="prod-tax">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="exempt">Exempt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          )}

          {step === 3 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground uppercase">Stock control</p>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">This is a service</p>
                <p className="text-xs text-muted-foreground">Services aren&apos;t stocked at all.</p>
              </div>
              <Switch checked={values.isService} onCheckedChange={(checked) => update({ isService: checked })} />
            </div>
            {!values.isService && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="prod-reorder">Reorder point</Label>
                  <Input id="prod-reorder" type="number" value={values.reorderPoint} onChange={(e) => update({ reorderPoint: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="prod-supplier">Preferred supplier</Label>
                  <Select value={values.preferredSupplierId} onValueChange={(v) => update({ preferredSupplierId: v })}>
                    <SelectTrigger className="w-full" id="prod-supplier">
                      <SelectValue placeholder="Select..." />
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
              </div>
            )}
            {product && (
              <p className="text-xs text-muted-foreground">Currently {totalOnHand(product)} {values.baseUnit || "units"} on hand across all locations.</p>
            )}
          </div>
          )}
        </div>

        <DialogFooter>
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!isStepValid(step)}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={!canSubmit}>
              {isEdit ? "Save changes" : "Add product"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
