"use client"

import { useParams } from "next/navigation"

import { StorefrontProduct } from "@/components/storefront/storefront-product"

/** Reads the product id client-side, for the same reason the layout does — see app/store/[slug]/layout.tsx. */
export function StorefrontProductRoute() {
  const params = useParams<{ productId: string }>()
  const productId = typeof params.productId === "string" ? params.productId : ""

  return <StorefrontProduct productId={productId} />
}
