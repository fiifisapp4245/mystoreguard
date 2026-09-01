"use client"

import { useCallback, useState } from "react"
import { useSearchParams } from "next/navigation"

import { useDemoState } from "@/hooks/use-demo-state"
import { publishedCount } from "@/lib/online-listings-data"
import {
  getOnlineStore,
  getSetupState,
  getStoreStatus,
  setupProgress,
  canPublish,
  firstOutstandingStep,
  type OnlineStore,
  type SetupStepState,
  type StoreStatus,
} from "@/lib/online-store-data"

/**
 * One read of the online store for whichever business is being viewed, plus
 * the derived setup state every online screen needs.
 *
 * The stores in lib/ are plain module-level objects (the prototype's
 * convention — see lib/pos-data.ts), so mutating one doesn't tell React
 * anything. `refresh()` is how a screen says "I've just changed something,
 * read it again" — the same shape as the persist()/setState pairs the
 * existing tabs use, lifted into one place so seven screens don't each
 * reinvent it.
 */
/**
 * Builds an in-app link that carries the current demo state forward — the
 * same `searchParams.toString()` approach HubTabsNav uses. It matters here
 * more than elsewhere: the persona decides *which business's* store you're
 * looking at, so a link that drops it would quietly switch shops.
 */
export function useStoreLink(): (path: string) => string {
  const searchParams = useSearchParams()
  const qs = searchParams.toString()
  return useCallback((path: string) => (qs ? `${path}?${qs}` : path), [qs])
}

export function useOnlineStore() {
  const { state } = useDemoState()
  const persona = state.storePersona
  const [, setVersion] = useState(0)

  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  // Read on every render rather than memoising: these are a handful of
  // object lookups, and caching them against a mutable module-level store
  // would only make them stale. refresh() is what forces the re-render.
  const store: OnlineStore = getOnlineStore(persona)
  const steps: SetupStepState[] = getSetupState(persona, publishedCount(persona))
  const status: StoreStatus = getStoreStatus(persona, steps)

  return {
    persona,
    refresh,
    store,
    steps,
    status,
    progress: setupProgress(steps),
    readyToPublish: canPublish(steps),
    nextStep: firstOutstandingStep(steps),
  }
}
