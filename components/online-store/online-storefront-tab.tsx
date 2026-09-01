"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye } from "lucide-react"
import { toast } from "sonner"

import { SettingsSectionCard } from "@/components/settings/settings-section-card"
import { StorefrontFields, storefrontProblems } from "@/components/online-store/sections/storefront-fields"
import { TeachingEmptyState } from "@/components/dashboard/teaching-empty-state"
import { Button } from "@/components/ui/button"
import { useOnlineStore, useStoreLink } from "@/hooks/use-online-store"
import { listingRows } from "@/lib/online-listings-data"
import { storefrontPath, updateOnlineStore, type StorefrontConfig } from "@/lib/online-store-data"
import { PackageCheck } from "lucide-react"

export function OnlineStorefrontTab() {
  const { persona, store, refresh } = useOnlineStore()
  const link = useStoreLink()
  const [draft, setDraft] = useState<StorefrontConfig>(() => structuredCloneConfig(store.storefront))
  const [savedFor, setSavedFor] = useState(persona)

  // The persona toggle swaps the whole business — reload the draft with it.
  if (persona !== savedFor) {
    setSavedFor(persona)
    setDraft(structuredCloneConfig(store.storefront))
  }

  const rows = listingRows(persona, { publishedOnly: true })
  const problems = storefrontProblems(draft)
  const dirty = JSON.stringify(draft) !== JSON.stringify(store.storefront)

  function handleSave() {
    if (problems.length > 0) return
    updateOnlineStore(persona, { storefront: draft })
    refresh()
    toast.success("Storefront saved", { description: "Customers see the change straight away." })
  }

  if (rows.length === 0) {
    return (
      <TeachingEmptyState
        icon={PackageCheck}
        message="Choose some products to sell online first — the storefront is how you arrange them for customers."
        actionLabel="Sell products online"
        actionHref={link("/online-store/online-products")}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <SettingsSectionCard
        title="Storefront"
        description="What customers see when they land on your store."
      >
        <StorefrontFields
          value={draft}
          rows={rows}
          onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
        />
      </SettingsSectionCard>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleSave} disabled={!dirty || problems.length > 0}>
          Save storefront
        </Button>
        {dirty && (
          <Button variant="outline" onClick={() => setDraft(structuredCloneConfig(store.storefront))}>
            Discard changes
          </Button>
        )}
        {store.info.slug && (
          <Button asChild variant="outline" className="ml-auto">
            <Link href={link(storefrontPath(store.info.slug))}>
              <Eye />
              {store.publishState === "published" ? "View store" : "Preview store"}
            </Link>
          </Button>
        )}
        {problems.length > 0 && <p className="text-xs text-muted-foreground">{problems[0]}</p>}
      </div>
    </div>
  )
}

/** Deep copy so editing a draft never mutates the saved config in place. */
function structuredCloneConfig(config: StorefrontConfig): StorefrontConfig {
  return {
    ...config,
    featuredProductIds: [...config.featuredProductIds],
    collections: config.collections.map((collection) => ({ ...collection, productIds: [...collection.productIds] })),
  }
}
