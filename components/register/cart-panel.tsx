"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronRight, Minus, Plus, ScanLine, Shuffle, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { formatGHS } from "@/lib/mock-data"
import { cartLineTotal, QUICK_KEY_ITEMS, totalAvailable, totalOnHand, totalSetAside, type CartLine, type Product } from "@/lib/pos-data"

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const interval = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <span className="tabular-nums text-muted-foreground">
      {now ? now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }) : "—"}
    </span>
  )
}

export function CartPanel({
  cart,
  scanValue,
  onScanChange,
  scanInputRef,
  searchMatches,
  dropdownIndex,
  scanError,
  onSimulateScan,
  onIncrement,
  onDecrement,
  onRemove,
  onQuickKeyAdd,
  onPickSearchMatch,
  justAddedProductId,
  quickKeysOpen,
  onToggleQuickKeys,
}: {
  cart: CartLine[]
  scanValue: string
  onScanChange: (value: string) => void
  scanInputRef: React.RefObject<HTMLInputElement | null>
  searchMatches: Product[]
  dropdownIndex: number
  scanError: string | null
  onSimulateScan: () => void
  onIncrement: (productId: string) => void
  onDecrement: (productId: string) => void
  onRemove: (productId: string) => void
  onQuickKeyAdd: (product: Product) => void
  onPickSearchMatch: (product: Product) => void
  justAddedProductId: string | null
  quickKeysOpen: boolean
  onToggleQuickKeys: () => void
}) {
  const listEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (justAddedProductId) {
      listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }
  }, [justAddedProductId])

  const showDropdown = scanValue.trim().length > 0 && searchMatches.length > 0

  return (
    <div className="flex h-full min-w-0 flex-col border-r">
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold">MyStoreGuard</span>
          <span className="text-muted-foreground">Adjoa Boateng · Cashier</span>
        </div>
        <LiveClock />
      </div>

      <div className="shrink-0 border-b p-4">
        <div className="relative">
          <ScanLine className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={scanInputRef}
            value={scanValue}
            onChange={(event) => onScanChange(event.target.value)}
            placeholder="Scan barcode or search product…"
            className="h-11 pl-10 text-base"
            autoComplete="off"
          />
        </div>

        {scanError && (
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">{scanError}</p>
        )}

        {!scanError && (
          <button
            type="button"
            onClick={onSimulateScan}
            className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Shuffle className="size-3" />
            Simulate scan
          </button>
        )}

        {showDropdown && (
          <div className="mt-2 overflow-hidden rounded-lg border bg-popover shadow-sm">
            {searchMatches.map((product, index) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onPickSearchMatch(product)}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-left text-sm",
                  index === dropdownIndex ? "bg-accent" : "hover:bg-accent/50"
                )}
              >
                <span className="flex flex-col">
                  <span>{product.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {totalAvailable(product)} available
                    {totalSetAside(product) > 0 && ` · ${totalOnHand(product)} on hand, ${totalSetAside(product)} set aside for delivery`}
                  </span>
                </span>
                <span className="text-muted-foreground">{formatGHS(product.sellingPrice)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
            <ScanLine className="size-6" />
            <p className="text-sm">Scan an item to begin</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y">
            {cart.map((line) => (
              <div
                key={line.product.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors duration-700",
                  justAddedProductId === line.product.id && "bg-primary/10"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{line.product.name}</p>
                  <p className="text-sm text-muted-foreground">{formatGHS(line.product.sellingPrice)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => onDecrement(line.product.id)}
                    aria-label={`Decrease ${line.product.name} quantity`}
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="w-6 text-center tabular-nums">{line.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => onIncrement(line.product.id)}
                    aria-label={`Increase ${line.product.name} quantity`}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
                <span className="w-24 text-right font-medium tabular-nums">
                  {formatGHS(cartLineTotal(line))}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRemove(line.product.id)}
                  aria-label={`Remove ${line.product.name}`}
                  className="text-muted-foreground"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
            <div ref={listEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t">
        <button
          type="button"
          onClick={onToggleQuickKeys}
          className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground"
        >
          Quick keys
          <ChevronRight className={cn("size-4 transition-transform", quickKeysOpen && "rotate-90")} />
        </button>
        {quickKeysOpen && (
          <div className="grid grid-cols-3 gap-2 px-4 pb-4 sm:grid-cols-6">
            {QUICK_KEY_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onQuickKeyAdd(item)}
                className="flex flex-col items-center gap-0.5 rounded-lg border p-2 text-center text-xs hover:bg-accent"
              >
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">{formatGHS(item.sellingPrice)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
