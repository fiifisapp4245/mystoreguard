"use client"

import { useState } from "react"
import Link from "next/link"
import { ExternalLink, Pause, Play, Rocket } from "lucide-react"
import { toast } from "sonner"

import { StatusBadge } from "@/components/dashboard/status-badge"
import { DeliveryFields, deliveryProblems } from "@/components/online-store/sections/delivery-fields"
import { PaymentFields, paymentProblems } from "@/components/online-store/sections/payment-fields"
import { StoreInfoFields, storeInfoProblems } from "@/components/online-store/sections/store-info-fields"
import { StoreAddressLine } from "@/components/online-store/store-status-card"
import { SettingsSectionCard } from "@/components/settings/settings-section-card"
import { Button } from "@/components/ui/button"
import { useOnlineStore, useStoreLink } from "@/hooks/use-online-store"
import {
  pauseStore,
  publishStore,
  resumeStore,
  storefrontPath,
  updateOnlineStore,
  type DeliverySettings,
  type OnlinePaymentSettings,
  type StoreInfo,
} from "@/lib/online-store-data"
import { TODAY_ISO } from "@/lib/period-utils"

/**
 * The same three forms as the setup flow, one section at a time. Setup is
 * for activation; this is for the hundredth time a merchant changes a
 * delivery charge — so it saves per section rather than marching through
 * every step again.
 */
export function OnlineSettingsTab() {
  const { persona, store, steps, status, progress, readyToPublish, refresh } = useOnlineStore()
  const link = useStoreLink()

  const [info, setInfo] = useState<StoreInfo>(() => ({ ...store.info }))
  const [delivery, setDelivery] = useState<DeliverySettings>(() => cloneDelivery(store.delivery))
  const [payments, setPayments] = useState<OnlinePaymentSettings>(() => ({ ...store.payments }))
  const [loadedFor, setLoadedFor] = useState(persona)

  if (persona !== loadedFor) {
    setLoadedFor(persona)
    setInfo({ ...store.info })
    setDelivery(cloneDelivery(store.delivery))
    setPayments({ ...store.payments })
  }

  const infoProblems = storeInfoProblems(info)
  const zoneProblems = deliveryProblems(delivery)
  const payProblems = paymentProblems(payments)

  const infoDirty = JSON.stringify(info) !== JSON.stringify(store.info)
  const deliveryDirty = JSON.stringify(delivery) !== JSON.stringify(store.delivery)
  const paymentsDirty = JSON.stringify(payments) !== JSON.stringify(store.payments)

  function saveInfo() {
    if (infoProblems.length > 0) return
    updateOnlineStore(persona, { info })
    refresh()
    toast.success("Store information saved")
  }

  function saveDelivery() {
    if (zoneProblems.length > 0) return
    updateOnlineStore(persona, { delivery })
    refresh()
    toast.success("Delivery saved")
  }

  function savePayments() {
    if (payProblems.length > 0) return
    updateOnlineStore(persona, { payments })
    refresh()
    toast.success("Payment methods saved")
  }

  function handlePublish() {
    publishStore(persona, TODAY_ISO)
    refresh()
    toast.success("Your store is live", { description: "Customers can find it and place orders." })
  }

  return (
    <div className="flex flex-col gap-4">
      <SettingsSectionCard
        title="Store status"
        description="Whether customers can find your store and place orders right now."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <StatusBadge label={status} />
            <StoreAddressLine store={store} />
            {status !== "Published" && (
              <p className="text-sm text-muted-foreground">
                {progress.done} of {progress.total} setup steps done.{" "}
                {!readyToPublish && (
                  <>Still needed: {steps.filter((step) => !step.done).map((step) => step.label.toLowerCase()).join(", ")}.</>
                )}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {store.info.slug && (
              <Button asChild variant="outline">
                <Link href={link(storefrontPath(store.info.slug))}>
                  <ExternalLink />
                  {store.publishState === "published" ? "View store" : "Preview store"}
                </Link>
              </Button>
            )}
            {store.publishState === "published" && (
              <Button
                variant="outline"
                onClick={() => {
                  pauseStore(persona)
                  refresh()
                  toast.success("Store paused", { description: "Customers can't place orders until you resume." })
                }}
              >
                <Pause />
                Pause store
              </Button>
            )}
            {store.publishState === "paused" && (
              <Button
                onClick={() => {
                  resumeStore(persona)
                  refresh()
                  toast.success("Store is live again")
                }}
              >
                <Play />
                Take orders again
              </Button>
            )}
            {store.publishState === "unpublished" &&
              (readyToPublish ? (
                <Button onClick={handlePublish}>
                  <Rocket />
                  Publish store
                </Button>
              ) : (
                <Button asChild>
                  <Link href={link("/online-store/setup")}>Continue setup</Link>
                </Button>
              ))}
          </div>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Store information"
        description="Your store's name, web address, and how customers reach you."
      >
        <StoreInfoFields value={info} onChange={(patch) => setInfo((prev) => ({ ...prev, ...patch }))} />
        <SaveRow
          dirty={infoDirty}
          problems={infoProblems}
          onSave={saveInfo}
          onDiscard={() => setInfo({ ...store.info })}
        />
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Delivery"
        description="Where you deliver, what you charge, and whether customers can collect."
      >
        <DeliveryFields value={delivery} onChange={(patch) => setDelivery((prev) => ({ ...prev, ...patch }))} />
        <SaveRow
          dirty={deliveryDirty}
          problems={zoneProblems}
          onSave={saveDelivery}
          onDiscard={() => setDelivery(cloneDelivery(store.delivery))}
        />
      </SettingsSectionCard>

      <SettingsSectionCard title="Payments" description="How customers pay you online.">
        <PaymentFields
          value={payments}
          deliveryEnabled={delivery.zones.some((zone) => zone.enabled)}
          onChange={(patch) => setPayments((prev) => ({ ...prev, ...patch }))}
        />
        <SaveRow
          dirty={paymentsDirty}
          problems={payProblems}
          onSave={savePayments}
          onDiscard={() => setPayments({ ...store.payments })}
        />
      </SettingsSectionCard>
    </div>
  )
}

function SaveRow({
  dirty,
  problems,
  onSave,
  onDiscard,
}: {
  dirty: boolean
  problems: string[]
  onSave: () => void
  onDiscard: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t pt-4">
      <Button onClick={onSave} disabled={!dirty || problems.length > 0}>
        Save
      </Button>
      {dirty && (
        <Button variant="outline" onClick={onDiscard}>
          Discard
        </Button>
      )}
      {problems.length > 0 && <p className="text-xs text-muted-foreground">{problems[0]}</p>}
    </div>
  )
}

function cloneDelivery(settings: DeliverySettings): DeliverySettings {
  return { ...settings, zones: settings.zones.map((zone) => ({ ...zone })) }
}
