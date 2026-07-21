import type { Metadata } from "next"
import { Calendar, Mail, MessageCircle, Phone } from "lucide-react"

import { WhatsAppCta } from "@/components/whatsapp-cta"
import { siteConfig, whatsappLink } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "Contact — MyStoreGuard",
  description: "Talk to us on WhatsApp, phone, or email — every channel here is one we actually answer.",
}

export default function ContactPage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-16 sm:px-6 sm:py-24">
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-4xl font-medium tracking-tight sm:text-5xl">Talk to us</h1>
        <p className="text-lg text-muted-foreground">
          Every channel below is one we actually answer — no ticket queue, no contact form.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-primary/5 p-6">
        <div className="flex items-center gap-3">
          <MessageCircle className="size-6 text-primary" aria-hidden="true" />
          <h2 className="font-heading text-xl font-medium">WhatsApp — the fastest way to reach us</h2>
        </div>
        <p className="text-muted-foreground">
          Message us directly. Most shop owners get an answer the same day.
        </p>
        <WhatsAppCta
          number={siteConfig.whatsappNumber}
          message="Hi, I'd like to know more about MyStoreGuard."
          className="w-fit"
        >
          Chat on WhatsApp
        </WhatsAppCta>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Phone className="size-5 text-primary" aria-hidden="true" />
          <h3 className="font-medium">Phone</h3>
          <a href={`tel:${siteConfig.whatsappNumber}`} className="text-sm text-muted-foreground hover:text-foreground">
            {siteConfig.whatsappNumber}
          </a>
          <p className="text-xs text-muted-foreground">TODO: confirm this is a call-capable line, not WhatsApp-only.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Mail className="size-5 text-primary" aria-hidden="true" />
          <h3 className="font-medium">Email</h3>
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {siteConfig.contactEmail}
          </a>
        </div>
        <div className="flex flex-col gap-2">
          <Calendar className="size-5 text-primary" aria-hidden="true" />
          <h3 className="font-medium">Book a demo</h3>
          <a href={siteConfig.demoBookingUrl} className="text-sm text-muted-foreground hover:text-foreground">
            Pick a time that suits you
          </a>
          <p className="text-xs text-muted-foreground">TODO: replace with the real booking link.</p>
        </div>
      </div>

      <div className="rounded-xl border p-6">
        <p className="text-muted-foreground">
          Getting started is part of the deal. We&apos;ll help you set up your first stock count,
          so you&apos;re working with real numbers from day one.
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Prefer WhatsApp on desktop?{" "}
        <a href={whatsappLink(siteConfig.whatsappNumber)} className="underline hover:text-foreground">
          Open it in your browser
        </a>
        .
      </p>
    </section>
  )
}
