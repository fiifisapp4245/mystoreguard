"use client"

import { useCallback, useEffect, useState } from "react"

export interface DashboardWidgets {
  revenue: boolean
  itemsSold: boolean
  expenses: boolean
  profit: boolean
  chart: boolean
  recentSales: boolean
}

export const DEFAULT_WIDGETS: DashboardWidgets = {
  revenue: true,
  itemsSold: true,
  expenses: true,
  profit: true,
  chart: true,
  recentSales: true,
}

const STORAGE_KEY = "mystoreguard.dashboard-widgets"

/** Which dashboard widgets to show, remembered per-browser via localStorage — there's no backend to persist this to. */
export function useDashboardWidgets() {
  const [widgets, setWidgets] = useState<DashboardWidgets>(DEFAULT_WIDGETS)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) setWidgets({ ...DEFAULT_WIDGETS, ...JSON.parse(stored) })
    } catch {
      // Malformed or inaccessible storage — fall back to defaults.
    }
  }, [])

  const toggle = useCallback((key: keyof DashboardWidgets) => {
    setWidgets((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Storage unavailable (e.g. private browsing) — state still updates for this session.
      }
      return next
    })
  }, [])

  return { widgets, toggle }
}
