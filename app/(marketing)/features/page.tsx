import type { Metadata } from "next"

import { CtaGroup } from "@/components/cta-group"
import { FlowStrip } from "@/components/flow-strip"
import { Screenshot } from "@/components/screenshot"
import { GROUPS, getModule } from "@/lib/modules"

export const metadata: Metadata = {
  title: "Features — MyStoreGuard",
  description: "Everything MyStoreGuard does, grouped the same way it appears in your dashboard.",
  openGraph: {
    title: "Features — MyStoreGuard",
    description: "Everything MyStoreGuard does, grouped the same way it appears in your dashboard.",
  },
  twitter: {
    title: "Features — MyStoreGuard",
    description: "Everything MyStoreGuard does, grouped the same way it appears in your dashboard.",
  },
  alternates: { canonical: "/features" },
}

const GROUP_COPY: Record<string, string> = {
  home: "The first screen you see when you open the till. Today's sales, expenses, and profit — plus your best-selling product — before you've had your first cup of tea.",
  sell: "Everything that happens at the counter and beyond it. Ring up daily sales, credit sales, and deposits, send a proper invoice when a customer needs one, quote a price before you commit to a sale, and know a delivery reached the right hands.",
  stock:
    "Know what you have before you run out — or over-order. Log every purchase, split cartons into sellable units, move stock from the warehouse to the shop floor, and count what's actually on the shelf.",
  people:
    "Customers, suppliers, and staff — all in one place, so you're not hunting through notebooks and old messages to find who owes what.",
  grow: "Bring customers back without guesswork. Reward loyal customers, run promo codes and gift cards, work with referral partners, take bookings, and keep customers in the loop by message.",
  money:
    "See where the money actually goes. Record every expense as it happens, and pull a report that tells you the real story — not just what you remember at closing time.",
  system:
    "The controls behind everything else. Set your prices and tax rules, keep an audit log of every change — included on every plan — route tasks and approvals between staff, and get step-by-step guidance whenever you need it.",
}

export default function FeaturesPage() {
  return (
    <>
      <section className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-16 text-center sm:px-6 sm:py-24">
        <h1 className="font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Everything MyStoreGuard does
        </h1>
        <p className="text-lg text-muted-foreground sm:text-xl">
          Grouped the same way it appears in your dashboard — so what you read here is exactly
          what your staff will see on the shop floor.
        </p>
        <FlowStrip className="mt-2 justify-center" />
      </section>

      {GROUPS.map((group) => {
        const modules = group.moduleIds.map(getModule).filter((m): m is NonNullable<typeof m> => Boolean(m))

        return (
          <section
            key={group.id}
            id={group.id}
            className="scroll-mt-20 border-t border-border/60 odd:bg-muted/20"
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:flex-row lg:items-start lg:gap-16">
              <div className="flex max-w-lg flex-col gap-4 lg:flex-1">
                <h2 className="font-heading text-3xl font-medium sm:text-4xl">{group.label}</h2>
                <p className="text-lg text-muted-foreground">{GROUP_COPY[group.id]}</p>
                <ul className="flex flex-col gap-3 border-t border-border/60 pt-4">
                  {modules.map((module) => (
                    <li key={module.id}>
                      <p className="font-medium">
                        {module.name}
                        {module.addon && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">Add-on</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-full lg:flex-1">
                <Screenshot name={`group-${group.id}`} />
              </div>
            </div>
          </section>
        )
      })}

      <section className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-24">
          <h2 className="font-heading text-3xl font-medium sm:text-4xl">
            See it running on real store data.
          </h2>
          <CtaGroup />
        </div>
      </section>
    </>
  )
}
