"use client"

import { useState } from "react"
import { Lock, Send } from "lucide-react"
import { toast } from "sonner"

import { SettingsSectionCard } from "@/components/settings/settings-section-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useDemoState } from "@/hooks/use-demo-state"
import { TIER_LABEL } from "@/lib/modules"
import {
  getSmsGatewaySettings,
  setSmsGatewaySettings,
  SMS_GATEWAY_PROVIDERS,
  type SmsGatewayProvider,
  type SmsGatewaySettings,
} from "@/lib/message-data"

/** Class C. Platform-managed SMS credits are the default; bring-your-own gateway is Prime/Ultra only. */
export function SmsGatewaySection() {
  const { state } = useDemoState()
  const locked = state.tier === "light"
  const [settings, setSettings] = useState<SmsGatewaySettings>(() => getSmsGatewaySettings())

  function update<K extends keyof SmsGatewaySettings>(key: K, value: SmsGatewaySettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    setSmsGatewaySettings(settings)
    toast.success("SMS gateway settings saved")
  }

  return (
    <SettingsSectionCard
      title="SMS gateway"
      settingClass="C"
      description="Platform-managed SMS credits are the default — most stores never need to touch this."
    >
      {locked ? (
        <div className="flex items-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" />
          <span>
            Available on <Badge variant="secondary">{TIER_LABEL.prime}</Badge> and{" "}
            <Badge variant="secondary">{TIER_LABEL.ultra}</Badge> — simulate a higher tier in the demo controls to
            configure this.
          </span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <div>
              <Label htmlFor="use-own-gateway">Use my own SMS gateway</Label>
              <p className="text-sm text-muted-foreground">
                Route outgoing SMS through your own provider account instead of platform-managed credits.
              </p>
            </div>
            <Switch
              id="use-own-gateway"
              checked={settings.useOwnGateway}
              onCheckedChange={(checked) => update("useOwnGateway", checked)}
            />
          </div>

          {settings.useOwnGateway && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gateway-provider">Provider</Label>
                <Select
                  value={settings.provider}
                  onValueChange={(value) => update("provider", value as SmsGatewayProvider)}
                >
                  <SelectTrigger id="gateway-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SMS_GATEWAY_PROVIDERS.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gateway-sender-id">Sender ID</Label>
                <Input
                  id="gateway-sender-id"
                  value={settings.senderId}
                  onChange={(e) => update("senderId", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gateway-api-key">API key</Label>
                <Input
                  id="gateway-api-key"
                  value={settings.apiKey}
                  onChange={(e) => update("apiKey", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gateway-api-secret">API secret</Label>
                <Input
                  id="gateway-api-secret"
                  type="password"
                  value={settings.apiSecret}
                  onChange={(e) => update("apiSecret", e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <Button onClick={handleSave}>
              <Send className="size-4" />
              Save
            </Button>
          </div>
        </>
      )}
    </SettingsSectionCard>
  )
}
