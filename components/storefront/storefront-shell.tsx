"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Minus, Phone, Plus, ShoppingCart, Trash2 } from "lucide-react"

import { useStorefront } from "@/components/storefront/storefront-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatGHS } from "@/lib/mock-data"
import { cartItemsTotal } from "@/lib/online-orders-data"
import { accentOf, storefrontPath } from "@/lib/online-store-data"
import { cn } from "@/lib/utils"

/**
 * The shop window's own chrome. It uses the same tokens, Button, Badge and
 * Sheet as the rest of MyStoreGuard — a customer-facing skin on one design
 * system, not a second one.
 */
export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const { store, persona, open, itemCount, setCartOpen, slug } = useStorefront()
  // A customer never sees the bar these params drive; a merchant previewing
  // their store does, and it has to take them back to the same business.
  const params = useSearchParams().toString()
  const backHref = params ? `/online-store/online-overview?${params}` : "/online-store/online-overview"

  if (!persona || !store) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold">This store isn&apos;t open yet</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Nothing has been published at <span className="font-medium">{slug}</span>. If this is your shop, finish
          setting it up in MyStoreGuard and publish it.
        </p>
        <Button asChild variant="outline">
          <Link href={backHref}>
            <ArrowLeft />
            Back to MyStoreGuard
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* The merchant can reach their own dashboard from a preview — a customer would simply never see this bar. */}
      <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-1.5 text-xs text-muted-foreground">
        <Link href={backHref} className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="size-3" />
          Back to MyStoreGuard
        </Link>
        <span>·</span>
        <span>{open ? "This is what your customers see" : "Preview — not published yet"}</span>
      </div>

      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href={storefrontPath(slug)} className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
              {store.info.logoInitials || store.info.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">{store.info.name}</span>
              {store.info.tagline && (
                <span className="hidden text-xs text-muted-foreground sm:block">{store.info.tagline}</span>
              )}
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {store.info.phone && (
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <a href={`tel:${store.info.phone.replace(/\s/g, "")}`}>
                  <Phone />
                  {store.info.phone}
                </a>
              </Button>
            )}
            <Button variant="outline" onClick={() => setCartOpen(true)}>
              <ShoppingCart />
              Basket
              {itemCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 tabular-nums">
                  {itemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {!open && (
        <div className="border-b bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-700 dark:text-amber-400">
          {store.publishState === "paused"
            ? "This shop isn't taking orders at the moment."
            : "This shop hasn't opened yet — you're seeing a preview."}
        </div>
      )}

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">{children}</main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground sm:px-6">
          <p className="font-medium text-foreground">{store.info.name}</p>
          {store.info.phone && <p>Call or WhatsApp {store.info.whatsapp || store.info.phone}</p>}
          {store.delivery.pickupEnabled && store.delivery.pickupNote && <p>{store.delivery.pickupNote}</p>}
          <p className="pt-2">Powered by MyStoreGuard</p>
        </div>
      </footer>

      <CartSheet />
    </div>
  )
}

function CartSheet() {
  const { lines, cartOpen, setCartOpen, setQuantity, removeFromCart, slug, open, store } = useStorefront()
  const total = cartItemsTotal(lines)
  const accent = store ? accentOf(store) : undefined

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-sans">Your basket</SheetTitle>
          <SheetDescription>
            {lines.length === 0 ? "Nothing in it yet." : `${lines.length} ${lines.length === 1 ? "item" : "items"}`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 overflow-y-auto px-4">
          {lines.map((line) => (
            <div key={line.productId} className="flex flex-col gap-2 rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{line.name}</p>
                  <p className="text-xs text-muted-foreground">{formatGHS(line.unitPrice)} each</p>
                </div>
                <span className="text-sm font-medium">{formatGHS(line.lineTotal)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={`One fewer ${line.name}`}
                  onClick={() => setQuantity(line.productId, line.quantity - 1)}
                >
                  <Minus className="size-3.5" />
                </Button>
                <span className="w-8 text-center text-sm tabular-nums">{line.quantity}</span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={`One more ${line.name}`}
                  disabled={line.quantity >= line.available}
                  onClick={() => setQuantity(line.productId, line.quantity + 1)}
                >
                  <Plus className="size-3.5" />
                </Button>
                {line.quantity >= line.available && (
                  <span className="text-xs text-muted-foreground">That&apos;s all they have</span>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="ml-auto"
                  aria-label={`Remove ${line.name}`}
                  onClick={() => removeFromCart(line.productId)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}

          {lines.length === 0 && (
            <div className={cn("rounded-lg border border-dashed p-8 text-center", accent && "bg-muted/30")}>
              <p className="text-sm text-muted-foreground">Add something from the shop and it&apos;ll show up here.</p>
            </div>
          )}
        </div>

        <SheetFooter>
          {lines.length > 0 && (
            <>
              <div className="flex items-center justify-between px-1 text-sm">
                <span className="text-muted-foreground">Items</span>
                <span className="font-medium">{formatGHS(total)}</span>
              </div>
              <Button asChild disabled={!open}>
                <Link href={`${storefrontPath(slug)}/checkout`} onClick={() => setCartOpen(false)}>
                  Checkout
                </Link>
              </Button>
              {!open && (
                <p className="text-center text-xs text-muted-foreground">
                  This shop isn&apos;t taking orders right now.
                </p>
              )}
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
