"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { StatusBadge } from "@/components/dashboard/status-badge"
import { TeachingEmptyState } from "@/components/dashboard/teaching-empty-state"
import { HelpPanelTrigger } from "@/components/help/help-panel-trigger"
import { StartCountDialog } from "@/components/hubs/stock/start-count-dialog"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatGHS, getVisibleLocations, LOCATIONS } from "@/lib/mock-data"
import { LARRY_LOCATIONS, getLarryProductsStore } from "@/lib/larry-data"
import { getProductsStore, type Product } from "@/lib/pos-data"
import {
  getStocktakesStore,
  getLarryStocktakesStore,
  netVarianceValue,
  varianceCount,
  type Stocktake,
  type StocktakeStatus,
} from "@/lib/stocktakes-data"
import { isMultiLocationTier } from "@/lib/modules"
import { useDemoState } from "@/hooks/use-demo-state"

function statusTone(status: StocktakeStatus): "success" | "warning" | "neutral" {
  if (status === "Posted") return "success"
  if (status === "In progress") return "warning"
  return "neutral"
}

export function StocktakesTab() {
  const { state } = useDemoState()
  const router = useRouter()
  const isLarry = state.storePersona === "larry"
  const isMultiLocation = isMultiLocationTier(state.tier)
  const userName = "Adjoa Boateng"

  const locations = isLarry ? LARRY_LOCATIONS : LOCATIONS
  const visibleLocations = getVisibleLocations(locations, isMultiLocation)
  const products: Product[] = isLarry ? getLarryProductsStore() : getProductsStore()

  const [stocktakes, setStocktakes] = useState<Stocktake[]>(() => (isLarry ? getLarryStocktakesStore() : getStocktakesStore()))
  const [prevIsLarry, setPrevIsLarry] = useState(isLarry)
  if (isLarry !== prevIsLarry) {
    setPrevIsLarry(isLarry)
    setStocktakes(isLarry ? getLarryStocktakesStore() : getStocktakesStore())
  }

  const [startOpen, setStartOpen] = useState(false)

  const sorted = useMemo(
    () => [...stocktakes].sort((a, b) => (a.startedDateISO < b.startedDateISO ? 1 : -1)),
    [stocktakes]
  )

  function locationName(id: string) {
    return locations.find((l) => l.id === id)?.name ?? id
  }

  function handleRowClick(stocktake: Stocktake) {
    router.push(`/stocktake/${stocktake.id}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {isMultiLocation ? "All locations" : visibleLocations[0]?.name}
        </span>
        <div className="flex items-center gap-2">
          <HelpPanelTrigger screenKey="stocktake" />
          <Button onClick={() => setStartOpen(true)}>
            <Plus />
            Start a count
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <TeachingEmptyState
          message="A stocktake compares what's on your shelves against what the system says you have — it's how you catch theft, damage and recording mistakes."
          actionLabel="Start your first count"
          onAction={() => setStartOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Count no.</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Started by</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Variances</TableHead>
                <TableHead>Net variance value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((st) => {
                const variances = varianceCount(st, products)
                const netValue = netVarianceValue(st, products)
                return (
                  <TableRow key={st.id} className="cursor-pointer" onClick={() => handleRowClick(st)}>
                    <TableCell className="font-medium">{st.id}</TableCell>
                    <TableCell>
                      {locationName(st.locationId)} · {st.scope}
                      {st.scopeDetail ? ` — ${st.scopeDetail}` : ""}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{st.startedBy}</TableCell>
                    <TableCell className="text-muted-foreground">{st.startedDateISO}</TableCell>
                    <TableCell>
                      <StatusBadge label={st.status} tone={statusTone(st.status)} />
                    </TableCell>
                    <TableCell>{st.status === "Discarded" ? "—" : variances}</TableCell>
                    <TableCell className={netValue < 0 ? "text-destructive" : netValue > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                      {st.status === "Discarded" ? "—" : formatGHS(netValue)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <StartCountDialog
        open={startOpen}
        onOpenChange={setStartOpen}
        locations={locations}
        products={products}
        isMultiLocation={isMultiLocation}
        isLarry={isLarry}
        userName={userName}
      />
    </div>
  )
}
