"use client"

import { History, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CustomerIdentificationControl } from "@/components/register/customer-identification-control"
import { ShortcutsHelp } from "@/components/register/shortcuts-help"
import { formatGHS } from "@/lib/mock-data"
import type { LoyaltyMember } from "@/lib/loyalty-data"
import type { DiscountLine } from "@/lib/pricing-engine-data"

export function TotalsRail({
  member,
  onAttachMember,
  onDetachMember,
  subtotal,
  discountLines,
  onRemoveDiscountLine,
  total,
  priceFloorNote,
  promoCodeInput,
  onPromoCodeInputChange,
  onApplyPromoCode,
  promoError,
  isUltra,
  affiliateCodeInput,
  onAffiliateCodeInputChange,
  onApplyAffiliateCode,
  affiliateError,
  appliedAffiliateCode,
  cartEmpty,
  chargeDisabled,
  onChargeClick,
  onHold,
  onClearCart,
  heldSalesCount,
  onOpenHeldSales,
  shortcutsOpen,
  onShortcutsOpenChange,
}: {
  member: LoyaltyMember | null
  onAttachMember: (member: LoyaltyMember) => void
  onDetachMember: () => void
  subtotal: number
  discountLines: DiscountLine[]
  onRemoveDiscountLine: (source: DiscountLine["source"]) => void
  total: number
  priceFloorNote?: string
  promoCodeInput: string
  onPromoCodeInputChange: (value: string) => void
  onApplyPromoCode: () => void
  promoError: string | null
  isUltra: boolean
  affiliateCodeInput: string
  onAffiliateCodeInputChange: (value: string) => void
  onApplyAffiliateCode: () => void
  affiliateError: string | null
  appliedAffiliateCode?: string
  cartEmpty: boolean
  chargeDisabled: boolean
  onChargeClick: () => void
  onHold: () => void
  onClearCart: () => void
  heldSalesCount: number
  onOpenHeldSales: () => void
  shortcutsOpen: boolean
  onShortcutsOpenChange: (open: boolean) => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <span className="text-sm font-medium">Sale</span>
        <ShortcutsHelp open={shortcutsOpen} onOpenChange={onShortcutsOpenChange} />
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
        <div>
          <Label className="mb-1.5 text-xs text-muted-foreground">Customer</Label>
          <CustomerIdentificationControl member={member} onAttach={onAttachMember} onDetach={onDetachMember} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="promo-code-input" className="text-xs text-muted-foreground">
              Promo code
            </Label>
            <div className="flex gap-1.5">
              <Input
                id="promo-code-input"
                value={promoCodeInput}
                onChange={(e) => onPromoCodeInputChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onApplyPromoCode()}
                placeholder="e.g. SAVE15"
                className="uppercase"
              />
              <Button variant="outline" onClick={onApplyPromoCode} disabled={!promoCodeInput.trim()}>
                Apply
              </Button>
            </div>
            {promoError && <p className="text-xs text-destructive">{promoError}</p>}
          </div>

          {isUltra && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="affiliate-code-input" className="text-xs text-muted-foreground">
                Affiliate code (optional)
              </Label>
              {appliedAffiliateCode ? (
                <div className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
                  <span>{appliedAffiliateCode}</span>
                  <span className="text-xs text-muted-foreground">Referral noted</span>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <Input
                    id="affiliate-code-input"
                    value={affiliateCodeInput}
                    onChange={(e) => onAffiliateCodeInputChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onApplyAffiliateCode()}
                    placeholder="Quoted by customer"
                    className="uppercase"
                  />
                  <Button variant="outline" onClick={onApplyAffiliateCode} disabled={!affiliateCodeInput.trim()}>
                    Apply
                  </Button>
                </div>
              )}
              {affiliateError && <p className="text-xs text-destructive">{affiliateError}</p>}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatGHS(subtotal)}</span>
          </div>

          {discountLines.map((line) => (
            <div key={line.source} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{line.label}</span>
              <div className="flex items-center gap-1.5">
                <span className="tabular-nums text-primary">− {formatGHS(line.amount)}</span>
                <button
                  type="button"
                  onClick={() => onRemoveDiscountLine(line.source)}
                  aria-label={`Remove ${line.label}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </div>
            </div>
          ))}

          <div className="mt-2 flex items-center justify-between border-t pt-2">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-3xl font-semibold tabular-nums">{formatGHS(total)}</span>
          </div>
          {priceFloorNote && <p className="text-xs text-amber-700 dark:text-amber-400">{priceFloorNote}</p>}
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <Button size="lg" className="h-12 text-base" disabled={cartEmpty || chargeDisabled} onClick={onChargeClick}>
            Charge {formatGHS(total)}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" disabled={cartEmpty} onClick={onHold}>
              Hold sale
            </Button>
            <Button variant="outline" onClick={onClearCart}>
              Clear cart
            </Button>
          </div>
          {heldSalesCount > 0 && (
            <button
              type="button"
              onClick={onOpenHeldSales}
              className="flex items-center justify-center gap-1.5 py-1 text-sm text-primary hover:underline"
            >
              <History className="size-3.5" />
              Resume held sale ({heldSalesCount})
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
