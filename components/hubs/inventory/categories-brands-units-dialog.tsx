"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  brandsActions,
  categoriesActions,
  getBrandsStore,
  getCategoriesStore,
  getUnitsStore,
  unitsActions,
  type CatalogueMetadataItem,
} from "@/lib/catalogue-metadata"

type MetadataKind = "categories" | "brands" | "units"

const TABS: { value: MetadataKind; label: string }[] = [
  { value: "categories", label: "Categories" },
  { value: "brands", label: "Brands" },
  { value: "units", label: "Units" },
]

export function CategoriesBrandsUnitsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [tab, setTab] = useState<MetadataKind>("categories")

  const [categories, setCategories] = useState<CatalogueMetadataItem[]>(() => getCategoriesStore())
  const [brands, setBrands] = useState<CatalogueMetadataItem[]>(() => getBrandsStore())
  const [units, setUnits] = useState<CatalogueMetadataItem[]>(() => getUnitsStore())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Categories, brands &amp; units</DialogTitle>
          <DialogDescription>
            Shared catalogue structure — used across products, filters, and reports.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as MetadataKind)} className="flex-1">
          <TabsList className="w-full">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="flex-1">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="categories">
            <MetadataPanel
              items={categories}
              actions={categoriesActions}
              onRefresh={() => setCategories([...getCategoriesStore()])}
              addPlaceholder="e.g. Frozen foods"
            />
          </TabsContent>
          <TabsContent value="brands">
            <MetadataPanel
              items={brands}
              actions={brandsActions}
              onRefresh={() => setBrands([...getBrandsStore()])}
              addPlaceholder="e.g. Fanmilk"
            />
          </TabsContent>
          <TabsContent value="units">
            <MetadataPanel
              items={units}
              actions={unitsActions}
              onRefresh={() => setUnits([...getUnitsStore()])}
              addPlaceholder="e.g. Roll"
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function MetadataPanel({
  items,
  actions,
  onRefresh,
  addPlaceholder,
}: {
  items: CatalogueMetadataItem[]
  actions: { add: (name: string) => void; toggleActive: (id: string) => void }
  onRefresh: () => void
  addPlaceholder: string
}) {
  const [name, setName] = useState("")

  function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed) return
    actions.add(trimmed)
    onRefresh()
    setName("")
  }

  function handleToggle(id: string) {
    actions.toggleActive(id)
    onRefresh()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto rounded-lg border p-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.name}</span>
              <Badge variant={item.active ? "secondary" : "outline"} className="font-normal">
                {item.active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleToggle(item.id)}>
              {item.active ? "Deactivate" : "Activate"}
            </Button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Nothing here yet.</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={addPlaceholder} aria-label={addPlaceholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAdd()
              }
            }}
          />
          <Button type="button" onClick={handleAdd} disabled={!name.trim()}>
            Add
          </Button>
        </div>
        {!name.trim() && (
          <p className="text-xs text-muted-foreground">Still needs: a name</p>
        )}
      </div>
    </div>
  )
}
