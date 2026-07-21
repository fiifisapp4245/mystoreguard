"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"

import { resolveSiteConfig, type SiteConfig } from "@/lib/site-config"

/** Reads ?cta=&prices=&currency= from the URL and merges them onto the default siteConfig. */
export function useSiteConfig(): SiteConfig {
  const searchParams = useSearchParams()
  return useMemo(() => resolveSiteConfig(searchParams), [searchParams])
}
