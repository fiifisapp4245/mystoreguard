"use client"

import { useParams } from "next/navigation"

import { StorefrontProvider } from "@/components/storefront/storefront-provider"
import { StorefrontShell } from "@/components/storefront/storefront-shell"

/**
 * One store's chrome and basket, shared by every page under it — so moving
 * between the shop, a product and checkout never loses what's in the basket.
 *
 * The slug is read with useParams rather than the route's params prop
 * because the store's configuration lives in the client-side prototype
 * stores (see lib/online-store-data.ts), which the server can't resolve.
 */
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ slug: string }>()
  const slug = typeof params.slug === "string" ? params.slug : ""

  return (
    <StorefrontProvider slug={slug}>
      <StorefrontShell>{children}</StorefrontShell>
    </StorefrontProvider>
  )
}
