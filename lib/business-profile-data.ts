import type { StorePersona } from "@/hooks/use-demo-state"

/**
 * The store's own letterhead — Class C (mostly free text), except that it's
 * also the single source the invoice and quotation previews render as their
 * header. Edit the name here and the document preview changes with it.
 */
export interface BusinessProfile {
  storeName: string
  tradingName: string
  /** Visual only — no real upload in the prototype. */
  logoUrl?: string
  addressLine: string
  area: string
  phone: string
  email: string
  tin: string
  registrationNumber: string
}

const ADWOA_PROFILE: BusinessProfile = {
  storeName: "Adwoa's Provisions",
  tradingName: "Adwoa's Provisions",
  addressLine: "Stall 14, Makola Market",
  area: "Makola, Accra",
  phone: "024 000 1111",
  email: "hello@adwoasprovisions.com.gh",
  tin: "C0012345678",
  registrationNumber: "BN-2019-114455",
}

const LARRY_PROFILE: BusinessProfile = {
  storeName: "Larry's Curtains & Décor",
  tradingName: "Larry's Curtains & Décor",
  addressLine: "12 Lagos Avenue, East Legon",
  area: "East Legon, Accra",
  phone: "020 555 8899",
  email: "sales@larryscurtains.com.gh",
  tin: "C0098765432",
  registrationNumber: "BN-2021-778899",
}

let profileStore: Record<StorePersona, BusinessProfile> = {
  adwoa: { ...ADWOA_PROFILE },
  larry: { ...LARRY_PROFILE },
}

export function getBusinessProfile(persona: StorePersona): BusinessProfile {
  return profileStore[persona]
}

export function setBusinessProfile(persona: StorePersona, profile: BusinessProfile): void {
  profileStore = { ...profileStore, [persona]: profile }
}

/** Whether the profile has the minimum fields a first-run store needs — used by the setup checklist. */
export function isBusinessProfileComplete(persona: StorePersona): boolean {
  const p = profileStore[persona]
  return Boolean(p.storeName.trim() && p.addressLine.trim() && p.phone.trim() && p.tin.trim())
}
