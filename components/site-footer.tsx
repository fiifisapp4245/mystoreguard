import Link from "next/link"
import { Mail, MessageCircle, ShieldCheck } from "lucide-react"

import { Separator } from "@/components/ui/separator"
import { siteConfig, whatsappLink } from "@/lib/site-config"

const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

// No Privacy policy / Terms of service pages exist yet. Omitted rather than
// linked as dead "#" anchors — add real pages (and the links back) before
// public launch.

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold">
              <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
              MyStoreGuard
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              Stock, sales, staff, and money — one clear picture, from delivery to receipt.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-2 text-sm">
            <a
              href={whatsappLink(siteConfig.whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Chat on WhatsApp
            </a>
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Mail className="size-4" aria-hidden="true" />
              {siteConfig.contactEmail}
            </a>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Made in Ghana 🇬🇭</p>
        </div>
      </div>
    </footer>
  )
}
