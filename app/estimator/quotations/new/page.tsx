import { CreateQuotationScreen } from "@/components/estimator/create-quotation-screen"
import { Toaster } from "@/components/ui/sonner"

export const metadata = {
  title: "New quotation — MyStoreGuard",
}

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const { edit } = await searchParams

  return (
    <>
      <CreateQuotationScreen editId={edit} />
      <Toaster />
    </>
  )
}
