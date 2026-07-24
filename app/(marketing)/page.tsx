import type { Metadata } from "next"

import { CtaGroup } from "@/components/cta-group"
import { FlowDiagram } from "@/components/flow-diagram"
import { PricingTiers } from "@/components/pricing-tiers"
import { Screenshot } from "@/components/screenshot"
import { testimonials } from "@/lib/testimonials"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

const PROBLEMS = [
  "Stock disappears somewhere between the delivery van and the shelf.",
  "You don't know which staff member sold what until it's too late.",
  "End-of-day figures never quite add up.",
]

const STAFF_POINTS = [
  "Every sale, edit, and delivery is tied to the person who did it.",
  "Full audit log on every tier — never sold as an upgrade.",
  "Every staff member gets their own seat, not a shared login.",
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:flex-row lg:items-center lg:gap-16 lg:py-36">
        <div className="flex max-w-xl flex-col gap-6">
          <h1 className="font-heading text-4xl font-medium tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Know what&apos;s in your store, what sold, and who sold it.
          </h1>
          <div className="flex flex-col gap-2">
            <p className="text-lg text-muted-foreground sm:text-xl">
              Stock, sales, and staff for Ghanaian shops — one clear picture, from delivery to receipt.
            </p>
            <p className="text-sm text-muted-foreground">
              For provisions stores, pharmacies, and boutiques.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <CtaGroup />
            <p className="text-sm text-muted-foreground">First month on us.</p>
          </div>
        </div>
        <div className="w-full lg:max-w-md xl:max-w-lg">
          <Screenshot name="dashboard-home" />
        </div>
      </section>

      {/* Problem strip */}
      <section className="border-y border-border/60 bg-muted/20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-20 sm:px-6 sm:py-24 md:grid-cols-3">
          {PROBLEMS.map((problem) => (
            <p key={problem} className="font-heading text-xl font-medium text-balance sm:text-2xl">
              {problem}
            </p>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mb-12 flex flex-col gap-3">
          <h2 className="font-heading text-3xl font-medium sm:text-4xl">How it works</h2>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Every sale starts with a delivery and ends with a receipt. MyStoreGuard follows that
            whole path, so nothing gets lost in between.
          </p>
        </div>
        <FlowDiagram />
      </section>

      {/* Built for stores with staff */}
      <section className="border-y border-border/60 bg-muted/20">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-20 sm:px-6 sm:py-28">
          <h2 className="font-heading text-3xl font-medium sm:text-4xl">Built for stores with staff</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {STAFF_POINTS.map((point) => (
              <p key={point} className="text-lg text-muted-foreground">
                {point}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof — renders only when testimonials exist */}
      {testimonials.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <figure key={testimonial.name} className="flex flex-col gap-3">
                <blockquote className="text-lg">&ldquo;{testimonial.quote}&rdquo;</blockquote>
                <figcaption className="text-sm text-muted-foreground">
                  {testimonial.name} · {testimonial.shop}, {testimonial.location}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Pricing teaser */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <h2 className="font-heading text-3xl font-medium sm:text-4xl">Plans that grow with your shop</h2>
          <p className="max-w-xl text-lg text-muted-foreground">
            Every tier starts with a free first month. See what&apos;s included, plan by plan.
          </p>
        </div>
        <PricingTiers teaser />
      </section>

      {/* Closing CTA */}
      <section className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-28">
          <h2 className="font-heading text-3xl font-medium sm:text-4xl">
            See your whole store, from delivery to receipt.
          </h2>
          <CtaGroup />
        </div>
      </section>
    </>
  )
}
