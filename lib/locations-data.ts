import { getLarryProductsStore, LARRY_LOCATIONS } from "@/lib/larry-data"
import { LOCATIONS, type Location } from "@/lib/mock-data"
import { getProductsStore } from "@/lib/pos-data"
import type { StorePersona } from "@/hooks/use-demo-state"

/**
 * Locations — Class C for names and details, Class A for deletion. A
 * location only ever gets created/edited/deactivated here; it's never
 * deleted once it has stock or transaction history, matching the same
 * "don't rewrite history" principle as the other Class A settings.
 */

let locationsStore: Record<StorePersona, Location[]> = {
  adwoa: LOCATIONS.map((l) => ({ ...l })),
  larry: LARRY_LOCATIONS.map((l) => ({ ...l })),
}

export function getLocationsStore(persona: StorePersona): Location[] {
  return locationsStore[persona]
}

export function addLocation(persona: StorePersona, location: Location): void {
  locationsStore = { ...locationsStore, [persona]: [...locationsStore[persona], location] }
}

export function updateLocation(persona: StorePersona, location: Location): void {
  locationsStore = {
    ...locationsStore,
    [persona]: locationsStore[persona].map((l) => (l.id === location.id ? location : l)),
  }
}

export function setLocationStatus(persona: StorePersona, id: string, status: Location["status"]): void {
  locationsStore = {
    ...locationsStore,
    [persona]: locationsStore[persona].map((l) => (l.id === id ? { ...l, status } : l)),
  }
}

/** A location with any stock recorded against it can only be deactivated, never deleted. */
export function locationHasHistory(persona: StorePersona, locationId: string): boolean {
  const products = persona === "larry" ? getLarryProductsStore() : getProductsStore()
  return products.some((p) =>
    p.locationStock.some((ls) => ls.locationId === locationId && (ls.onHand > 0 || ls.setAside > 0 || ls.sealedPurchaseUnits > 0))
  )
}
