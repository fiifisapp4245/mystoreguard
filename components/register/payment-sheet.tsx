"use client"

import { useState } from "react"
import { CheckCircle2, Delete } from "lucide-react"

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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { CustomerPicker } from "@/components/register/customer-picker"
import { formatGHS, type Customer } from "@/lib/mock-data"
import { MOMO_NETWORKS, type TenderType } from "@/lib/pos-data"

const TENDERS: { key: TenderType; label: string; shortcut: string }[] = [
  { key: "Cash", label: "Cash", shortcut: "1" },
  { key: "Momo", label: "Momo", shortcut: "2" },
  { key: "Credit", label: "Credit", shortcut: "3" },
  { key: "Deposit", label: "Deposit", shortcut: "4" },
  { key: "Split", label: "Split", shortcut: "5" },
]

const QUICK_TENDER_AMOUNTS = [50, 100, 200]

export function PaymentSheet({
  open,
  onOpenChange,
  total,
  customer,
  onAttachCustomer,
  tender,
  onTenderChange,
  onComplete,
  onRestoreFocus,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  total: number
  customer: Customer | null
  onAttachCustomer: (customer: Customer) => void
  tender: TenderType
  onTenderChange: (tender: TenderType) => void
  onComplete: () => void
  onRestoreFocus: () => void
}) {
  const [stage, setStage] = useState<"select" | "success">("select")

  const [cashReceived, setCashReceived] = useState("")
  const [momoNetwork, setMomoNetwork] = useState(MOMO_NETWORKS[0])
  const [momoAmount, setMomoAmount] = useState(String(total))
  const [momoReference, setMomoReference] = useState("")
  const [creditDueDate, setCreditDueDate] = useState("")
  const [depositAmount, setDepositAmount] = useState(String(Math.round(total / 2)))
  const [depositDueDate, setDepositDueDate] = useState("")
  const [splitAAmount, setSplitAAmount] = useState(String(total))
  const [splitATender, setSplitATender] = useState<TenderType>("Cash")
  const [splitBAmount, setSplitBAmount] = useState("0")
  const [splitBTender, setSplitBTender] = useState<TenderType>("Momo")

  // Reset the form the moment the sheet transitions closed → open, so a
  // fresh sale never sees the previous transaction's numbers. Adjusting
  // state during render (rather than in an effect) is the React-sanctioned
  // way to do this — see "Resetting state when a prop changes".
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setStage("select")
      setCashReceived("")
      setMomoAmount(String(total))
      setMomoReference("")
      setCreditDueDate("")
      setDepositAmount(String(Math.round(total / 2)))
      setDepositDueDate("")
      setSplitAAmount(String(total))
      setSplitBAmount("0")
    }
  }

  const receivedValue = Number.parseFloat(cashReceived) || 0
  const change = receivedValue - total

  function pressDigit(digit: string) {
    setCashReceived((prev) => {
      if (digit === "." && prev.includes(".")) return prev
      return prev + digit
    })
  }

  function backspace() {
    setCashReceived((prev) => prev.slice(0, -1))
  }

  const canConfirm =
    tender === "Cash"
      ? receivedValue >= total
      : tender === "Momo"
        ? momoReference.trim().length > 0 && Number.parseFloat(momoAmount) > 0
        : tender === "Credit"
          ? Boolean(customer) && creditDueDate.trim().length > 0
          : tender === "Deposit"
            ? Number.parseFloat(depositAmount) > 0 &&
              Number.parseFloat(depositAmount) <= total &&
              depositDueDate.trim().length > 0
            : // Split
              Math.abs((Number.parseFloat(splitAAmount) || 0) + (Number.parseFloat(splitBAmount) || 0) - total) < 0.01

  function handleConfirm() {
    if (!canConfirm) return
    setStage("success")
    window.setTimeout(() => {
      onComplete()
    }, 2200)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) onRestoreFocus()
      }}
    >
      <SheetContent
        className="sm:max-w-md"
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          onRestoreFocus()
        }}
      >
        <SheetHeader>
          <SheetTitle>{stage === "success" ? "Sale complete" : "Charge"}</SheetTitle>
          <SheetDescription>
            {stage === "success" ? "Choose a receipt option, or it'll clear on its own." : `Total due: ${formatGHS(total)}`}
          </SheetDescription>
        </SheetHeader>

        {stage === "success" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8 text-center">
            <CheckCircle2 className="size-12 text-success" />
            <p className="text-2xl font-semibold">{formatGHS(total)} received</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onComplete}>
                Print
              </Button>
              <Button variant="outline" onClick={onComplete}>
                Send SMS
              </Button>
              <Button variant="outline" onClick={onComplete}>
                No receipt
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
            <div className="grid grid-cols-5 gap-1.5">
              {TENDERS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => onTenderChange(t.key)}
                  className={
                    "flex flex-col items-center gap-0.5 rounded-lg border py-2 text-xs font-medium " +
                    (tender === t.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent")
                  }
                >
                  {t.label}
                  <span className="text-[10px] opacity-60">{t.shortcut}</span>
                </button>
              ))}
            </div>

            {tender === "Cash" && (
              <div className="flex flex-col gap-3">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-xs text-muted-foreground">Amount received</p>
                  <p className="text-2xl font-semibold tabular-nums">{formatGHS(receivedValue)}</p>
                </div>

                {change >= 0 && receivedValue > 0 && (
                  <div className="rounded-lg bg-success/15 p-4 text-center">
                    <p className="text-xs text-success">Change due</p>
                    <p className="text-4xl font-bold tabular-nums text-success">{formatGHS(change)}</p>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-1.5">
                  {QUICK_TENDER_AMOUNTS.map((amount) => (
                    <Button key={amount} variant="outline" size="sm" onClick={() => setCashReceived(String(amount))}>
                      {amount}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setCashReceived(String(total))}>
                    Exact
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"].map((digit) => (
                    <Button key={digit} variant="outline" onClick={() => pressDigit(digit)}>
                      {digit}
                    </Button>
                  ))}
                  <Button variant="outline" onClick={backspace} aria-label="Backspace">
                    <Delete className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            {tender === "Momo" && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Network</Label>
                  <Select value={momoNetwork} onValueChange={setMomoNetwork}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOMO_NETWORKS.map((network) => (
                        <SelectItem key={network} value={network}>
                          {network}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Amount</Label>
                  <Input type="number" value={momoAmount} onChange={(event) => setMomoAmount(event.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Transaction reference</Label>
                  <Input
                    value={momoReference}
                    onChange={(event) => setMomoReference(event.target.value)}
                    placeholder="e.g. 8837201"
                  />
                  <p className="text-xs text-muted-foreground">Required — this is what makes the record reconcilable later.</p>
                </div>
              </div>
            )}

            {tender === "Credit" && (
              <div className="flex flex-col gap-3">
                {!customer ? (
                  <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
                    <p className="text-sm text-muted-foreground">Attach a customer to sell on credit.</p>
                    <CustomerPicker
                      customer={customer}
                      onSelect={(selected) => selected && onAttachCustomer(selected)}
                      onAddNew={() => {}}
                    />
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{customer.name}</p>
                      {customer.creditBalance > 0 && (
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          Already owes {formatGHS(customer.creditBalance)} from past credit sales
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Due date</Label>
                      <Input type="date" value={creditDueDate} onChange={(event) => setCreditDueDate(event.target.value)} />
                    </div>
                  </>
                )}
              </div>
            )}

            {tender === "Deposit" && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Amount paid now</Label>
                  <Input
                    type="number"
                    value={depositAmount}
                    onChange={(event) => setDepositAmount(event.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <span className="text-muted-foreground">Balance remaining</span>
                  <span className="font-medium tabular-nums">
                    {formatGHS(Math.max(0, total - (Number.parseFloat(depositAmount) || 0)))}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Due date</Label>
                  <Input type="date" value={depositDueDate} onChange={(event) => setDepositDueDate(event.target.value)} />
                </div>
              </div>
            )}

            {tender === "Split" && (
              <div className="flex flex-col gap-3">
                {[
                  { tenderValue: splitATender, setTender: setSplitATender, amount: splitAAmount, setAmount: setSplitAAmount },
                  { tenderValue: splitBTender, setTender: setSplitBTender, amount: splitBAmount, setAmount: setSplitBAmount },
                ].map((row, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select value={row.tenderValue} onValueChange={(value) => row.setTender(value as TenderType)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["Cash", "Momo", "Credit", "Deposit"] as TenderType[]).map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={row.amount}
                      onChange={(event) => row.setAmount(event.target.value)}
                      className="flex-1"
                    />
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sum must equal total</span>
                  <span className="tabular-nums">
                    {formatGHS((Number.parseFloat(splitAAmount) || 0) + (Number.parseFloat(splitBAmount) || 0))} /{" "}
                    {formatGHS(total)}
                  </span>
                </div>
              </div>
            )}

            <Button size="lg" className="mt-auto h-12 text-base" disabled={!canConfirm} onClick={handleConfirm}>
              Confirm {formatGHS(total)}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
