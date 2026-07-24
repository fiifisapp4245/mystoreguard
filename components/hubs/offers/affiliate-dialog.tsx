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
import { isValidGhanaPhone } from "@/lib/mock-data"
import {
  addAffiliate,
  updateAffiliate,
  type AffiliatePartner,
  type CommissionModel,
} from "@/lib/affiliates-data"

interface AffiliateFormValues {
  name: string
  phone: string
  email: string
  code: string
  commissionModel: CommissionModel
  rate: string
  payoutScheduleNote: string
}

function toFormValues(affiliate?: AffiliatePartner): AffiliateFormValues {
  return {
    name: affiliate?.name ?? "",
    phone: affiliate?.phone ?? "",
    email: affiliate?.email ?? "",
    code: affiliate?.code ?? "",
    commissionModel: affiliate?.commissionModel ?? "percentage",
    rate: affiliate ? String(affiliate.rate) : "",
    payoutScheduleNote: affiliate?.payoutScheduleNote ?? "",
  }
}

function generateAffiliateCode(name: string): string {
  const base = name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) || "PARTNER"
  const suffix = Math.floor(10 + Math.random() * 90)
  return `${base}${suffix}`
}

export function AffiliateDialog({
  open,
  onOpenChange,
  affiliate,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  affiliate?: AffiliatePartner
  onSaved: () => void
}) {
  const isEdit = Boolean(affiliate)
  const [values, setValues] = useState<AffiliateFormValues>(() => toFormValues(affiliate))
  const [prevAffiliateId, setPrevAffiliateId] = useState<string | null>(null)

  const currentId = affiliate?.id ?? null
  if (open && currentId !== prevAffiliateId) {
    setPrevAffiliateId(currentId)
    setValues(toFormValues(affiliate))
  }

  function update(patch: Partial<AffiliateFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  function handleOpenChange(next: boolean) {
    if (!next) setValues(toFormValues(undefined))
    onOpenChange(next)
  }

  const phoneValid = isValidGhanaPhone(values.phone)
  const missingFields = [
    !values.name.trim() && "a partner name",
    !phoneValid && "a valid contact phone",
    !values.code.trim() && "a unique code",
    !(Number(values.rate) > 0) && "a rate greater than 0",
  ].filter(Boolean) as string[]
  const canSubmit = missingFields.length === 0

  function handleSave() {
    if (!canSubmit) return
    const input = {
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email.trim() || undefined,
      code: values.code.trim().toUpperCase(),
      commissionModel: values.commissionModel,
      rate: Number.parseFloat(values.rate) || 0,
      payoutScheduleNote: values.payoutScheduleNote.trim(),
    }

    if (isEdit && affiliate) {
      updateAffiliate(affiliate.id, input)
      toast.success("Affiliate updated", { description: affiliate.name })
    } else {
      const created = addAffiliate(input)
      toast.success("Affiliate added", { description: `${created.name} — code ${created.code}` })
    }
    onSaved()
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit affiliate" : "Add affiliate"}</DialogTitle>
          <DialogDescription>Partners quote their code to the customer — the cashier enters it at the till.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-1 pb-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="aff-name">
              Partner name <span className="text-destructive">*</span>
            </Label>
            <Input id="aff-name" value={values.name} onChange={(e) => update({ name: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="aff-phone">
                Contact phone <span className="text-destructive">*</span>
              </Label>
              <Input id="aff-phone" value={values.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="0244001122" />
              {values.phone.trim() !== "" && !phoneValid && <p className="text-xs text-destructive">Enter a valid Ghanaian number, e.g. 0244001122.</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="aff-email">Contact email</Label>
              <Input id="aff-email" type="email" value={values.email} onChange={(e) => update({ email: e.target.value })} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="aff-code">
              Unique code <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-1.5">
              <Input id="aff-code" value={values.code} onChange={(e) => update({ code: e.target.value.toUpperCase() })} className="uppercase" />
              <Button type="button" variant="outline" size="icon" onClick={() => update({ code: generateAffiliateCode(values.name) })} aria-label="Generate code">
                <Sparkles className="size-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="aff-model">Commission model</Label>
              <Select value={values.commissionModel} onValueChange={(v) => update({ commissionModel: v as CommissionModel })}>
                <SelectTrigger className="w-full" id="aff-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage of sale</SelectItem>
                  <SelectItem value="fixed">Fixed per referral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="aff-rate">
                Rate ({values.commissionModel === "percentage" ? "%" : "GHS"}) <span className="text-destructive">*</span>
              </Label>
              <Input id="aff-rate" type="number" min="0" value={values.rate} onChange={(e) => update({ rate: e.target.value })} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="aff-schedule">Payout schedule note</Label>
            <Input
              id="aff-schedule"
              value={values.payoutScheduleNote}
              onChange={(e) => update({ payoutScheduleNote: e.target.value })}
              placeholder="e.g. Paid monthly, first week"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex flex-col items-end gap-1">
            {!canSubmit && missingFields.length > 0 && (
              <p className="text-xs text-muted-foreground">Still needs: {missingFields.join(", ")}</p>
            )}
            <Button onClick={handleSave} disabled={!canSubmit}>
              {isEdit ? "Save changes" : "Add affiliate"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
