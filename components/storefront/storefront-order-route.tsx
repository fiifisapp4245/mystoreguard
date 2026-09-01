"use client"

import { useParams } from "next/navigation"

import { StorefrontOrder } from "@/components/storefront/storefront-order"

/** Reads the order id client-side, for the same reason the layout does — see app/store/[slug]/layout.tsx. */
export function StorefrontOrderRoute() {
  const params = useParams<{ orderId: string }>()
  const orderId = typeof params.orderId === "string" ? params.orderId : ""

  return <StorefrontOrder orderId={orderId} />
}
