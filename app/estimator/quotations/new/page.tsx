import { CreateQuotationScreen } from "@/components/estimator/create-quotation-screen"
import { Toaster } from "@/components/ui/sonner"

export const metadata = {
  title: "New quotation — MyStoreGuard",
}

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; fromAppointmentId?: string; customerName?: string; customerPhone?: string }>
}) {
  const { edit, fromAppointmentId, customerName, customerPhone } = await searchParams

  return (
    <>
      <CreateQuotationScreen
        editId={edit}
        fromAppointmentId={fromAppointmentId}
        prefillCustomerName={customerName}
        prefillCustomerPhone={customerPhone}
      />
      <Toaster />
    </>
  )
}
