import { StocktakeScreen } from "@/components/stocktake/stocktake-screen"
import { Toaster } from "@/components/ui/sonner"
import { getStocktakesStore, getLarryStocktakesStore } from "@/lib/stocktakes-data"

export function generateStaticParams() {
  const ids = [...getStocktakesStore(), ...getLarryStocktakesStore()].map((st) => st.id)
  return ids.map((id) => ({ id }))
}

export const metadata = {
  title: "Stocktake — MyStoreGuard",
}

export default async function StocktakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <>
      <StocktakeScreen stocktakeId={id} />
      <Toaster />
    </>
  )
}
