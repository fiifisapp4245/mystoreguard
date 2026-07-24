"use client"

import { useState } from "react"
import { toast } from "sonner"

import { SettingsSectionCard } from "@/components/settings/settings-section-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDemoState } from "@/hooks/use-demo-state"
import { getBusinessProfile, isBusinessProfileComplete, setBusinessProfile, type BusinessProfile } from "@/lib/business-profile-data"
import { markSetupItemDone } from "@/lib/setup-checklist-data"

/**
 * Class C — the store's own letterhead. Free text everywhere; the only
 * ceremony is that it feeds the invoice/quotation preview header.
 */
export function BusinessProfileSection() {
  const { state } = useDemoState()
  const persona = state.storePersona
  const [profile, setProfile] = useState<BusinessProfile>(() => getBusinessProfile(persona))
  const [logoFileName, setLogoFileName] = useState<string | null>(null)

  function update<K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    setBusinessProfile(persona, profile)
    if (isBusinessProfileComplete(persona)) {
      markSetupItemDone("business-profile")
    }
    toast.success("Business profile saved")
  }

  return (
    <SettingsSectionCard title="Business profile" settingClass="C">
      <p className="text-xs text-muted-foreground">This is what your invoices and quotations show as their letterhead.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="store-name">Store name</Label>
          <Input id="store-name" value={profile.storeName} onChange={(e) => update("storeName", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="trading-name">Trading name</Label>
          <Input id="trading-name" value={profile.tradingName} onChange={(e) => update("tradingName", e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="logo-upload">Logo</Label>
          <Input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFileName(e.target.files?.[0]?.name ?? null)}
          />
          {logoFileName && <p className="text-xs text-muted-foreground">Logo: {logoFileName}</p>}
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="address-line">Address</Label>
          <Input id="address-line" value={profile.addressLine} onChange={(e) => update("addressLine", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="area">Area / city</Label>
          <Input id="area" value={profile.area} onChange={(e) => update("area", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={profile.phone} onChange={(e) => update("phone", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={profile.email} onChange={(e) => update("email", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tin">TIN</Label>
          <Input id="tin" value={profile.tin} onChange={(e) => update("tin", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="registration-number">Business registration number</Label>
          <Input id="registration-number" value={profile.registrationNumber} onChange={(e) => update("registrationNumber", e.target.value)} />
        </div>
      </div>

      <div>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </SettingsSectionCard>
  )
}
