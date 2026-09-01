"use client"

import Link from "next/link"
import { Info } from "lucide-react"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { getPaymentMethodsSettings } from "@/lib/payment-methods-data"
import { ONLINE_PAYMENT_INTEGRATION_NOTE, type OnlinePaymentSettings } from "@/lib/online-store-data"

/**
 * How customers pay online.
 *
 * The account details are NOT re-entered here — they're read from Settings →
 * Payment methods, the same place the register reads them, so a merchant who
 * changes a Momo number changes it once. Nothing on this screen pretends to
 * be a live payment integration: the merchant confirms each payment in
 * Orders, and that's stated plainly rather than implied.
 */
export function paymentProblems(settings: OnlinePaymentSettings): string[] {
  if (!settings.momo && !settings.cashOnDelivery && !settings.bankTransfer) {
    return ["Turn on at least one way for customers to pay"]
  }
  return []
}

export function PaymentFields({
  value,
  deliveryEnabled,
  onChange,
}: {
  value: OnlinePaymentSettings
  /** Cash on delivery only makes sense if something is actually delivered. */
  deliveryEnabled: boolean
  onChange: (patch: Partial<OnlinePaymentSettings>) => void
}) {
  const methods = getPaymentMethodsSettings()
  const momoAccounts = methods.momoAccounts.filter((account) => account.number.trim())

  function setMethod(id: keyof OnlinePaymentSettings, checked: boolean) {
    onChange({ [id]: checked } as Partial<OnlinePaymentSettings>)
  }

  const options = [
    {
      id: "momo" as const,
      label: "Mobile money",
      detail:
        momoAccounts.length > 0
          ? `Paid to ${momoAccounts.map((account) => `${account.network} ${account.number}`).join(", ")}`
          : "Add a Momo number in Settings → Payment methods first",
      disabled: momoAccounts.length === 0,
      checked: value.momo,
    },
    {
      id: "bankTransfer" as const,
      label: "Bank transfer",
      detail: methods.bankAccount.accountNumber
        ? `Paid to ${methods.bankAccount.bankName} · ${methods.bankAccount.accountNumber}`
        : "Add a bank account in Settings → Payment methods first",
      disabled: !methods.bankAccount.accountNumber,
      checked: value.bankTransfer,
    },
    {
      id: "cashOnDelivery" as const,
      label: "Cash on delivery",
      detail: deliveryEnabled
        ? "The rider collects the money at the door, and it reconciles at day close"
        : "Turn on at least one delivery area to offer this",
      disabled: !deliveryEnabled,
      checked: value.cashOnDelivery,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col divide-y rounded-lg border">
        {options.map((option) => (
          <div key={option.id} className="flex items-start justify-between gap-3 px-3 py-3">
            <div>
              <Label htmlFor={`online-pay-${option.id}`} className="font-normal">
                {option.label}
              </Label>
              <p className="text-xs text-muted-foreground">{option.detail}</p>
            </div>
            <Switch
              id={`online-pay-${option.id}`}
              checked={option.checked && !option.disabled}
              disabled={option.disabled}
              onCheckedChange={(checked) => setMethod(option.id, checked)}
            />
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <p>
          {ONLINE_PAYMENT_INTEGRATION_NOTE} Account details live in{" "}
          <Link href="/settings/payment-methods" className="text-primary hover:underline">
            Settings → Payment methods
          </Link>
          , alongside the ones your register uses.
        </p>
      </div>
    </div>
  )
}
