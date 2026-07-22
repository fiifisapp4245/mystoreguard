import { Suspense } from "react"

import { Shell } from "@/components/shell"
import { Toaster } from "@/components/ui/sonner"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Suspense fallback={null}>
      <Shell>{children}</Shell>
      <Toaster />
    </Suspense>
  )
}
