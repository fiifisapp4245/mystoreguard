export type CtaVariant = "trial" | "demo"
export type Currency = "USD" | "GHS"

export interface SiteConfig {
  ctaVariant: CtaVariant
  showPrices: boolean
  currency: Currency
  whatsappNumber: string
  demoBookingUrl: string
  contactEmail: string
}

/** Builds a wa.me click-to-chat link. Non-digit characters (e.g. the placeholder "X"s) are stripped. */
export function whatsappLink(number: string, message?: string): string {
  const digits = number.replace(/\D/g, "")
  const base = `https://wa.me/${digits}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

/**
 * STILL A PLACEHOLDER — no real WhatsApp Business number has been provided.
 * Every link built from this resolves to an unusable https://wa.me/233
 * (the "X"s aren't digits, so they're stripped) until this is replaced.
 */
const WHATSAPP_NUMBER = "+233XXXXXXXXX"

/**
 * Decisions the team hasn't signed off on yet. Every page must render
 * sensibly for any combination of these — see resolveSiteConfig() for the
 * ?cta=&prices=&currency= URL overrides used to flip them during review.
 */
export const siteConfig: SiteConfig = {
  ctaVariant: "trial",
  showPrices: false,
  currency: "USD",
  whatsappNumber: WHATSAPP_NUMBER,
  // No real booking link exists yet (e.g. Calendly/Cal.com) — routes to WhatsApp
  // instead of a dead "#" in the meantime, since that channel already works.
  demoBookingUrl: whatsappLink(WHATSAPP_NUMBER, "Hi, I'd like to book a demo of MyStoreGuard."),
  contactEmail: "hello@mystoreguard.com",
}

export interface CtaCopy {
  primary: string
  secondary: string
}

const CTA_COPY: Record<CtaVariant, CtaCopy> = {
  trial: { primary: "Start free — first month on us", secondary: "Book a demo" },
  demo: { primary: "Book a free demo", secondary: "Start free trial" },
}

export function getCtaCopy(variant: CtaVariant): CtaCopy {
  return CTA_COPY[variant]
}

/** Links into the dashboard, pre-set to view as the given tier — same app, so a plain in-app path. */
export function dashboardTierPath(tier: string): string {
  return `/m/dashboard?nav=grouped&tier=${tier}`
}

type SearchParamsInput = URLSearchParams | Record<string, string | string[] | undefined>

function readParam(params: SearchParamsInput, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

/** Merges ?cta=&prices=&currency= URL overrides onto the default siteConfig. */
export function resolveSiteConfig(params: SearchParamsInput): SiteConfig {
  const cta = readParam(params, "cta")
  const prices = readParam(params, "prices")
  const currency = readParam(params, "currency")

  return {
    ...siteConfig,
    ctaVariant: cta === "demo" || cta === "trial" ? cta : siteConfig.ctaVariant,
    showPrices: prices === undefined ? siteConfig.showPrices : prices === "1" || prices === "true",
    currency: currency === "USD" || currency === "GHS" ? currency : siteConfig.currency,
  }
}
