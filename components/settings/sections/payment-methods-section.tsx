"use client"

import { useState } from "react"
import { toast } from "sonner"

import { SettingsSectionCard } from "@/components/settings/settings-section-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  TENDER_METHOD_KEYS,
  TENDER_METHOD_LABELS,
  getPaymentMethodsSettings,
  setPaymentMethodsSettings,
  toggleTender,
  type BankAccountDetails,
  type MomoAccount,
} from "@/lib/payment-methods-data"
import { markSetupItemDone } from "@/lib/setup-checklist-data"

/** Class C — what's available at checkout going forward, no financial-history concern. */
export function PaymentMethodsSection() {
  const [settings, setSettings] = useState(() => getPaymentMethodsSettings())
  const [momoForm, setMomoForm] = useState<MomoAccount[]>(() => getPaymentMethodsSettings().momoAccounts.map((a) => ({ ...a })))
  const [bankForm, setBankForm] = useState<BankAccountDetails>(() => ({ ...getPaymentMethodsSettings().bankAccount }))

  function refresh() {
    setSettings(getPaymentMethodsSettings())
  }

  function handleToggleTender(key: (typeof TENDER_METHOD_KEYS)[number]) {
    toggleTender(key)
    refresh()
  }

  function updateMomo(index: number, field: keyof MomoAccount, value: string) {
    setMomoForm((prev) => prev.map((account, i) => (i === index ? { ...account, [field]: value } : account)))
  }

  function handleMomoSave() {
    setPaymentMethodsSettings({ ...getPaymentMethodsSettings(), momoAccounts: momoForm })
    refresh()
    markSetupItemDone("payment-methods")
    toast.success("Momo accounts saved")
  }

  function updateBank<K extends keyof BankAccountDetails>(field: K, value: BankAccountDetails[K]) {
    setBankForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleBankSave() {
    setPaymentMethodsSettings({ ...getPaymentMethodsSettings(), bankAccount: bankForm })
    refresh()
    markSetupItemDone("payment-methods")
    toast.success("Bank account saved")
  }

  return (
    <div className="flex flex-col gap-4">
      <SettingsSectionCard title="Payment methods" settingClass="C" description="Which tenders the register offers at checkout.">
        <div className="flex flex-col gap-3">
          {TENDER_METHOD_KEYS.map((key) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <Label htmlFor={`tender-${key}`} className="text-sm font-normal">
                {TENDER_METHOD_LABELS[key]}
              </Label>
              <Switch id={`tender-${key}`} checked={settings.enabledTenders[key]} onCheckedChange={() => handleToggleTender(key)} />
            </div>
          ))}
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard title="Momo accounts" settingClass="C">
        <div className="flex flex-col gap-4">
          {momoForm.map((account, index) => (
            <div key={account.network} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
              <p className="text-sm font-medium sm:col-span-2">{account.network}</p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`momo-number-${account.network}`}>Number</Label>
                <Input
                  id={`momo-number-${account.network}`}
                  value={account.number}
                  onChange={(e) => updateMomo(index, "number", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`momo-name-${account.network}`}>Registered name</Label>
                <Input
                  id={`momo-name-${account.network}`}
                  value={account.registeredName}
                  onChange={(e) => updateMomo(index, "registeredName", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
        <div>
          <Button onClick={handleMomoSave}>Save</Button>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard title="Bank account" settingClass="C">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bank-name">Bank name</Label>
            <Input id="bank-name" value={bankForm.bankName} onChange={(e) => updateBank("bankName", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bank-account-name">Account name</Label>
            <Input id="bank-account-name" value={bankForm.accountName} onChange={(e) => updateBank("accountName", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bank-account-number">Account number</Label>
            <Input
              id="bank-account-number"
              value={bankForm.accountNumber}
              onChange={(e) => updateBank("accountNumber", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bank-branch">Branch</Label>
            <Input id="bank-branch" value={bankForm.branch} onChange={(e) => updateBank("branch", e.target.value)} />
          </div>
        </div>
        <div>
          <Button onClick={handleBankSave}>Save</Button>
        </div>
      </SettingsSectionCard>
    </div>
  )
}
