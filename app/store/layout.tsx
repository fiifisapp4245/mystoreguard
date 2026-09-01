import { Toaster } from "@/components/ui/sonner"

export const metadata = {
  title: "Online store — MyStoreGuard",
}

/**
 * The customer-facing storefront sits outside the dashboard shell — no
 * sidebar, no demo chrome — the same way /register does. It keeps the app's
 * theme tokens and components, so it looks like the same product without
 * looking like the back office.
 */
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}
