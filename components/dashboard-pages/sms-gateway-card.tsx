"use client"

import { useState } from "react"
import { Lock, Send } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

export function SmsGatewayCard() {
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
    <Card className={locked ? "opacity-60" : undefined}>
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Send className="size-4 text-primary" aria-hidden="true" />
            <CardTitle className="font-sans text-base">SMS gateway</CardTitle>
          </div>
          {locked && (
            <Badge variant="secondary" className="flex items-center gap-1 font-normal">
              <Lock className="size-3" />
              {TIER_LABEL.prime}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Platform-managed SMS credits are the default. Bring your own gateway if you already have a provider relationship.
        </p>

        {locked ? (
          <p className="text-xs text-muted-foreground">Available on Prime and Ultra — simulate a higher tier in the demo controls to configure this.</p>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Use my own SMS gateway</p>
                <p className="text-xs text-muted-foreground">Turns off platform credits for this provider.</p>
              </div>
              <Switch checked={settings.useOwnGateway} onCheckedChange={(v) => update("useOwnGateway", v)} />
            </div>

            {settings.useOwnGateway && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="gateway-provider">Provider</Label>
                  <Select value={settings.provider} onValueChange={(v) => update("provider", v as SmsGatewayProvider)}>
                    <SelectTrigger className="w-full" id="gateway-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SMS_GATEWAY_PROVIDERS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="gateway-api-key">API key</Label>
                    <Input id="gateway-api-key" value={settings.apiKey} onChange={(e) => update("apiKey", e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="gateway-api-secret">API secret</Label>
                    <Input id="gateway-api-secret" type="password" value={settings.apiSecret} onChange={(e) => update("apiSecret", e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="gateway-sender-id">Sender ID</Label>
                  <Input id="gateway-sender-id" value={settings.senderId} onChange={(e) => update("senderId", e.target.value)} placeholder="e.g. STOREGUARD" />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={handleSave}>
                Save
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
