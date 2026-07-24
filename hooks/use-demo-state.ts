"use client"

import { useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import type { EstimatorLocation, MessageLocation, Tier } from "@/lib/modules"
import type { StaffRole } from "@/lib/mock-data"

export type NavStructure = "flat" | "grouped"
export type LockMode = "hidden" | "greyed"
export type StoreState = "established" | "new"
export type StorePersona = "adwoa" | "larry"

export interface DemoState {
  nav: NavStructure
  tier: Tier
  lockMode: LockMode
  estimatorLocation: EstimatorLocation
  messageLocation: MessageLocation
  storeState: StoreState
  storePersona: StorePersona
  /** "Viewing as role" — demonstrates the permission model live (see lib/permissions-data.ts). */
  role: StaffRole
  /**
   * Off by default so a shared link never exposes the demo-controls panel
   * (unreleased tier gating, every plan's features) to a real visitor — see
   * ID-12 in the July 2026 QA audit. Sticky: once ?demo=1 is set, it's
   * preserved through every subsequent update() call, not just the first
   * page load.
   */
  demoMode: boolean
}

export const STORE_PERSONA_LABEL: Record<StorePersona, { name: string; location: string }> = {
  adwoa: { name: "Adwoa's Provisions", location: "Makola, Accra" },
  larry: { name: "Larry's Curtains & Décor", location: "East Legon, Accra" },
}

export const DEMO_DEFAULTS: DemoState = {
  nav: "grouped",
  tier: "ultra",
  lockMode: "greyed",
  estimatorLocation: "sell",
  messageLocation: "grow",
  storeState: "established",
  storePersona: "adwoa",
  role: "Owner",
  demoMode: false,
}

function parse(searchParams: URLSearchParams): DemoState {
  const nav = searchParams.get("nav")
  const tier = searchParams.get("tier")
  const lockMode = searchParams.get("lock")
  const estimatorLocation = searchParams.get("estimator")
  const messageLocation = searchParams.get("message")
  const storeState = searchParams.get("store")
  const storePersona = searchParams.get("persona")
  const role = searchParams.get("role")
  const demoMode = searchParams.get("demo")

  return {
    nav: nav === "flat" ? "flat" : DEMO_DEFAULTS.nav,
    tier: tier === "prime" || tier === "ultra" || tier === "light" ? tier : DEMO_DEFAULTS.tier,
    lockMode: lockMode === "hidden" ? "hidden" : DEMO_DEFAULTS.lockMode,
    estimatorLocation: estimatorLocation === "system" ? "system" : DEMO_DEFAULTS.estimatorLocation,
    messageLocation: messageLocation === "bottom" ? "bottom" : DEMO_DEFAULTS.messageLocation,
    storeState: storeState === "new" ? "new" : DEMO_DEFAULTS.storeState,
    storePersona: storePersona === "larry" ? "larry" : DEMO_DEFAULTS.storePersona,
    role: role === "Manager" || role === "Cashier" || role === "Stockkeeper" ? role : DEMO_DEFAULTS.role,
    demoMode: demoMode === "1" || demoMode === "true" ? true : DEMO_DEFAULTS.demoMode,
  }
}

export function demoStateToParams(state: DemoState): URLSearchParams {
  const params = new URLSearchParams()

  if (state.nav !== DEMO_DEFAULTS.nav) params.set("nav", state.nav)
  if (state.tier !== DEMO_DEFAULTS.tier) params.set("tier", state.tier)
  if (state.lockMode !== DEMO_DEFAULTS.lockMode) params.set("lock", state.lockMode)
  if (state.estimatorLocation !== DEMO_DEFAULTS.estimatorLocation) params.set("estimator", state.estimatorLocation)
  if (state.messageLocation !== DEMO_DEFAULTS.messageLocation) params.set("message", state.messageLocation)
  if (state.storeState !== DEMO_DEFAULTS.storeState) params.set("store", state.storeState)
  if (state.storePersona !== DEMO_DEFAULTS.storePersona) params.set("persona", state.storePersona)
  if (state.role !== DEMO_DEFAULTS.role) params.set("role", state.role)
  if (state.demoMode !== DEMO_DEFAULTS.demoMode) params.set("demo", "1")

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
