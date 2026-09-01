"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreHorizontal, PackageCheck, Plus, Search } from "lucide-react"
import { toast } from "sonner"

import { LiveResultCount } from "@/components/dashboard/live-result-count"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { TeachingEmptyState } from "@/components/dashboard/teaching-empty-state"
import { ListingDialog } from "@/components/online-store/listing-dialog"
import { PublishProductsDialog } from "@/components/online-store/publish-products-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useOnlineStore, useStoreLink } from "@/hooks/use-online-store"
import { formatGHS } from "@/lib/mock-data"
import { auctionState } from "@/lib/online-auctions-data"
import {
  availabilityOf,
  hasAuction,
  listingRows,
  onlineAvailable,
  onlinePriceOf,
  productsForPersona,
  publishProducts,
  publishedCount,
  SELLING_MODE_LABEL,
  unpublishProduct,
  upsertListing,
  type ListingRow,
  type OnlineListing,
} from "@/lib/online-listings-data"

type VisibilityFilter = "online" | "not-online" | "all"

export function OnlineProductsTab() {
  const { persona, refresh } = useOnlineStore()
  const link = useStoreLink()

  const [search, setSearch] = useState("")
  const [visibility, setVisibility] = useState<VisibilityFilter>("online")
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editing, setEditing] = useState<ListingRow | null>(null)

  const all = listingRows(persona)
  const online = all.filter((row) => row.listing.published)
  const catalogueSize = productsForPersona(persona).filter((p) => p.isActive).length

  const rows = all.filter((row) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || row.product.name.toLowerCase().includes(query)
    const matchesVisibility =
      visibility === "all" || (visibility === "online" ? row.listing.published : !row.listing.published)
    return matchesSearch && matchesVisibility
  })

  const outOfStock = online.filter((row) => availabilityOf(row.listing, row.product) === "Out of stock").length
  const auctionsRunning = online.filter((row) => {
    if (!hasAuction(row.listing)) return false
    const state = auctionState(persona, row.product.id, row.listing.auction!)
    return state === "Live" || state === "Ending soon"
  }).length

  function handlePublish(productIds: string[]) {
    publishProducts(persona, productIds)
    setPickerOpen(false)
    refresh()
    toast.success(
      productIds.length > 1 ? `${productIds.length} products are now online` : "Product is now online",
      { description: "Customers can see them on your store straight away." }
    )
  }

  function handleUnpublish(row: ListingRow) {
    unpublishProduct(persona, row.product.id)
    refresh()
    toast.success("Taken off the store", {
      description: `${row.product.name} is still in your catalogue and still sells at the counter.`,
    })
  }

  function handleSaveListing(listing: OnlineListing) {
    upsertListing(persona, listing)
    setEditing(null)
    refresh()
    toast.success("Saved", { description: "Your store has been updated." })
  }

  function openAuctionSetup(row: ListingRow) {
    setEditing(row)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Products online"
          value={String(publishedCount(persona))}
          caption="as of now"
          footnote={`of ${catalogueSize} in your catalogue`}
        />
        <StatCard
          label="Not online yet"
          value={String(Math.max(0, catalogueSize - publishedCount(persona)))}
          caption="as of now"
          footnote="Available to add at any time"
        />
        <StatCard
          label="Sold out online"
          value={String(outOfStock)}
          caption="as of now"
          footnote={outOfStock > 0 ? "Customers see these as sold out" : "Everything online is buyable"}
        />
        <StatCard
          label="Auctions running"
          value={String(auctionsRunning)}
          caption="as of now"
          footnote="Bidding open right now"
          href={link("/online-store/online-bidding")}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:max-w-64">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              aria-label="Search products online"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={visibility} onValueChange={(value) => setVisibility(value as VisibilityFilter)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">On sale online</SelectItem>
              <SelectItem value="not-online">Taken off the store</SelectItem>
              <SelectItem value="all">Everything listed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" asChild className="ml-auto">
            <Link href={link("/inventory/products")}>Open catalogue</Link>
          </Button>
          <Button onClick={() => setPickerOpen(true)}>
            <Plus />
            Sell products online
          </Button>
        </div>
        <LiveResultCount count={rows.length} itemLabel="product" />
      </div>

      {all.length === 0 ? (
        <TeachingEmptyState
          icon={PackageCheck}
          message="Nothing is on sale online yet. Pick from the products you already stock — you won't have to enter any of them again."
          actionLabel="Sell products online"
          onAction={() => setPickerOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Selling method</TableHead>
                <TableHead>Online price</TableHead>
                <TableHead>Available online</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const { listing, product } = row
                const price = onlinePriceOf(listing, product)
                const available = onlineAvailable(listing, product)
                const capped = listing.onlineStockLimit !== undefined
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">{product.category}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {SELLING_MODE_LABEL[listing.sellingMode]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {listing.sellingMode === "auction" ? (
                        <span className="text-muted-foreground">Bidding</span>
                      ) : (
                        <span className="flex flex-col">
                          {formatGHS(price)}
                          {listing.onlinePrice === undefined && (
                            <span className="text-xs text-muted-foreground">Same as the shop</span>
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-col">
                        {product.isService ? "—" : available}
                        {capped && <span className="text-xs text-muted-foreground">Capped by you</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      {listing.published ? (
                        <StatusBadge label={availabilityOf(listing, product)} />
                      ) : (
                        <StatusBadge label="Unpublished" />
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${product.name}`}>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditing(row)}>Edit online details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openAuctionSetup(row)}>
                            {hasAuction(listing) ? "Edit auction" : "Put up for bidding"}
                          </DropdownMenuItem>
                          {listing.published ? (
                            <DropdownMenuItem variant="destructive" onClick={() => handleUnpublish(row)}>
                              Take off the store
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handlePublish([product.id])}>
                              Put back on the store
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No products match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Prices and stock come from your catalogue. Change a price in Products and it changes here too, unless
        you&apos;ve set a different online price for that product.
      </p>

      <PublishProductsDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        persona={persona}
        onPublish={handlePublish}
      />

      <ListingDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        row={editing}
        onSave={handleSaveListing}
      />
    </div>
  )
}
