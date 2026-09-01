"use client"

import { useState } from "react"
import { Search } from "lucide-react"

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
import { formatGHS } from "@/lib/mock-data"
import { onlinePriceOf, type ListingRow } from "@/lib/online-listings-data"
import type { Collection } from "@/lib/online-store-data"

/**
 * A collection is a named group of products already on the store — a way for
 * a customer to browse, not a second catalogue. It holds product ids only.
 */
export function CollectionDialog({
  collection,
  rows,
  onOpenChange,
  onSave,
}: {
  collection: Collection | null
  rows: ListingRow[]
  onOpenChange: (open: boolean) => void
  onSave: (collection: Collection) => void
}) {
  const [name, setName] = useState("")
  const [ids, setIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [loadedFor, setLoadedFor] = useState<string | null>(null)

  if (collection && collection.id !== loadedFor) {
    setLoadedFor(collection.id)
    setName(collection.name)
    setIds(new Set(collection.productIds))
    setSearch("")
  }

  if (!collection) return null

  const query = search.trim().toLowerCase()
  const visible = rows.filter((row) => !query || row.product.name.toLowerCase().includes(query))
  const canSave = name.trim().length > 0 && ids.size > 0

  function toggle(productId: string) {
    setIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{collection.name ? "Edit collection" : "New collection"}</DialogTitle>
          <DialogDescription>
            Group products the way your customers shop — &ldquo;Pantry staples&rdquo;, &ldquo;Drinks&rdquo;,
            &ldquo;Household&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="collection-name">
              Collection name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="collection-name"
              value={name}
              placeholder="e.g. Pantry staples"
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products on your store..."
              aria-label="Search products on your store"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-8"
            />
          </div>

          <ScrollArea className="h-64 rounded-lg border">
            <div className="flex flex-col divide-y">
              {visible.map((row) => {
                const checkboxId = `collection-item-${row.product.id}`
                return (
                  <div key={row.product.id} className="flex items-center gap-3 px-3 py-2">
                    <Checkbox
                      id={checkboxId}
                      checked={ids.has(row.product.id)}
                      onCheckedChange={() => toggle(row.product.id)}
                    />
                    <Label htmlFor={checkboxId} className="flex flex-1 cursor-pointer justify-between font-normal">
                      <span className="text-sm">{row.product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatGHS(onlinePriceOf(row.listing, row.product))}
                      </span>
                    </Label>
                  </div>
                )
              })}
              {visible.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Nothing matches. Only products already on your store can go in a collection.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <div className="flex w-full items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {ids.size} {ids.size === 1 ? "product" : "products"} in this collection
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                disabled={!canSave}
                onClick={() => onSave({ ...collection, name: name.trim(), productIds: Array.from(ids) })}
              >
                Save collection
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
