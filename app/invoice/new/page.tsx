import { CreateInvoiceScreen } from "@/components/invoice/create-invoice-screen"
import { Toaster } from "@/components/ui/sonner"

export const metadata = {
  title: "New invoice — MyStoreGuard",
}

export default function NewInvoicePage() {
  return (
    <>
      <CreateInvoiceScreen />
      <Toaster />
    </>
  )
}
