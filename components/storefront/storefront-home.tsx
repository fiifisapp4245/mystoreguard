"use client"

import { useState } from "react"
import { Search, Truck } from "lucide-react"

import { ProductCard } from "@/components/storefront/product-card"
import { useStorefront } from "@/components/storefront/storefront-provider"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { formatGHS } from "@/lib/mock-data"
import { accentOf } from "@/lib/online-store-data"
import { cn } from "@/lib/utils"

export function StorefrontHome() {
  const { store, persona, rows, slug } = useStorefront()
  const [search, setSearch] = useState("")
  const [collectionId, setCollectionId] = useState<string>("all")

  if (!store || !persona) return null

  const accent = accentOf(store)
  const query = search.trim().toLowerCase()

  const collection = store.storefront.collections.find((entry) => entry.id === collectionId)
  const scoped = collection ? rows.filter((row) => collection.productIds.includes(row.product.id)) : rows
  const visible = scoped.filter((row) => !query || row.product.name.toLowerCase().includes(query))

  const featured = store.storefront.featuredProductIds
    .map((id) => rows.find((row) => row.product.id === id))
    .filter((row): row is NonNullable<typeof row> => Boolean(row))

  const zones = store.delivery.zones.filter((zone) => zone.enabled)

  return (
    <div className="flex flex-col gap-10">
      <section className={cn("rounded-2xl bg-gradient-to-br p-6 sm:p-10", accent.heroClass)}>
        <h1 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
          {store.storefront.headline || store.info.name}
        </h1>
        {store.storefront.subheadline && (
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">{store.storefront.subheadline}</p>
        )}
        {(zones.length > 0 || store.delivery.pickupEnabled) && (
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <Truck className="size-4 text-muted-foreground" />
            {zones.slice(0, 4).map((zone) => (
              <Badge key={zone.id} variant="secondary" className="font-normal">
                {zone.area} · {zone.fee > 0 ? formatGHS(zone.fee) : "Free"} · {zone.eta}
              </Badge>
            ))}
            {store.delivery.pickupEnabled && (
              <Badge variant="secondary" className="font-normal">
                Collect from the shop
              </Badge>
            )}
            {store.delivery.freeDeliveryOver > 0 && (
              <Badge variant="secondary" className="font-normal">
                Free delivery over {formatGHS(store.delivery.freeDeliveryOver)}
              </Badge>
            )}
          </div>
        )}
      </section>

      {featured.length > 0 && !query && collectionId === "all" && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Featured</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((row) => (
              <ProductCard
                key={row.product.id}
                row={row}
                persona={persona}
                slug={slug}
                showStockCounts={store.storefront.showStockCounts}
              />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            {collection ? collection.name : "Everything in the shop"}
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search the shop..."
              aria-label="Search the shop"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {store.storefront.collections.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <CollectionChip active={collectionId === "all"} onClick={() => setCollectionId("all")}>
              Everything
            </CollectionChip>
            {store.storefront.collections.map((entry) => (
              <CollectionChip
                key={entry.id}
                active={collectionId === entry.id}
                onClick={() => setCollectionId(entry.id)}
              >
                {entry.name}
              </CollectionChip>
            ))}
          </div>
        )}

        {visible.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {rows.length === 0
                ? "This shop hasn't put anything on sale yet."
                : "Nothing matches what you searched for."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((row) => (
              <ProductCard
                key={row.product.id}
                row={row}
                persona={persona}
                slug={slug}
                showStockCounts={store.storefront.showStockCounts}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function CollectionChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active ? "border-primary bg-primary/10 font-medium text-primary" : "hover:bg-accent/40"
      )}
    >
      {children}
    </button>
  )
}
