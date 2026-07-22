"use client"

import { useState } from "react"
import { History, Tag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CustomerPicker } from "@/components/register/customer-picker"
import { ShortcutsHelp } from "@/components/register/shortcuts-help"
import { formatGHS, type Customer } from "@/lib/mock-data"

export function TotalsRail({
  customer,
  onSelectCustomer,
  onAddCustomer,
  onCustomerPopoverOpenChange,
  subtotal,
  discount,
  onDiscountChange,
  total,
  cartEmpty,
  onCharge,
  onHold,
  onClearCart,
  heldSalesCount,
  onOpenHeldSales,
  shortcutsOpen,
  onShortcutsOpenChange,
}: {
  customer: Customer | null
  onSelectCustomer: (customer: Customer | null) => void
  onAddCustomer: () => void
  onCustomerPopoverOpenChange: (open: boolean) => void
  subtotal: number
  discount: number
  onDiscountChange: (discount: number) => void
  total: number
  cartEmpty: boolean
  onCharge: () => void
  onHold: () => void
  onClearCart: () => void
  heldSalesCount: number
  onOpenHeldSales: () => void
  shortcutsOpen: boolean
  onShortcutsOpenChange: (open: boolean) => void
}) {
  const [discountOpen, setDiscountOpen] = useState(false)
  const [discountInput, setDiscountInput] = useState(discount ? String(discount) : "")

  function applyDiscount() {
    const value = Number.parseFloat(discountInput)
    onDiscountChange(Number.isFinite(value) && value > 0 ? value : 0)
    setDiscountOpen(false)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <span className="text-sm font-medium">Sale</span>
        <ShortcutsHelp open={shortcutsOpen} onOpenChange={onShortcutsOpenChange} />
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
        <div>
          <Label className="mb-1.5 text-xs text-muted-foreground">Customer</Label>
          <CustomerPicker
            customer={customer}
            onSelect={onSelectCustomer}
            onAddNew={onAddCustomer}
            onOpenChange={onCustomerPopoverOpenChange}
          />
        </div>

        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatGHS(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            {discount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setDiscountInput(String(discount))
                  setDiscountOpen(true)
                }}
                className="tabular-nums text-primary hover:underline"
              >
                − {formatGHS(discount)}
              </button>
            ) : (
              <Popover open={discountOpen} onOpenChange={setDiscountOpen}>
                <PopoverTrigger asChild>
                  <button type="button" className="flex items-center gap-1 text-primary hover:underline">
                    <Tag className="size-3" />
                    Add discount
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56">
                  <Label htmlFor="discount-amount" className="text-xs text-muted-foreground">
                    Discount amount (GHS)
                  </Label>
                  <Input
                    id="discount-amount"
                    type="number"
                    min="0"
                    value={discountInput}
                    onChange={(event) => setDiscountInput(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && applyDiscount()}
                    className="mt-1.5"
                    autoFocus
                  />
                  <Button size="sm" className="mt-2 w-full" onClick={applyDiscount}>
                    Apply
                  </Button>
                </PopoverContent>
              </Popover>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between border-t pt-2">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-3xl font-semibold tabular-nums">{formatGHS(total)}</span>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <Button size="lg" className="h-12 text-base" disabled={cartEmpty} onClick={onCharge}>
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
