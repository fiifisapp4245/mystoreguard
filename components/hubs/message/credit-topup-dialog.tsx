"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatGHS } from "@/lib/mock-data"
import { CREDIT_COST_GHS, CREDIT_PACKAGES, topUpCredits, type CreditTopUp } from "@/lib/message-data"
import { cn } from "@/lib/utils"

const METHODS: CreditTopUp["method"][] = ["Momo", "Bank transfer", "Card"]

/** Two-stage top-up: pick a package + method, then confirm the (mock) payment. */
export function CreditTopUpDialog({
  open,
  onOpenChange,
  onTopUp,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTopUp: () => void
}) {
  const [credits, setCredits] = useState<number>(CREDIT_PACKAGES[0])
  const [method, setMethod] = useState<CreditTopUp["method"]>("Momo")
  const [stage, setStage] = useState<"select" | "confirm">("select")

  function handleOpenChange(next: boolean) {
    if (!next) {
      setStage("select")
      setCredits(CREDIT_PACKAGES[0])
      setMethod("Momo")
    }
    onOpenChange(next)
  }

  function handleConfirm() {
    topUpCredits(credits, method, "Adjoa Boateng")
    toast.success("Top-up successful", { description: `${credits.toLocaleString()} credits added via ${method}.` })
    onTopUp()
    handleOpenChange(false)
  }

  const amount = credits * CREDIT_COST_GHS

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Top up SMS credits</DialogTitle>
          <DialogDescription>
            {stage === "select" ? "Choose a package and payment method." : "Confirm the payment to add credits."}
          </DialogDescription>
        </DialogHeader>

        {stage === "select" ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              {CREDIT_PACKAGES.map((pkg) => (
                <button
                  key={pkg}
                  type="button"
                  onClick={() => setCredits(pkg)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors",
                    credits === pkg ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-accent"
                  )}
                >
                  <span className="text-sm font-semibold">{pkg.toLocaleString()} credits</span>
                  <span className="text-xs text-muted-foreground">{formatGHS(pkg * CREDIT_COST_GHS)}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="topup-method">Payment method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as CreditTopUp["method"])}>
                <SelectTrigger id="topup-method" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Credits</span>
              <span className="font-medium">{credits.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method</span>
              <span className="font-medium">{method}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">Amount due</span>
              <span className="font-semibold">{formatGHS(amount)}</span>
            </div>
          </div>
        )}

        <DialogFooter>
          {stage === "select" ? (
            <Button onClick={() => setStage("confirm")}>Continue</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStage("select")}>
                Back
              </Button>
              <Button onClick={handleConfirm}>Confirm payment</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
