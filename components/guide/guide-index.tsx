"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Award,
  Calculator,
  Compass,
  Mail,
  MessageCircle,
  Phone,
  RotateCcw,
  Settings,
  ShoppingCart,
  Truck,
  Wallet,
  Warehouse,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useDemoState } from "@/hooks/use-demo-state"
import {
  GUIDE_CATEGORIES,
  WHATS_NEW,
  SUPPORT_CONTACT,
  articlesForCategory,
  popularArticles,
  searchArticles,
} from "@/lib/guide-data"
import { formatDateDisplay } from "@/lib/period-utils"
import { resetSetupChecklist } from "@/lib/setup-checklist-data"

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "getting-started": Compass,
  selling: ShoppingCart,
  stock: Warehouse,
  money: Wallet,
  loyalty: Award,
  estimator: Calculator,
  deliveries: Truck,
  settings: Settings,
}

function snippet(body: string[]): string {
  return body[0] ?? ""
}

export function GuideIndex() {
  const router = useRouter()
  const { update } = useDemoState()
  const [query, setQuery] = useState("")
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const searchResults = useMemo(() => searchArticles(query), [query])
  const isSearching = query.trim().length > 0

  const popular = useMemo(() => popularArticles(5), [])

  function handleReplayChecklist() {
    resetSetupChecklist()
    update({ storeState: "new" })
    router.push("/")
    toast.success("Setup checklist replayed — check the Dashboard.")
  }

  const whatsappHref = `https://wa.me/${SUPPORT_CONTACT.whatsapp.replace(/\D/g, "")}`

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Guide"
        subtitle="Search, browse, or ask — everything you need to run the store."
      />

      <Input
        placeholder="Search the guide — try 'stocktake' or 'day close'..." aria-label="Search the guide — try 'stocktake' or 'day close'"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-12 text-base"
      />

      {isSearching ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {searchResults.length} {searchResults.length === 1 ? "article" : "articles"} matching &ldquo;{query}&rdquo;
          </p>
          {searchResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">No articles match.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {searchResults.map((article) => (
                <Link key={article.id} href={`/guide/${article.id}`}>
                  <Card className="h-full transition-colors hover:bg-accent/50">
                    <CardHeader>
                      <CardTitle>{article.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{snippet(article.body)}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {expandedCategory ? (
              <>
                <Button variant="ghost" size="sm" className="w-fit" onClick={() => setExpandedCategory(null)}>
                  ← All categories
                </Button>
                <div className="flex flex-col gap-1 rounded-xl border p-2">
                  {articlesForCategory(expandedCategory).map((article) => (
                    <Link
                      key={article.id}
                      href={`/guide/${article.id}`}
                      className="rounded-lg px-3 py-2 text-sm hover:bg-accent/50"
                    >
                      {article.title}
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {GUIDE_CATEGORIES.map((category) => {
                  const Icon = CATEGORY_ICONS[category.id] ?? Compass
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setExpandedCategory(category.id)}
                      className="text-left"
                    >
                      <Card className="h-full transition-colors hover:bg-accent/50">
                        <CardHeader>
                          <Icon className="size-5 text-muted-foreground" />
                          <CardTitle>{category.label}</CardTitle>
                          <CardDescription>{category.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Popular right now</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {popular.map((article) => (
                <Link key={article.id} href={`/guide/${article.id}`}>
                  <Card className="h-full transition-colors hover:bg-accent/50">
                    <CardHeader>
                      <CardTitle>{article.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{snippet(article.body)}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold tracking-tight">What&apos;s new</h2>
            <div className="flex flex-col gap-2 rounded-xl border p-4">
              {WHATS_NEW.map((entry) => (
                <div key={entry.dateISO} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                  <span className="w-28 shrink-0 text-sm text-muted-foreground">
                    {formatDateDisplay(entry.dateISO)}
                  </span>
                  <span className="text-sm">{entry.text}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contact support</CardTitle>
          <CardDescription>{SUPPORT_CONTACT.hours}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
          >
            <MessageCircle className="size-4" />
            WhatsApp: {SUPPORT_CONTACT.whatsapp}
          </a>
          <a
            href={`tel:${SUPPORT_CONTACT.phone}`}
            className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
          >
            <Phone className="size-4" />
            {SUPPORT_CONTACT.phone}
          </a>
          <a
            href={`mailto:${SUPPORT_CONTACT.email}`}
            className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
          >
            <Mail className="size-4" />
            {SUPPORT_CONTACT.email}
          </a>
        </CardContent>
      </Card>

      <div>
        <Button variant="outline" onClick={handleReplayChecklist}>
          <RotateCcw className="size-4" />
          Replay setup checklist
        </Button>
      </div>
    </div>
  )
}
