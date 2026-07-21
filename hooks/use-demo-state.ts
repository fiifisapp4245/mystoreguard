"use client"

import { useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import type { EstimatorLocation, MessageLocation, Tier } from "@/lib/modules"

export type NavStructure = "flat" | "grouped"
export type LockMode = "hidden" | "greyed"

export interface DemoState {
  nav: NavStructure
  tier: Tier
  lockMode: LockMode
  estimatorLocation: EstimatorLocation
  messageLocation: MessageLocation
}

export const DEMO_DEFAULTS: DemoState = {
  nav: "grouped",
  tier: "light",
  lockMode: "greyed",
  estimatorLocation: "sell",
  messageLocation: "grow",
}

function parse(searchParams: URLSearchParams): DemoState {
  const nav = searchParams.get("nav")
  const tier = searchParams.get("tier")
  const lockMode = searchParams.get("lock")
  const estimatorLocation = searchParams.get("estimator")
  const messageLocation = searchParams.get("message")

  return {
    nav: nav === "flat" ? "flat" : DEMO_DEFAULTS.nav,
    tier: tier === "prime" || tier === "ultra" || tier === "light" ? tier : DEMO_DEFAULTS.tier,
    lockMode: lockMode === "hidden" ? "hidden" : DEMO_DEFAULTS.lockMode,
    estimatorLocation: estimatorLocation === "system" ? "system" : DEMO_DEFAULTS.estimatorLocation,
    messageLocation: messageLocation === "bottom" ? "bottom" : DEMO_DEFAULTS.messageLocation,
  }
}

export function demoStateToParams(state: DemoState): URLSearchParams {
  const params = new URLSearchParams()

  if (state.nav !== DEMO_DEFAULTS.nav) params.set("nav", state.nav)
  if (state.tier !== DEMO_DEFAULTS.tier) params.set("tier", state.tier)
  if (state.lockMode !== DEMO_DEFAULTS.lockMode) params.set("lock", state.lockMode)
  if (state.estimatorLocation !== DEMO_DEFAULTS.estimatorLocation) params.set("estimator", state.estimatorLocation)
  if (state.messageLocation !== DEMO_DEFAULTS.messageLocation) params.set("message", state.messageLocation)

  return params
}

export function useDemoState() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const state = useMemo(() => parse(searchParams), [searchParams])

  const update = useCallback(
    (patch: Partial<DemoState>) => {
      const next = { ...state, ...patch }
      const qs = demoStateToParams(next).toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, state]
  )

  return { state, update }
}
