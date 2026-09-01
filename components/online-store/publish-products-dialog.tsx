"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { LiveResultCount } from "@/components/dashboard/live-result-count"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { StorePersona } from "@/hooks/use-demo-state"
import { formatGHS } from "@/lib/mock-data"
import { getListing, productsForPersona } from "@/lib/online-listings-data"
import { totalAvailable, type Product } from "@/lib/pos-data"

function stockLabel(product: Product): { label: string; status: "In stock" | "Low stock" | "Out of stock" } {
  const available = totalAvailable(product)
  if (product.isService) return { label: "Service", status: "In stock" }
  if (available <= 0) return { label: "None left", status: "Out of stock" }
  if (available <= product.reorderPoint) return { label: `${available} left`, status: "Low stock" }
  return { label: `${available} available`, status: "In stock" }
}

/**
 * Choosing which of the shop's existing products to sell online.
 *
 * This is the heart of "one catalogue": there is no form to fill in, no
 * price to restate, no stock number to enter. The merchant picks from what
 * they already have. Products already online are shown as such and can't be
 * double-added — that's the duplicate-product problem prevented rather than
 * warned about.
 */
export function PublishProductsDialog({
  open,
  onOpenChange,
  persona,
  onPublish,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  persona: StorePersona
  onPublish: (productIds: string[]) => void
}) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [wasOpen, setWasOpen] = useState(false)

  // Start from a clean selection each time the dialog is opened.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setSelected(new Set())
      setSearch("")
      setCategory("All")
    }
  }

  const catalogue = productsForPersona(persona).filter((product) => product.isActive)
  const categories = useMemo(
    () => Array.from(new Set(catalogue.map((product) => product.category))).sort(),
    [catalogue]
  )

  const rows = catalogue
    .map((product) => ({ product, alreadyOnline: getListing(persona, product.id)?.published ?? false }))
    .filter(({ product }) => {
      const query = search.trim().toLowerCase()
      const matchesSearch = !query || product.name.toLowerCase().includes(query)
      const matchesCategory = category === "All" || product.category === category
      return matchesSearch && matchesCategory
    })

  const selectable = rows.filter((row) => !row.alreadyOnline)
  const allSelected = selectable.length > 0 && selectable.every((row) => selected.has(row.product.id))

  function toggle(productId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) => {
      if (allSelected) {
        const next = new Set(prev)
        for (const row of selectable) next.delete(row.product.id)
        return next
      }
      const next = new Set(prev)
      for (const row of selectable) next.add(row.product.id)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sell products online</DialogTitle>
          <DialogDescription>
            Pick from the products you already stock. Nothing gets copied — the same product, the same price,
            the same stock count, now visible to customers online too.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:max-w-64">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search your products..."
              aria-label="Search your products"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All categories</SelectItem>
              {categories.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={toggleAll} disabled={selectable.length === 0}>
            {allSelected ? "Clear all" : "Select all shown"}
          </Button>
        </div>
        <LiveResultCount count={rows.length} itemLabel="product" />

        <ScrollArea className="h-80 rounded-lg border">
          <div className="flex flex-col divide-y">
            {rows.map(({ product, alreadyOnline }) => {
              const stock = stockLabel(product)
              const checkboxId = `publish-${product.id}`
              return (
                <div key={product.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Checkbox
                    id={checkboxId}
                    checked={alreadyOnline || selected.has(product.id)}
                    disabled={alreadyOnline}
                    onCheckedChange={() => toggle(product.id)}
                  />
                  <Label htmlFor={checkboxId} className="flex flex-1 cursor-pointer items-center gap-3 font-normal">
                    <span className="flex flex-1 flex-col">
                      <span className="text-sm font-medium">{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {product.category} · {formatGHS(product.sellingPrice)} per {product.pack.baseUnit.toLowerCase()}
                      </span>
                    </span>
                    <StatusBadge label={stock.status} />
                    <span className="w-24 text-right text-xs text-muted-foreground">{stock.label}</span>
                    {alreadyOnline && (
                      <Badge variant="secondary" className="font-normal">
                        Already online
                      </Badge>
                    )}
                  </Label>
                </div>
              )
            })}
            {rows.length === 0 && (
              <p className="px-3 py-10 text-center text-sm text-muted-foreground">
                No products match what you searched for.
              </p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <div className="flex w-full items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {selected.size === 0
                ? "Out-of-stock products can still be listed — they show as sold out until you restock."
                : `${selected.size} selected`}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button disabled={selected.size === 0} onClick={() => onPublish(Array.from(selected))}>
                {selected.size > 1 ? `Sell ${selected.size} products online` : "Sell online"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
