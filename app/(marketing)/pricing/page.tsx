import type { Metadata } from "next"

import { ComparisonTable } from "@/components/comparison-table"
import { PricingTiers } from "@/components/pricing-tiers"
import { WhatsAppCta } from "@/components/whatsapp-cta"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { ADDONS, FAQ } from "@/lib/pricing"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "Pricing — MyStoreGuard",
  description: "Light, Prime, and Ultra plans for Ghanaian shops with staff. Free first month on every tier.",
}

export default function PricingPage() {
  return (
    <>
      <section className="border-b border-border/60 bg-muted/20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center sm:px-6">
          <Badge variant="secondary" className="text-sm">
            Free first month on every tier
          </Badge>
        </div>
      </section>

      <section className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-16 text-center sm:px-6 sm:py-20">
        <h1 className="font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Plans that grow with your shop
        </h1>
        <p className="text-lg text-muted-foreground sm:text-xl">
          Three tiers, built around what your shop actually needs — not a one-size-fits-all
          license.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <PricingTiers />
      </section>

      <section className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6 sm:py-24">
          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-3xl font-medium sm:text-4xl">Compare every module</h2>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Generated straight from the product — the same groups and modules your staff see in
              the dashboard sidebar.
            </p>
          </div>
          <ComparisonTable />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-8 flex flex-col gap-2">
          <h2 className="font-heading text-3xl font-medium sm:text-4xl">Add-ons</h2>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Extend any tier without upgrading the whole plan.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {ADDONS.map((addon) => (
            <div key={addon.name} className="flex flex-col gap-2 rounded-xl border p-6">
              <h3 className="font-heading text-lg font-medium">{addon.name}</h3>
              <p className="text-sm text-muted-foreground">{addon.description}</p>
              <p className="text-sm font-medium">{addon.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-24">
          <h2 className="font-heading text-2xl font-medium sm:text-3xl">
            Not sure which tier fits your shop?
          </h2>
          <WhatsAppCta
            number={siteConfig.whatsappNumber}
            message="Hi, I'd like some help choosing a MyStoreGuard plan for my shop."
          >
            Chat on WhatsApp
          </WhatsAppCta>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="mb-8 font-heading text-3xl font-medium sm:text-4xl">Frequently asked questions</h2>
        <Accordion type="single" collapsible className="w-full">
          {FAQ.map((entry, index) => (
            <AccordionItem key={entry.question} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-heading text-base font-medium">
                {entry.question}
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2 text-muted-foreground">
                <p>{entry.answer}</p>
                {entry.todo && (
                  <p className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                    TODO: {entry.todo}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </>
  )
}
