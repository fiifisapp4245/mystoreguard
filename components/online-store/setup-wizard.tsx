"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Eye, PackageCheck, Plus, Rocket, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/dashboard/page-header"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { DeliveryFields, deliveryProblems } from "@/components/online-store/sections/delivery-fields"
import { PaymentFields, paymentProblems } from "@/components/online-store/sections/payment-fields"
import { StoreInfoFields, storeInfoProblems } from "@/components/online-store/sections/store-info-fields"
import { StorefrontFields, storefrontProblems } from "@/components/online-store/sections/storefront-fields"
import { PublishProductsDialog } from "@/components/online-store/publish-products-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useOnlineStore, useStoreLink } from "@/hooks/use-online-store"
import { formatGHS } from "@/lib/mock-data"
import {
  listingRows,
  onlineAvailable,
  onlinePriceOf,
  publishProducts,
  unpublishProduct,
} from "@/lib/online-listings-data"
import {
  publishStore,
  SETUP_STEPS,
  storeUrl,
  storefrontPath,
  suggestedStoreInfo,
  updateOnlineStore,
  type DeliverySettings,
  type OnlinePaymentSettings,
  type SetupStepId,
  type StoreInfo,
  type StorefrontConfig,
} from "@/lib/online-store-data"
import { TODAY_ISO } from "@/lib/period-utils"
import { cn } from "@/lib/utils"

type WizardStep = SetupStepId | "review"

const STEP_ORDER: WizardStep[] = [...SETUP_STEPS.map((step) => step.id), "review"]

const STEP_LABEL: Record<WizardStep, string> = {
  "store-info": "Store information",
  products: "Products",
  storefront: "Storefront",
  delivery: "Delivery",
  payments: "Payments",
  review: "Review",
}

/**
 * Guided activation, not a settings screen.
 *
 * Each step commits as the merchant moves on, so the progress they see on
 * the Overview is the real state of their store rather than a wizard's
 * private notion of it — and they can leave halfway and come back to
 * exactly where they stopped.
 */
export function SetupWizard() {
  const { persona, store, steps, readyToPublish, nextStep, refresh } = useOnlineStore()
  const link = useStoreLink()

  const [step, setStep] = useState<WizardStep>(() => nextStep ?? "review")
  const [info, setInfo] = useState<StoreInfo>(() =>
    store.info.name ? { ...store.info } : suggestedStoreInfo(persona)
  )
  const [storefront, setStorefront] = useState<StorefrontConfig>(() => cloneStorefront(store.storefront))
  const [delivery, setDelivery] = useState<DeliverySettings>(() => cloneDelivery(store.delivery))
  const [payments, setPayments] = useState<OnlinePaymentSettings>(() => ({ ...store.payments }))
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loadedFor, setLoadedFor] = useState(persona)

  if (persona !== loadedFor) {
    setLoadedFor(persona)
    setInfo(store.info.name ? { ...store.info } : suggestedStoreInfo(persona))
    setStorefront(cloneStorefront(store.storefront))
    setDelivery(cloneDelivery(store.delivery))
    setPayments({ ...store.payments })
    setStep(nextStep ?? "review")
  }

  const onlineRows = listingRows(persona, { publishedOnly: true })

  const problemsByStep: Record<WizardStep, string[]> = {
    "store-info": storeInfoProblems(info),
    products: onlineRows.length === 0 ? ["Choose at least one product to sell online"] : [],
    storefront: storefrontProblems(storefront),
    delivery: deliveryProblems(delivery),
    payments: paymentProblems(payments),
    review: [],
  }

  const index = STEP_ORDER.indexOf(step)
  const problems = problemsByStep[step]

  /** Write the current step's answers into the store before moving on. */
  function commit(current: WizardStep) {
    if (current === "store-info") updateOnlineStore(persona, { info })
    if (current === "storefront") updateOnlineStore(persona, { storefront })
    if (current === "delivery") updateOnlineStore(persona, { delivery })
    if (current === "payments") updateOnlineStore(persona, { payments })
    refresh()
  }

  function goNext() {
    if (problems.length > 0) return
    commit(step)
    setStep(STEP_ORDER[Math.min(index + 1, STEP_ORDER.length - 1)])
  }

  function goBack() {
    commit(step)
    setStep(STEP_ORDER[Math.max(index - 1, 0)])
  }

  function jumpTo(target: WizardStep) {
    commit(step)
    setStep(target)
  }

  function handlePublish() {
    commit(step)
    publishStore(persona, TODAY_ISO)
    refresh()
    toast.success("Your store is live", {
      description: `Customers can now shop at ${storeUrl(info.slug)}.`,
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Set up your online store"
        subtitle="Six short steps, using the products and details you already have in MyStoreGuard."
        action={
          <Button asChild variant="outline">
            <Link href={link("/online-store/online-overview")}>Save and close</Link>
          </Button>
        }
      />

      <nav aria-label="Setup steps" className="flex flex-wrap items-center gap-1 border-b pb-3">
        {STEP_ORDER.map((id, i) => {
          const done = id === "review" ? readyToPublish : steps.find((s) => s.id === id)?.done
          const active = id === step
          return (
            <button
              key={id}
              type="button"
              onClick={() => jumpTo(id)}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
              )}
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full text-[10px]",
                  active ? "bg-primary text-primary-foreground" : done ? "bg-success/20 text-success" : "bg-muted"
                )}
              >
                {done && !active ? <Check className="size-3" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{STEP_LABEL[id]}</span>
            </button>
          )
        })}
      </nav>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">{STEP_LABEL[step]}</CardTitle>
          <CardDescription>
            {step === "review"
              ? "One last look at everything before customers can see it."
              : SETUP_STEPS.find((s) => s.id === step)?.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {step === "store-info" && (
            <StoreInfoFields value={info} onChange={(patch) => setInfo((prev) => ({ ...prev, ...patch }))} />
          )}

          {step === "products" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  {onlineRows.length === 0
                    ? "Nothing chosen yet."
                    : `${onlineRows.length} ${onlineRows.length === 1 ? "product" : "products"} will be on sale online.`}
                </p>
                <Button onClick={() => setPickerOpen(true)}>
                  <Plus />
                  Choose products
                </Button>
              </div>

              {onlineRows.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
                  <PackageCheck className="size-8 text-muted-foreground" aria-hidden="true" />
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Pick from the products you already stock. You won&apos;t have to type any of them in again,
                    and their stock stays one shared number across the shop and the website.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col divide-y rounded-lg border">
                  {onlineRows.map((row) => (
                    <div key={row.product.id} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{row.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatGHS(onlinePriceOf(row.listing, row.product))} ·{" "}
                          {row.product.isService ? "Service" : `${onlineAvailable(row.listing, row.product)} available`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${row.product.name} from the store`}
                        onClick={() => {
                          unpublishProduct(persona, row.product.id)
                          refresh()
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === "storefront" && (
            <StorefrontFields
              value={storefront}
              rows={onlineRows}
              onChange={(patch) => setStorefront((prev) => ({ ...prev, ...patch }))}
            />
          )}

          {step === "delivery" && (
            <DeliveryFields value={delivery} onChange={(patch) => setDelivery((prev) => ({ ...prev, ...patch }))} />
          )}

          {step === "payments" && (
            <PaymentFields
              value={payments}
              deliveryEnabled={delivery.zones.some((zone) => zone.enabled)}
              onChange={(patch) => setPayments((prev) => ({ ...prev, ...patch }))}
            />
          )}

          {step === "review" && (
            <ReviewStep
              info={info}
              storefront={storefront}
              delivery={delivery}
              payments={payments}
              productCount={onlineRows.length}
              onJump={jumpTo}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {index > 0 && (
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft />
            Back
          </Button>
        )}
        <div className="ml-auto flex flex-col items-end gap-1">
          {problems.length > 0 && <p className="text-xs text-muted-foreground">{problems[0]}</p>}
          {step === "review" ? (
            <div className="flex gap-2">
              {info.slug && (
                <Button asChild variant="outline">
                  <Link href={link(storefrontPath(info.slug))}>
                    <Eye />
                    Preview store
                  </Link>
                </Button>
              )}
              <Button onClick={handlePublish} disabled={!readyToPublish || store.publishState === "published"}>
                <Rocket />
                {store.publishState === "published" ? "Already live" : "Publish store"}
              </Button>
            </div>
          ) : (
            <Button onClick={goNext} disabled={problems.length > 0}>
              Next
              <ArrowRight />
            </Button>
          )}
        </div>
      </div>

      {store.publishState === "published" && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-success/5 p-4">
          <StatusBadge label="Published" />
          <p className="text-sm">
            Your store is live at{" "}
            <Link href={link(storefrontPath(info.slug))} className="font-medium text-primary hover:underline">
              {storeUrl(info.slug)}
            </Link>
            .
          </p>
          <Button asChild variant="outline" size="sm" className="ml-auto">
            <Link href={link("/online-store/online-overview")}>Go to your store dashboard</Link>
          </Button>
        </div>
      )}

      <PublishProductsDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        persona={persona}
        onPublish={(ids) => {
          publishProducts(persona, ids)
          setPickerOpen(false)
          refresh()
          toast.success(ids.length > 1 ? `${ids.length} products added` : "Product added", {
            description: "They'll show on your store once it's published.",
          })
        }}
      />
    </div>
  )
}

function ReviewStep({
  info,
  storefront,
  delivery,
  payments,
  productCount,
  onJump,
}: {
  info: StoreInfo
  storefront: StorefrontConfig
  delivery: DeliverySettings
  payments: OnlinePaymentSettings
  productCount: number
  onJump: (step: WizardStep) => void
}) {
  const zones = delivery.zones.filter((zone) => zone.enabled)
  const methods = [
    payments.momo && "Mobile money",
    payments.bankTransfer && "Bank transfer",
    payments.cashOnDelivery && "Cash on delivery",
  ].filter(Boolean) as string[]

  const blocks: { step: WizardStep; title: string; lines: string[] }[] = [
    {
      step: "store-info",
      title: "Store information",
      lines: [info.name || "—", storeUrl(info.slug), info.phone, info.email].filter(Boolean),
    },
    {
      step: "products",
      title: "Products",
      lines: [`${productCount} ${productCount === 1 ? "product" : "products"} on sale online`],
    },
    {
      step: "storefront",
      title: "Storefront",
      lines: [
        storefront.headline || "—",
        `${storefront.featuredProductIds.length} featured`,
        `${storefront.collections.length} ${storefront.collections.length === 1 ? "collection" : "collections"}`,
      ],
    },
    {
      step: "delivery",
      title: "Delivery",
      lines: [
        zones.length > 0 ? zones.map((zone) => `${zone.area} ${formatGHS(zone.fee)}`).join(" · ") : "No delivery areas",
        delivery.pickupEnabled ? "Customers can collect from the shop" : "No collection",
        delivery.freeDeliveryOver > 0 ? `Free over ${formatGHS(delivery.freeDeliveryOver)}` : "Delivery always charged",
      ],
    },
    {
      step: "payments",
      title: "Payments",
      lines: methods.length > 0 ? methods : ["No payment methods"],
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block) => (
        <div key={block.step} className="flex items-start justify-between gap-4 rounded-lg border p-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{block.title}</p>
            <div className="flex flex-wrap gap-1.5">
              {block.lines.map((line) => (
                <Badge key={line} variant="secondary" className="font-normal">
                  {line}
                </Badge>
              ))}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onJump(block.step)}>
            Change
          </Button>
        </div>
      ))}
    </div>
  )
}

function cloneStorefront(config: StorefrontConfig): StorefrontConfig {
  return {
    ...config,
    featuredProductIds: [...config.featuredProductIds],
    collections: config.collections.map((collection) => ({ ...collection, productIds: [...collection.productIds] })),
  }
}

function cloneDelivery(settings: DeliverySettings): DeliverySettings {
  return { ...settings, zones: settings.zones.map((zone) => ({ ...zone })) }
}
