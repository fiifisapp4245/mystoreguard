/**
 * Categories, brands, and units — how the catalogue is organised. Managed
 * from Inventory (Products tab toolbar), not Settings: this is catalogue
 * structure, not store configuration, and prices live on the product record
 * itself rather than in a second, easily-out-of-sync screen.
 */

export interface CatalogueMetadataItem {
  id: string
  name: string
  active: boolean
}

let categoriesStore: CatalogueMetadataItem[] = [
  "Dairy",
  "Beverages",
  "Cooking Oil",
  "Noodles",
  "Toiletries",
  "Canned Fish",
  "Grains",
  "Cooking Essentials",
  "Batteries",
  "Produce",
  "Household",
].map((name, i) => ({ id: `cat-${i + 1}`, name, active: true }))

let brandsStore: CatalogueMetadataItem[] = [
  "Nestlé",
  "Unilever",
  "Frytol",
  "Indomie",
  "Coca-Cola",
  "Voltic",
].map((name, i) => ({ id: `brand-${i + 1}`, name, active: true }))

let unitsStore: CatalogueMetadataItem[] = [
  "Tin",
  "Bottle",
  "Pack",
  "Bar",
  "Bag",
  "Sachet",
  "Tube",
  "Box",
  "Basket",
  "Block",
  "Olonka",
  "Crate",
].map((name, i) => ({ id: `unit-${i + 1}`, name, active: true }))

function makeStore(getStore: () => CatalogueMetadataItem[], setStore: (next: CatalogueMetadataItem[]) => void) {
  return {
    add(name: string): void {
      const trimmed = name.trim()
      if (!trimmed) return
      setStore([...getStore(), { id: `${trimmed.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`, name: trimmed, active: true }])
    },
    toggleActive(id: string): void {
      setStore(getStore().map((item) => (item.id === id ? { ...item, active: !item.active } : item)))
    },
    rename(id: string, name: string): void {
      const trimmed = name.trim()
      if (!trimmed) return
      setStore(getStore().map((item) => (item.id === id ? { ...item, name: trimmed } : item)))
    },
  }
}

export function getCategoriesStore(): CatalogueMetadataItem[] {
  return categoriesStore
}
export const categoriesActions = makeStore(getCategoriesStore, (next) => (categoriesStore = next))

export function getBrandsStore(): CatalogueMetadataItem[] {
  return brandsStore
}
export const brandsActions = makeStore(getBrandsStore, (next) => (brandsStore = next))

export function getUnitsStore(): CatalogueMetadataItem[] {
  return unitsStore
}
export const unitsActions = makeStore(getUnitsStore, (next) => (unitsStore = next))
