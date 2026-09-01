"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { useStorefront } from "@/components/storefront/storefront-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatGHS } from "@/lib/mock-data"
import {
  availablePaymentMethods,
  cartItemsTotal,
  deliveryFeeFor,
  enabledZones,
  placeOrder,
  type FulfilmentMethod,
  type OnlinePaymentMethod,
} from "@/lib/online-orders-data"
import { storefrontPath } from "@/lib/online-store-data"
import { cn } from "@/lib/utils"

/**
 * Checkout. Only the fulfilment methods and payment methods the merchant
 * actually switched on appear here — a customer can't pick something the
 * shop can't honour.
 */
export function StorefrontCheckout() {
  const { store, persona, rows, items, lines, slug, open, clearCart } = useStorefront()
  const router = useRouter()

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [fulfilment, setFulfilment] = useState<FulfilmentMethod>("delivery")
  const [area, setArea] = useState<string>("")
  const [address, setAddress] = useState("")
  const [payment, setPayment] = useState<OnlinePaymentMethod | "">("")
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)

  if (!store || !persona) return null

  const zones = enabledZones(store.delivery)
  const methods = availablePaymentMethods(store)
  const canDeliver = zones.length > 0
  const itemsTotal = cartItemsTotal(lines)
  const deliveryFee = fulfilment === "delivery" ? deliveryFeeFor(store.delivery, area || undefined, itemsTotal) : 0
  const total = itemsTotal + deliveryFee

  // Fall back to whichever fulfilment the shop actually offers.
  const effectiveFulfilment: FulfilmentMethod = canDeliver ? fulfilment : "pickup"
  // Cash on delivery makes no sense for a collection order.
  const usableMethods = methods.filter(
    (method) => method !== "Cash on delivery" || effectiveFulfilment === "delivery"
  )

  function handlePlaceOrder() {
    const result = placeOrder(persona!, store!, items, rows, {
      customerName: name,
      customerPhone: phone,
      fulfilment: effectiveFulfilment,
      deliveryArea: effectiveFulfilment === "delivery" ? area : undefined,
      deliveryAddress: effectiveFulfilment === "delivery" ? address : undefined,
      paymentMethod: (payment || usableMethods[0]) as OnlinePaymentMethod,
      note,
    })

    if (!result.ok) {
      setError(result.reason)
      return
    }

    clearCart()
    router.push(`${storefrontPath(slug)}/order/${result.order.id}`)
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-20 text-center">
        <p className="text-sm text-muted-foreground">Your basket is empty.</p>
        <Button asChild variant="outline">
          <Link href={storefrontPath(slug)}>
            <ArrowLeft />
            Back to the shop
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={storefrontPath(slug)}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Keep shopping
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-sans text-base">Who&apos;s it for?</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="checkout-name">
                  Your name <span className="text-destructive">*</span>
                </Label>
                <Input id="checkout-name" value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="checkout-phone">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="checkout-phone"
                  inputMode="tel"
                  placeholder="024 123 4567"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-sans text-base">How would you like it?</CardTitle>
              {!canDeliver && <CardDescription>This shop is collection only.</CardDescription>}
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {canDeliver && store.delivery.pickupEnabled && (
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={effectiveFulfilment}
                  onValueChange={(value) => value && setFulfilment(value as FulfilmentMethod)}
                  className="w-full"
                >
                  <ToggleGroupItem value="delivery" className="flex-1">
                    Deliver it
                  </ToggleGroupItem>
                  <ToggleGroupItem value="pickup" className="flex-1">
                    I&apos;ll collect
                  </ToggleGroupItem>
                </ToggleGroup>
              )}

              {effectiveFulfilment === "delivery" ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>
                      Which area? <span className="text-destructive">*</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {zones.map((zone) => (
                        <button
                          key={zone.id}
                          type="button"
                          onClick={() => setArea(zone.area)}
                          aria-pressed={area === zone.area}
                          className={cn(
                            "flex flex-col items-start rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                            area === zone.area ? "border-primary bg-primary/5" : "hover:bg-accent/40"
                          )}
                        >
                          <span className="font-medium">{zone.area}</span>
                          <span className="text-xs text-muted-foreground">
                            {zone.fee > 0 ? formatGHS(zone.fee) : "Free"} · {zone.eta}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="checkout-address">
                      Where exactly? <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="checkout-address"
                      rows={2}
                      placeholder="House number, street, and a landmark the rider will know"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <p className="rounded-lg border p-3 text-sm text-muted-foreground">
                  {store.delivery.pickupNote || "Collect from the shop during opening hours."}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-sans text-base">How will you pay?</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {usableMethods.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPayment(method)}
                  aria-pressed={payment === method}
                  className={cn(
                    "flex flex-col items-start rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                    payment === method ? "border-primary bg-primary/5" : "hover:bg-accent/40"
                  )}
                >
                  <span className="font-medium">{method}</span>
                  <span className="text-xs text-muted-foreground">
                    {method === "Cash on delivery"
                      ? "Pay the rider when your order arrives"
                      : `The shop will confirm your ${method.toLowerCase()} payment and start packing`}
                  </span>
                </button>
              ))}
              {usableMethods.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  This shop hasn&apos;t set up a way to pay online yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-sans text-base">Anything the shop should know?</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={2}
                aria-label="Note for the shop"
                placeholder="Optional"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3">
          <Card className="lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle className="font-sans text-base">Your order</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {lines.map((line) => (
                <div key={line.productId} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p>{line.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {line.quantity} × {formatGHS(line.unitPrice)}
                    </p>
                  </div>
                  <span>{formatGHS(line.lineTotal)}</span>
                </div>
              ))}

              <Separator />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span>{formatGHS(itemsTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span>{effectiveFulfilment === "pickup" ? "Collection" : deliveryFee > 0 ? formatGHS(deliveryFee) : "Free"}</span>
              </div>
              {store.delivery.freeDeliveryOver > 0 &&
                effectiveFulfilment === "delivery" &&
                itemsTotal < store.delivery.freeDeliveryOver && (
                  <p className="text-xs text-muted-foreground">
                    Spend {formatGHS(store.delivery.freeDeliveryOver - itemsTotal)} more for free delivery.
                  </p>
                )}

              <Separator />

              <div className="flex items-center justify-between font-medium">
                <span>Total</span>
                <span className="text-lg">{formatGHS(total)}</span>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button onClick={handlePlaceOrder} disabled={!open || usableMethods.length === 0}>
                Place order
              </Button>
              {!open && (
                <p className="text-center text-xs text-muted-foreground">
                  This shop isn&apos;t taking orders right now.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
