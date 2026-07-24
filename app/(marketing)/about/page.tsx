import type { Metadata } from "next"
import { FileCheck, Lock, ShieldCheck } from "lucide-react"

import { CtaGroup } from "@/components/cta-group"
import { TEAM } from "@/lib/team"

export const metadata: Metadata = {
  title: "About — MyStoreGuard",
  description: "Why MyStoreGuard exists, who's building it, and how we handle your data.",
  openGraph: {
    title: "About — MyStoreGuard",
    description: "Why MyStoreGuard exists, who's building it, and how we handle your data.",
  },
  twitter: {
    title: "About — MyStoreGuard",
    description: "Why MyStoreGuard exists, who's building it, and how we handle your data.",
  },
  alternates: { canonical: "/about" },
}

const TRUST_POINTS = [
  {
    icon: Lock,
    title: "Your data is protected",
    description:
      "Your records are backed up and only your own staff accounts can reach them — ask us for the specifics if you need them for your own compliance checks.",
  },
  {
    icon: ShieldCheck,
    title: "Audit logs in every tier",
    description:
      "Every sale, edit, and delivery is tied to the staff member who did it — on Light, Prime, and Ultra alike. Not an upgrade you have to pay extra for.",
  },
  {
    icon: FileCheck,
    title: "Your records belong to you",
    description: "It's your stock, your sales, and your money. You can export your records whenever you need to.",
  },
]

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16 sm:px-6 sm:py-24">
        <h1 className="font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Why MyStoreGuard exists
        </h1>
        <div className="flex flex-col gap-4 text-lg text-muted-foreground">
          <p>
            Ghanaian shops don&apos;t run like the businesses most retail software is built for.
            Stock arrives by the carton, not the pallet. Sales happen on credit as often as cash.
            A shop owner isn&apos;t just watching a screen — they&apos;re watching a shelf, a
            till, and a member of staff, all at once.
          </p>
          <p>
            We built MyStoreGuard for that reality, not adapted from somewhere else. From the
            moment a delivery arrives to the moment a customer walks out with a receipt, you
            should be able to see exactly what happened, and who was responsible for it.
          </p>
        </div>
      </section>

      {TEAM.length > 0 && (
        <section className="border-y border-border/60 bg-muted/20">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 sm:py-24">
            <h2 className="font-heading text-3xl font-medium sm:text-4xl">Team</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {TEAM.map((member) => (
                <div key={member.role} className="flex flex-col gap-1 rounded-xl border bg-background p-6">
                  <p className="font-heading font-medium">{member.name}</p>
                  <p className="text-sm text-primary">{member.role}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="mb-8 font-heading text-3xl font-medium sm:text-4xl">
          How we handle your data
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {TRUST_POINTS.map((point) => (
            <div key={point.title} className="flex flex-col gap-2">
              <point.icon className="size-6 text-primary" aria-hidden="true" />
              <h3 className="font-heading font-medium">{point.title}</h3>
              <p className="text-sm text-muted-foreground">{point.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-24">
          <h2 className="font-heading text-3xl font-medium sm:text-4xl">
            Ready to see it running on your own stock?
          </h2>
          <CtaGroup />
        </div>
      </section>
    </>
  )
}
