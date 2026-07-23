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
import { CustomerIdentificationControl } from "@/components/register/customer-identification-control"
import { formatGHS } from "@/lib/mock-data"
import { MOMO_NETWORKS, type TenderType } from "@/lib/pos-data"
import { findGiftCardByNumber, type GiftCard } from "@/lib/gift-cards-data"
import { getProgrammeSettings, pointsToGHS, type LoyaltyMember } from "@/lib/loyalty-data"

const BASE_TENDERS: { key: TenderType; label: string; shortcut: string }[] = [
  { key: "Cash", label: "Cash", shortcut: "1" },
  { key: "Momo", label: "Momo", shortcut: "2" },
  { key: "Credit", label: "Credit", shortcut: "3" },
  { key: "Deposit", label: "Deposit", shortcut: "4" },
  { key: "Split", label: "Split", shortcut: "5" },
  { key: "Gift card", label: "Gift card", shortcut: "6" },
  { key: "Points", label: "Points", shortcut: "7" },
]

const REMAINDER_TENDERS: TenderType[] = ["Cash", "Momo", "Credit", "Deposit"]
const QUICK_TENDER_AMOUNTS = [50, 100, 200]

export interface CheckoutSummary {
  giftCardId?: string
  giftCardAppliedAmount?: number
  remainderTender?: TenderType
  pointsRedeemed?: number
}

export interface ReceiptInfo {
  pointsEarned?: number
  newPointsBalance?: number
  giftCardRemainingBalance?: number
  discountsApplied: { label: string; amount: number }[]
}

export function PaymentSheet({
  open,
  onOpenChange,
  total,
  member,
  onAttachMember,
  tender,
  onTenderChange,
  onComplete,
  onDone,
  onRestoreFocus,
  isUltra,
  discountsApplied,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  total: number
  member: LoyaltyMember | null
  onAttachMember: (member: LoyaltyMember) => void
  tender: TenderType
  onTenderChange: (tender: TenderType) => void
  onComplete: (summary: CheckoutSummary) => ReceiptInfo
  /** Called once the cashier dismisses the receipt — this is when the sale actually resets, not just when the sheet closes. */
  onDone: () => void
  onRestoreFocus: () => void
  isUltra: boolean
  discountsApplied: { label: string; amount: number }[]
}) {
  const [stage, setStage] = useState<"select" | "success">("select")
  const [receipt, setReceipt] = useState<ReceiptInfo | null>(null)

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

  const [giftCardNumber, setGiftCardNumber] = useState("")
  const [foundGiftCard, setFoundGiftCard] = useState<GiftCard | null | undefined>(undefined)
  const [giftCardRemainderTender, setGiftCardRemainderTender] = useState<TenderType>("Cash")

  const programmeSettings = getProgrammeSettings()
  const maxPointsValue = member ? Math.min(pointsToGHS(member.points), (total * programmeSettings.maxRedemptionPercent) / 100) : 0
  const maxPointsRedeemable = member ? Math.floor(maxPointsValue / programmeSettings.pointValueGHS) : 0
  const [pointsToRedeem, setPointsToRedeem] = useState(0)
  const [pointsRemainderTender, setPointsRemainderTender] = useState<TenderType>("Cash")

  // Reset the form the moment the sheet transitions closed → open, so a
  // fresh sale never sees the previous transaction's numbers. Adjusting
  // state during render (rather than in an effect) is the React-sanctioned
  // way to do this — see "Resetting state when a prop changes".
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setStage("select")
      setReceipt(null)
      setCashReceived("")
      setMomoAmount(String(total))
      setMomoReference("")
      setCreditDueDate("")
      setDepositAmount(String(Math.round(total / 2)))
      setDepositDueDate("")
      setSplitAAmount(String(total))
      setSplitBAmount("0")
      setGiftCardNumber("")
      setFoundGiftCard(undefined)
      setPointsToRedeem(0)
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

  function handleCheckGiftCard() {
    const trimmed = giftCardNumber.trim()
    if (!trimmed) return
    setFoundGiftCard(findGiftCardByNumber(trimmed) ?? null)
  }

  const giftCardCoversAll = foundGiftCard ? foundGiftCard.balance >= total : false
  const giftCardApplied = foundGiftCard ? Math.min(foundGiftCard.balance, total) : 0
  const giftCardRemainder = Math.max(0, total - giftCardApplied)

  const pointsValueApplied = pointsToRedeem * programmeSettings.pointValueGHS
  const pointsRemainder = Math.max(0, total - pointsValueApplied)

  const tenders = BASE_TENDERS.filter((t) => {
    if (t.key === "Points") return isUltra && member && member.points >= programmeSettings.minPointsToRedeem
    return true
  })

  const canConfirm =
    tender === "Cash"
      ? receivedValue >= total
      : tender === "Momo"
        ? momoReference.trim().length > 0 && Number.parseFloat(momoAmount) > 0
        : tender === "Credit"
          ? Boolean(member) && creditDueDate.trim().length > 0
          : tender === "Deposit"
            ? Number.parseFloat(depositAmount) > 0 &&
              Number.parseFloat(depositAmount) <= total &&
              depositDueDate.trim().length > 0
            : tender === "Split"
              ? Math.abs((Number.parseFloat(splitAAmount) || 0) + (Number.parseFloat(splitBAmount) || 0) - total) < 0.01
              : tender === "Gift card"
                ? Boolean(foundGiftCard) && foundGiftCard!.status === "Active" && (giftCardCoversAll || Boolean(giftCardRemainderTender))
                : // Points
                  pointsToRedeem > 0 && (pointsValueApplied >= total || Boolean(pointsRemainderTender))

  function handleConfirm() {
    if (!canConfirm) return
    const summary =
      tender === "Gift card"
        ? {
            giftCardId: foundGiftCard!.id,
            giftCardAppliedAmount: giftCardApplied,
            remainderTender: giftCardCoversAll ? undefined : giftCardRemainderTender,
          }
        : tender === "Points"
          ? { pointsRedeemed: pointsToRedeem, remainderTender: pointsValueApplied >= total ? undefined : pointsRemainderTender }
          : {}
    const result = onComplete(summary)
    setReceipt(result)
    setStage("success")
  }

  function handleDone() {
    onOpenChange(false)
    onDone()
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

            <div className="flex w-full flex-col gap-1.5 rounded-lg border p-3 text-left text-sm">
              {receipt?.discountsApplied.map((line) => (
                <div key={line.label} className="flex items-center justify-between text-muted-foreground">
                  <span>{line.label}</span>
                  <span>− {formatGHS(line.amount)}</span>
                </div>
              ))}
              {receipt?.pointsEarned !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Points earned</span>
                  <span className="font-medium">+{receipt.pointsEarned}</span>
                </div>
              )}
              {receipt?.newPointsBalance !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">New points balance</span>
                  <span className="font-medium">{receipt.newPointsBalance}</span>
                </div>
              )}
              {receipt?.giftCardRemainingBalance !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Gift card balance remaining</span>
                  <span className="font-medium">{formatGHS(receipt.giftCardRemainingBalance)}</span>
                </div>
              )}
              {!receipt?.discountsApplied.length &&
                receipt?.pointsEarned === undefined &&
                receipt?.giftCardRemainingBalance === undefined && <p className="text-muted-foreground">No discounts or loyalty activity on this sale.</p>}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDone}>
                Print
              </Button>
              <Button variant="outline" onClick={handleDone}>
                Send SMS
              </Button>
              <Button variant="outline" onClick={handleDone}>
                No receipt
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
            {discountsApplied.length > 0 && (
              <div className="flex flex-col gap-1 rounded-lg bg-muted/60 p-2.5 text-xs">
                {discountsApplied.map((line) => (
                  <div key={line.label} className="flex items-center justify-between text-muted-foreground">
                    <span>{line.label}</span>
                    <span>− {formatGHS(line.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-4 gap-1.5">
              {tenders.map((t) => (
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
                {!member ? (
                  <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
                    <p className="text-sm text-muted-foreground">Attach a customer to sell on credit.</p>
                    <CustomerIdentificationControl member={null} onAttach={onAttachMember} onDetach={() => {}} />
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{member.name}</p>
                      {member.creditBalance > 0 && (
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          Already owes {formatGHS(member.creditBalance)} from past credit sales
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

            {tender === "Gift card" && (
              <div className="flex flex-col gap-3">
                <div className="flex gap-1.5">
                  <Input
                    value={giftCardNumber}
                    onChange={(e) => {
                      setGiftCardNumber(e.target.value)
                      setFoundGiftCard(undefined)
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleCheckGiftCard()}
                    placeholder="Card number — scan or type"
                  />
                  <Button variant="outline" onClick={handleCheckGiftCard}>
                    Check
                  </Button>
                </div>
                {foundGiftCard === null && <p className="text-sm text-destructive">Card not recognised.</p>}
                {foundGiftCard && foundGiftCard.status !== "Active" && (
                  <p className="text-sm text-destructive">This card is {foundGiftCard.status.toLowerCase()} and can&apos;t be used.</p>
                )}
                {foundGiftCard && foundGiftCard.status === "Active" && (
                  <>
                    <div className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Card balance</span>
                        <span className="font-medium">{formatGHS(foundGiftCard.balance)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Applied to this sale</span>
                        <span className="font-medium">{formatGHS(giftCardApplied)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Balance after sale</span>
                        <span className="font-medium">{formatGHS(foundGiftCard.balance - giftCardApplied)}</span>
                      </div>
                    </div>
                    {!giftCardCoversAll && (
                      <div className="flex flex-col gap-1.5 rounded-lg border border-dashed p-3">
                        <p className="text-sm text-muted-foreground">
                          Card doesn&apos;t cover the total — {formatGHS(giftCardRemainder)} remaining goes to:
                        </p>
                        <Select value={giftCardRemainderTender} onValueChange={(v) => setGiftCardRemainderTender(v as TenderType)}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REMAINDER_TENDERS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {tender === "Points" && member && (
              <div className="flex flex-col gap-3">
                <div className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Points available</span>
                    <span className="font-medium">{member.points}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Max redeemable this sale</span>
                    <span className="font-medium">
                      {maxPointsRedeemable} pts ({formatGHS(maxPointsValue)}, capped at {programmeSettings.maxRedemptionPercent}% of total)
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Points to redeem</Label>
                  <Input
                    type="number"
                    min={0}
                    max={maxPointsRedeemable}
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(Math.max(0, Math.min(maxPointsRedeemable, Number.parseInt(e.target.value, 10) || 0)))}
                  />
                  <p className="text-xs text-muted-foreground">Worth {formatGHS(pointsValueApplied)}</p>
                </div>
                {pointsValueApplied < total && pointsToRedeem > 0 && (
                  <div className="flex flex-col gap-1.5 rounded-lg border border-dashed p-3">
                    <p className="text-sm text-muted-foreground">
                      Points don&apos;t cover the total — {formatGHS(pointsRemainder)} remaining goes to:
                    </p>
                    <Select value={pointsRemainderTender} onValueChange={(v) => setPointsRemainderTender(v as TenderType)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REMAINDER_TENDERS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
