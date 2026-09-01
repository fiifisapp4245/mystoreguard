"use client"

import Link from "next/link"
import { ArrowLeft, CheckCircle2 } from "lucide-react"

import { StatusBadge } from "@/components/dashboard/status-badge"
import { useStorefront } from "@/components/storefront/storefront-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatGHS } from "@/lib/mock-data"
import { getOnlineOrder } from "@/lib/online-orders-data"
import { getPaymentMethodsSettings } from "@/lib/payment-methods-data"
import { storefrontPath } from "@/lib/online-store-data"

/**
 * What the customer sees after ordering — and the page they'd come back to
 * to check on it. The payment instructions are the shop's real Momo and bank
 * details, read from the same place the register reads them.
 */
export function StorefrontOrder({ orderId }: { orderId: string }) {
  const { store, persona, slug } = useStorefront()

  if (!store || !persona) return null

  const order = getOnlineOrder(persona, orderId)

  if (!order) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-20 text-center">
        <p className="text-sm text-muted-foreground">We couldn&apos;t find that order.</p>
        <Button asChild variant="outline">
          <Link href={storefrontPath(slug)}>
            <ArrowLeft />
            Back to the shop
          </Link>
        </Button>
      </div>
    )
  }

  const methods = getPaymentMethodsSettings()
  const momo = methods.momoAccounts.filter((account) => account.number.trim())
  const needsPayment = order.paymentStatus === "Awaiting payment"

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="size-10 text-success" aria-hidden="true" />
        <h1 className="text-2xl font-semibold tracking-tight">Thanks, {order.customerName.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">
          Your order <span className="font-medium text-foreground">{order.id}</span> is with {store.info.name}.
          They&apos;ll call you on {order.customerPhone} if they need anything.
        </p>
        <div className="flex gap-2">
          <StatusBadge label={order.status} />
          <StatusBadge label={order.paymentStatus} />
        </div>
      </div>

      {needsPayment && (
        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-base">Pay {formatGHS(order.total)}</CardTitle>
            <CardDescription>
              Send the money, then the shop confirms it and starts packing your order.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {order.paymentMethod === "Momo" &&
              momo.map((account) => (
                <div key={account.network} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{account.network}</p>
                    <p className="text-xs text-muted-foreground">{account.registeredName}</p>
                  </div>
                  <span className="font-mono">{account.number}</span>
                </div>
              ))}
            {order.paymentMethod === "Bank transfer" && (
              <div className="flex flex-col gap-1 rounded-lg border p-3">
                <p className="font-medium">{methods.bankAccount.bankName}</p>
                <p className="text-xs text-muted-foreground">{methods.bankAccount.accountName}</p>
                <p className="font-mono">{methods.bankAccount.accountNumber}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Use {order.id} as the reference.</p>
          </CardContent>
        </Card>
      )}

      {order.paymentStatus === "Pay on delivery" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-base">Pay {formatGHS(order.total)} on delivery</CardTitle>
            <CardDescription>Have the money ready for the rider when your order arrives.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">What you ordered</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {order.lines.map((line) => (
            <div key={line.productId} className="flex items-start justify-between gap-3 text-sm">
              <div>
                <p>{line.name}</p>
                <p className="text-xs text-muted-foreground">
                  {line.quantity} × {formatGHS(line.unitPrice)}
                </p>
              </div>
              <span>{formatGHS(line.quantity * line.unitPrice)}</span>
            </div>
          ))}

          <Separator />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Items</span>
            <span>{formatGHS(order.itemsTotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Delivery</span>
            <span>{order.deliveryFee > 0 ? formatGHS(order.deliveryFee) : order.fulfilment === "pickup" ? "Collection" : "Free"}</span>
          </div>
          <div className="flex items-center justify-between font-medium">
            <span>Total</span>
            <span>{formatGHS(order.total)}</span>
          </div>

          <Separator />

          <div className="flex items-start justify-between gap-4 text-sm">
            <span className="text-muted-foreground">How you&apos;ll get it</span>
            <span className="text-right">
              {order.fulfilment === "pickup"
                ? store.delivery.pickupNote || "Collect from the shop"
                : `${order.deliveryAddress}, ${order.deliveryArea}`}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Where your order is</p>
        <div className="flex flex-col gap-3 border-l pl-4">
          {order.timeline.map((entry, index) => (
            <div key={index} className="relative text-sm">
              <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-primary" />
              <p>{entry.label}</p>
              <p className="text-xs text-muted-foreground">{entry.at}</p>
            </div>
          ))}
        </div>
      </div>

      <Button asChild variant="outline" className="self-start">
        <Link href={storefrontPath(slug)}>
          <ArrowLeft />
          Keep shopping
        </Link>
      </Button>
    </div>
  )
}
