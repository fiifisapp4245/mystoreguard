"use client"

import { useMemo, useState } from "react"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatGHS } from "@/lib/mock-data"
import { searchProducts } from "@/lib/pos-data"
import type { InvoiceLineItem } from "@/lib/invoice-data"

export function InvoiceItemsSection({
  lineItems,
  onChange,
}: {
  lineItems: InvoiceLineItem[]
  onChange: (lineItems: InvoiceLineItem[]) => void
}) {
  const [search, setSearch] = useState("")
  const matches = useMemo(() => (search.trim() ? searchProducts(search) : []), [search])

  function addProduct(name: string, unitPrice: number) {
    const existingIndex = lineItems.findIndex((line) => line.name === name)
    if (existingIndex >= 0) {
      onChange(
        lineItems.map((line, index) =>
          index === existingIndex ? { ...line, quantity: line.quantity + 1 } : line
        )
      )
    } else {
      onChange([...lineItems, { name, quantity: 1, unitPrice }])
    }
    setSearch("")
  }

  function addFreeText() {
    if (!search.trim()) return
    onChange([...lineItems, { name: search.trim(), quantity: 1, unitPrice: 0 }])
    setSearch("")
  }

  function updateLine(index: number, patch: Partial<InvoiceLineItem>) {
    onChange(lineItems.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  function removeLine(index: number) {
    onChange(lineItems.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search product or type a custom item..." aria-label="Search product or type a custom item"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              if (matches[0]) addProduct(matches[0].name, matches[0].sellingPrice)
              else addFreeText()
            }
          }}
        />
        {matches.length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-sm">
            {matches.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addProduct(product.name, product.sellingPrice)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span>{product.name}</span>
                <span className="text-muted-foreground">{formatGHS(product.sellingPrice)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {search.trim() && matches.length === 0 && (
        <button
          type="button"
          onClick={addFreeText}
          className="flex items-center gap-1 text-left text-sm text-primary hover:underline"
        >
          <Plus className="size-3.5" />
          Add &quot;{search.trim()}&quot; as a custom item
        </button>
      )}

      <div className="flex flex-col divide-y rounded-lg border">
        <div className="grid grid-cols-[1fr_60px_90px_90px_28px] gap-2 px-3 py-1.5 text-xs text-muted-foreground">
          <span>Item</span>
          <span>Qty</span>
          <span>Unit price</span>
          <span className="text-right">Line total</span>
          <span />
        </div>
        {lineItems.map((line, index) => (
          <div key={index} className="grid grid-cols-[1fr_60px_90px_90px_28px] items-center gap-2 px-3 py-2">
            <span className="truncate text-sm">{line.name}</span>
            <Input
              type="number"
              min="0"
              value={line.quantity}
              onChange={(event) => updateLine(index, { quantity: Number.parseFloat(event.target.value) || 0 })}
              className="h-8 px-2"
            />
            <Input
              type="number"
              min="0"
              value={line.unitPrice}
              onChange={(event) => updateLine(index, { unitPrice: Number.parseFloat(event.target.value) || 0 })}
              className="h-8 px-2"
            />
            <span className="text-right text-sm font-medium">{formatGHS(line.quantity * line.unitPrice)}</span>
            <Button variant="ghost" size="icon-sm" onClick={() => removeLine(index)} aria-label={`Remove ${line.name}`}>
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
        {lineItems.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No items yet — search above to add one.</p>
        )}
      </div>
    </div>
  )
}
