"use client"

import { MapPin } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LOCATIONS } from "@/lib/mock-data"
import { LARRY_LOCATIONS } from "@/lib/larry-data"
import { useDemoState } from "@/hooks/use-demo-state"

export function LocationsSettingsCard() {
  const { state } = useDemoState()
  const isLarry = state.storePersona === "larry"
  const locations = isLarry ? LARRY_LOCATIONS : LOCATIONS

  return (
    <Card className="sm:col-span-2 lg:col-span-3">
      <CardHeader className="gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-primary" aria-hidden="true" />
          <CardTitle className="font-sans text-base">Locations</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Every shop and warehouse the business operates. Configured once here — every stock screen filters by these.
        </p>
        <div className="flex flex-col divide-y rounded-lg border">
          {locations.map((location) => (
            <div key={location.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
              <div>
                <p className="font-medium">{location.name}</p>
                <p className="text-xs text-muted-foreground">{location.address}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="font-normal capitalize">
                  {location.type}
                </Badge>
                {location.canSell && (
                  <Badge variant="secondary" className="font-normal">
                    Sells
                  </Badge>
                )}
                {location.isDefaultReceiving && (
                  <Badge variant="secondary" className="font-normal">
                    Default receiving
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
