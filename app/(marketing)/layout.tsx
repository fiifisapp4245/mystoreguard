import { Suspense } from "react"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-svh flex-col">
      <Suspense fallback={null}>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </Suspense>
    </div>
  )
}
