"use client"

import { useState } from "react"
import { Layers, Pencil, Plus, Star, Trash2 } from "lucide-react"

import { CollectionDialog } from "@/components/online-store/collection-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { ListingRow } from "@/lib/online-listings-data"
import { BRAND_ACCENTS, type BrandAccent, type Collection, type StorefrontConfig } from "@/lib/online-store-data"
import { cn } from "@/lib/utils"

const MAX_FEATURED = 6

/**
 * What a customer sees first. Deliberately MVP: a welcome line, a colour, a
 * handful of featured products, and collections — all of it built from
 * products that already exist. No page builder, because the app has no
 * drag-and-drop anywhere else and one screen shouldn't invent that language.
 */
export function storefrontProblems(config: StorefrontConfig): string[] {
  if (!config.headline.trim()) return ["Write the welcome line customers see first"]
  return []
}

export function StorefrontFields({
  value,
  rows,
  onChange,
}: {
  value: StorefrontConfig
  /** Products already on the store — the only things that can be featured or collected. */
  rows: ListingRow[]
  onChange: (patch: Partial<StorefrontConfig>) => void
}) {
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)

  const featured = value.featuredProductIds
    .map((id) => rows.find((row) => row.product.id === id))
    .filter((row): row is ListingRow => Boolean(row))

  const featurable = rows.filter((row) => !value.featuredProductIds.includes(row.product.id))
  const accent = BRAND_ACCENTS.find((option) => option.id === value.accent) ?? BRAND_ACCENTS[0]

  function addFeatured(productId: string) {
    if (value.featuredProductIds.length >= MAX_FEATURED) return
    onChange({ featuredProductIds: [...value.featuredProductIds, productId] })
  }

  function removeFeatured(productId: string) {
    onChange({ featuredProductIds: value.featuredProductIds.filter((id) => id !== productId) })
  }

  function saveCollection(collection: Collection) {
    const exists = value.collections.some((existing) => existing.id === collection.id)
    onChange({
      collections: exists
        ? value.collections.map((existing) => (existing.id === collection.id ? collection : existing))
        : [...value.collections, collection],
    })
    setEditingCollection(null)
  }

  function removeCollection(id: string) {
    onChange({ collections: value.collections.filter((collection) => collection.id !== id) })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* A real preview of the top of the page, so the words below have somewhere to land. */}
      <div className={cn("overflow-hidden rounded-xl border bg-gradient-to-br p-6", accent.heroClass)}>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Homepage preview</p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight">
          {value.headline || "Your welcome line goes here"}
        </h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {value.subheadline || "And a sentence underneath, if you want one."}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="storefront-headline">
            Welcome line <span className="text-destructive">*</span>
          </Label>
          <Input
            id="storefront-headline"
            value={value.headline}
            placeholder="e.g. Your everyday provisions, delivered"
            onChange={(event) => onChange({ headline: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="storefront-sub">A sentence underneath</Label>
          <Textarea
            id="storefront-sub"
            rows={2}
            value={value.subheadline}
            placeholder="e.g. The same shelves as our Makola stall — order before 3pm for same-day delivery."
            onChange={(event) => onChange({ subheadline: event.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Store colour</Label>
        <div className="flex flex-wrap gap-2">
          {BRAND_ACCENTS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange({ accent: option.id as BrandAccent })}
              aria-pressed={value.accent === option.id}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                value.accent === option.id ? "border-primary bg-primary/5 font-medium" : "hover:bg-accent/40"
              )}
            >
              <span className={cn("size-4 rounded-full", option.swatch)} />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <Label>Featured products</Label>
          <span className="text-xs text-muted-foreground">
            {featured.length} of {MAX_FEATURED}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {featured.map((row) => (
            <Badge key={row.product.id} variant="secondary" className="gap-1.5 py-1 font-normal">
              <Star className="size-3" />
              {row.product.name}
              <button
                type="button"
                onClick={() => removeFeatured(row.product.id)}
                aria-label={`Stop featuring ${row.product.name}`}
                className="text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="size-3" />
              </button>
            </Badge>
          ))}
          {featured.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nothing featured yet — the homepage will show your newest products instead.
            </p>
          )}
        </div>
        {featured.length < MAX_FEATURED && featurable.length > 0 && (
          <Select value="" onValueChange={addFeatured}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="Feature a product..." />
            </SelectTrigger>
            <SelectContent>
              {featurable.map((row) => (
                <SelectItem key={row.product.id} value={row.product.id}>
                  {row.product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {rows.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Put some products on your store first — then you can choose which to feature.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Collections</Label>
          <Button
            variant="outline"
            size="sm"
            disabled={rows.length === 0}
            onClick={() =>
              setEditingCollection({ id: `col-${Date.now().toString(36)}`, name: "", productIds: [] })
            }
          >
            <Plus />
            New collection
          </Button>
        </div>
        <div className="flex flex-col divide-y rounded-lg border">
          {value.collections.map((collection) => (
            <div key={collection.id} className="flex items-center gap-3 px-3 py-2.5">
              <Layers className="size-4 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{collection.name}</p>
                <p className="text-xs text-muted-foreground">
                  {collection.productIds.length} {collection.productIds.length === 1 ? "product" : "products"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${collection.name}`}
                onClick={() => setEditingCollection(collection)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${collection.name}`}
                onClick={() => removeCollection(collection.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {value.collections.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No collections yet. Customers will browse one long list until you group things.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Show how many are left</p>
          <p className="text-xs text-muted-foreground">
            Customers see &ldquo;only 4 left&rdquo; when stock runs low. Turn off to show only in stock or sold out.
          </p>
        </div>
        <Switch
          checked={value.showStockCounts}
          onCheckedChange={(checked) => onChange({ showStockCounts: checked })}
          aria-label="Show how many are left"
        />
      </div>

      <CollectionDialog
        collection={editingCollection}
        rows={rows}
        onOpenChange={(open) => !open && setEditingCollection(null)}
        onSave={saveCollection}
      />
    </div>
  )
}
