"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ScanLine } from "lucide-react"
import { toast } from "sonner"

import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatGHS, LOCATIONS } from "@/lib/mock-data"
import { LARRY_LOCATIONS, getLarryProductsStore } from "@/lib/larry-data"
import { getProductsStore } from "@/lib/pos-data"
import {
  countedProgress,
  discardStocktake,
  getStocktakesStore,
  getLarryStocktakesStore,
  postStocktake,
  reviewLines,
  saveCountProgress,
  setVarianceReason,
  VARIANCE_REASONS,
  type Stocktake,
  type StocktakeCountLine,
} from "@/lib/stocktakes-data"

type Mode = "count" | "review"

export function StocktakeScreen({ stocktakeId }: { stocktakeId: string }) {
  const router = useRouter()

  const resolved = useMemo(() => {
    const adwoa = getStocktakesStore().find((st) => st.id === stocktakeId)
    if (adwoa) return { stocktake: adwoa, isLarry: false }
    const larry = getLarryStocktakesStore().find((st) => st.id === stocktakeId)
    if (larry) return { stocktake: larry, isLarry: true }
    return null
  }, [stocktakeId])

  const isLarry = resolved?.isLarry ?? false
  const locations = isLarry ? LARRY_LOCATIONS : LOCATIONS
  const productStore = useCallback(() => (isLarry ? getLarryProductsStore() : getProductsStore()), [isLarry])
  const stocktakeStore = useCallback(() => (isLarry ? getLarryStocktakesStore() : getStocktakesStore()), [isLarry])

  const [stocktake, setStocktake] = useState<Stocktake | null>(resolved?.stocktake ?? null)
  const [mode, setMode] = useState<Mode>(resolved?.stocktake.status === "In progress" ? "count" : "review")
  const [counts, setCounts] = useState<Record<string, string>>(() =>
    Object.fromEntries((resolved?.stocktake.counts ?? []).map((c) => [c.productId, c.countedQty !== undefined ? String(c.countedQty) : ""]))
  )
  const [reasons, setReasons] = useState<Record<string, { reason: string; note: string }>>(() =>
    Object.fromEntries((resolved?.stocktake.varianceReasons ?? []).map((v) => [v.productId, { reason: v.reason, note: v.note ?? "" }]))
  )
  const [scanValue, setScanValue] = useState("")
  const scanRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode === "count") requestAnimationFrame(() => scanRef.current?.focus())
  }, [mode])

  if (!stocktake) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">Stocktake not found.</p>
        <Button variant="outline" onClick={() => router.push("/stock/stocktakes")}>
          Back to stocktakes
        </Button>
      </div>
    )
  }

  const locationName = locations.find((l) => l.id === stocktake.locationId)?.name ?? stocktake.locationId
  const progress = countedProgress(stocktake)

  function updateCount(productId: string, value: string) {
    setCounts((prev) => ({ ...prev, [productId]: value }))
  }

  function persistCounts(): StocktakeCountLine[] {
    const lines: StocktakeCountLine[] = stocktake!.snapshot.map((s) => ({
      productId: s.productId,
      countedQty: counts[s.productId]?.trim() ? Number.parseFloat(counts[s.productId]) : undefined,
    }))
    saveCountProgress(isLarry, stocktake!.id, lines)
    return lines
  }

  function handleScanSubmit() {
    const trimmed = scanValue.trim()
    if (!trimmed) return
    const product = productStore().find((p) => p.barcode === trimmed && p.isActive)
    if (!product) {
      toast.error("Barcode not recognised")
      setScanValue("")
      return
    }
    const inScope = stocktake!.snapshot.some((s) => s.productId === product.id)
    if (!inScope) {
      toast.error(`${product.name} isn't part of this count's scope`)
      setScanValue("")
      return
    }
    setCounts((prev) => {
      const current = prev[product.id]?.trim() ? Number.parseFloat(prev[product.id]) : 0
      return { ...prev, [product.id]: String(current + 1) }
    })
    setScanValue("")
  }

  function handleSaveAndExit() {
    persistCounts()
    toast.success("Progress saved", { description: "Resume this count any time from Stocktakes." })
    router.push("/stock/stocktakes")
  }

  function handleGoToReview() {
    persistCounts()
    setStocktake({ ...stocktake!, counts: stocktakeStore().find((s) => s.id === stocktake!.id)?.counts ?? [] })
    setMode("review")
  }

  const liveStocktake = stocktakeStore().find((s) => s.id === stocktake.id) ?? stocktake
  const lines = reviewLines(liveStocktake, productStore).filter((l) => l.counted !== undefined && l.variance !== 0)
  const products = productStore()
  const netValue = lines.reduce((sum, l) => {
    const product = products.find((p) => p.id === l.productId)
    return sum + (l.variance ?? 0) * (product?.costPrice ?? 0)
  }, 0)

  const isLocked = stocktake.status !== "In progress"
  const unreasonedCount = lines.filter((l) => !reasons[l.productId]?.reason).length
  const allReasoned = unreasonedCount === 0

  function handlePost() {
    if (!allReasoned) {
      toast.error("Every variance needs a reason before posting.")
      return
    }
    for (const line of lines) {
      const r = reasons[line.productId]
      setVarianceReason(isLarry, stocktake!.id, line.productId, r.reason, r.note.trim() || undefined)
    }
    postStocktake(isLarry, stocktake!.id)
    toast.success("Stocktake posted", { description: "Stock levels now match the count." })
    router.push("/stock/stocktakes")
  }

  function handleDiscard() {
    discardStocktake(isLarry, stocktake!.id)
    toast.success("Stocktake discarded")
    router.push("/stock/stocktakes")
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/stock/stocktakes")} aria-label="Back">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <p className="font-heading text-lg font-medium">{stocktake.id}</p>
            <p className="text-sm text-muted-foreground">
              {locationName} · {stocktake.scope}
              {stocktake.scopeDetail ? ` — ${stocktake.scopeDetail}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stocktake.blindCount && <StatusBadge label="Blind count" tone="neutral" />}
          <StatusBadge label={stocktake.status} />
        </div>
      </div>

      {mode === "count" && !isLocked && (
        <div className="flex flex-col gap-4">
          <div className="relative">
            <ScanLine className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={scanRef}
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScanSubmit()}
              placeholder="Scan barcode — each scan adds one unit" aria-label="Scan barcode — each scan adds one unit"
              className="pl-9"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(progress.counted / Math.max(1, progress.total)) * 100}%` }} />
            </div>
            <span className="shrink-0 text-sm text-muted-foreground">
              {progress.counted} of {progress.total} counted
            </span>
          </div>

          <div className="flex flex-col divide-y rounded-xl border">
            {stocktake.snapshot.map((snap) => (
              <div key={snap.productId} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{snap.productName}</p>
                  {!stocktake.blindCount && (
                    <p className="text-xs text-muted-foreground">System qty: {snap.systemQtyAtSnapshot}</p>
                  )}
                </div>
                <Input
                  type="number"
                  min="0"
                  value={counts[snap.productId] ?? ""}
                  onChange={(e) => updateCount(snap.productId, e.target.value)}
                  placeholder="Count" aria-label="Count"
                  className="h-9 w-24 px-2"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleSaveAndExit}>
              Save & exit
            </Button>
            <Button onClick={handleGoToReview}>Review variances</Button>
          </div>
        </div>
      )}

      {mode === "review" && (
        <div className="flex flex-col gap-4">
          <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
            Each line compares what was counted against the system quantity at the moment the count started, plus any
            sales, receipts, or transfers recorded since — so a tin sold mid-count doesn&apos;t appear as a loss.
          </p>

          {progress.counted < progress.total && !isLocked && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
              {progress.total - progress.counted} product{progress.total - progress.counted === 1 ? "" : "s"} not yet
              counted — uncounted items are excluded from this review.
            </p>
          )}

          <div className="flex flex-col divide-y rounded-xl border">
            <div className="grid grid-cols-[1fr_70px_70px_80px_80px_70px] gap-2 px-4 py-2 text-xs text-muted-foreground">
              <span>Product</span>
              <span>Counted</span>
              <span>System</span>
              <span>Movements</span>
              <span>Expected</span>
              <span>Variance</span>
            </div>
            {lines.map((line) => (
              <div key={line.productId} className="flex flex-col gap-2 px-4 py-3">
                <div className="grid grid-cols-[1fr_70px_70px_80px_80px_70px] items-center gap-2 text-sm">
                  <span className="truncate font-medium">{line.productName}</span>
                  <span>{line.counted}</span>
                  <span className="text-muted-foreground">{line.systemAtSnapshot}</span>
                  <span className="text-muted-foreground">{line.movementsDuringCount >= 0 ? "+" : ""}{line.movementsDuringCount}</span>
                  <span className="text-muted-foreground">{line.expectedNow}</span>
                  <span className={(line.variance ?? 0) < 0 ? "font-medium text-destructive" : "font-medium text-emerald-600 dark:text-emerald-400"}>
                    {(line.variance ?? 0) > 0 ? "+" : ""}
                    {line.variance}
                  </span>
                </div>
                {isLocked ? (
                  <p className="text-xs text-muted-foreground">
                    Reason: {reasons[line.productId]?.reason ?? "—"}
                    {reasons[line.productId]?.note ? ` — ${reasons[line.productId].note}` : ""}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={reasons[line.productId]?.reason ?? ""}
                      onValueChange={(v) => setReasons((prev) => ({ ...prev, [line.productId]: { reason: v, note: prev[line.productId]?.note ?? "" } }))}
                    >
                      <SelectTrigger className="h-8 w-full text-xs">
                        <SelectValue placeholder="Reason (required)" />
                      </SelectTrigger>
                      <SelectContent>
                        {VARIANCE_REASONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={reasons[line.productId]?.note ?? ""}
                      onChange={(e) => setReasons((prev) => ({ ...prev, [line.productId]: { reason: prev[line.productId]?.reason ?? "", note: e.target.value } }))}
                      placeholder="Note (optional)"
                      rows={1}
                      className="h-8 min-h-8 text-xs"
                    />
                  </div>
                )}
              </div>
            ))}
            {lines.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No variances — counted quantities matched expectations exactly.</p>}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="text-sm">Net variance value</Label>
            <span className={netValue < 0 ? "font-medium text-destructive" : netValue > 0 ? "font-medium text-emerald-600 dark:text-emerald-400" : "font-medium"}>
              {formatGHS(netValue)}
            </span>
          </div>

          <div className="flex justify-end gap-2">
            {!isLocked && (
              <>
                <Button variant="outline" onClick={() => setMode("count")}>
                  Back to counting
                </Button>
                <Button variant="destructive" onClick={handleDiscard}>
                  Discard
                </Button>
                <div className="flex flex-col items-end gap-1">
                  {!allReasoned && (
                    <p className="text-xs text-muted-foreground">
                      {unreasonedCount} variance{unreasonedCount === 1 ? "" : "s"} still need{unreasonedCount === 1 ? "s" : ""} a reason
                    </p>
                  )}
                  <Button onClick={handlePost} disabled={!allReasoned}>
                    Post
                  </Button>
                </div>
              </>
            )}
            {isLocked && (
              <Button variant="outline" onClick={() => router.push("/stock/stocktakes")}>
                Back to stocktakes
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
