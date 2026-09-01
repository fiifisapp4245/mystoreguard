"use client"

import { createContext, useCallback, useContext, useState } from "react"

import type { StorePersona } from "@/hooks/use-demo-state"
import { storefrontRows, type ListingRow } from "@/lib/online-listings-data"
import { cartLineViews, type CartItem, type CartLineView } from "@/lib/online-orders-data"
import { getOnlineStore, getPersonaBySlug, isStoreOpen, type OnlineStore } from "@/lib/online-store-data"

interface StorefrontValue {
  slug: string
  /** Undefined when no published store owns this address. */
  persona?: StorePersona
  store?: OnlineStore
  /** True when the merchant has published and not paused — the only state that takes orders. */
  open: boolean
  rows: ListingRow[]
  items: CartItem[]
  lines: CartLineView[]
  itemCount: number
  addToCart: (productId: string, quantity: number) => void
  setQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  /** Re-read the shared stores after a bid or an order changes them. */
  refresh: () => void
}

const StorefrontContext = createContext<StorefrontValue | null>(null)

export function useStorefront(): StorefrontValue {
  const value = useContext(StorefrontContext)
  if (!value) throw new Error("useStorefront must be used inside StorefrontProvider")
  return value
}

/**
 * The customer's side of the store. It reads the merchant's real
 * configuration, real listings and real shared stock — there is no separate
 * customer-facing dataset. The basket is the only thing that lives purely
 * here, because until an order is placed it isn't the business's concern.
 */
export function StorefrontProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [, setVersion] = useState(0)

  // Bumping this re-runs the reads below, which is how a placed bid or a new
  // order shows up at once — the stores in lib/ can't notify React themselves.
  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  const persona = getPersonaBySlug(slug)
  const store = persona ? getOnlineStore(persona) : undefined
  const rows = persona ? storefrontRows(persona) : []
  const lines = persona ? cartLineViews(persona, items, rows) : []

  const value: StorefrontValue = {
    slug,
    persona,
    store,
    open: Boolean(store && isStoreOpen(store)),
    rows,
    items,
    lines,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    addToCart: (productId, quantity) =>
      setItems((prev) => {
        const existing = prev.find((item) => item.productId === productId)
        if (!existing) return [...prev, { productId, quantity }]
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item
        )
      }),
    setQuantity: (productId, quantity) =>
      setItems((prev) =>
        quantity <= 0
          ? prev.filter((item) => item.productId !== productId)
          : prev.map((item) => (item.productId === productId ? { ...item, quantity } : item))
      ),
    removeFromCart: (productId) => setItems((prev) => prev.filter((item) => item.productId !== productId)),
    clearCart: () => setItems([]),
    cartOpen,
    setCartOpen,
    refresh,
  }

  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>
}
