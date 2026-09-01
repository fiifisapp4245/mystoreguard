"use client"

import { Check, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isValidGhanaPhone } from "@/lib/mock-data"
import { slugify, STORE_URL_HOST, type StoreInfo } from "@/lib/online-store-data"
import { cn } from "@/lib/utils"

/**
 * Store information, shared by the setup flow and Store settings so a
 * merchant edits the same fields in the same order wherever they are.
 * Prefilled from the business profile — nothing here is asked twice.
 */
export function storeInfoProblems(info: StoreInfo): string[] {
  const problems: string[] = []
  if (!info.name.trim()) problems.push("Give your store a name")
  if (!info.slug.trim()) problems.push("Choose a web address")
  else if (info.slug !== slugify(info.slug)) {
    problems.push("Web addresses use lowercase letters, numbers and dashes only")
  }
  if (!info.phone.trim()) problems.push("Add a phone number customers can call")
  else if (!isValidGhanaPhone(info.phone)) problems.push("Enter a valid phone number, e.g. 024 123 4567")
  return problems
}

export function StoreInfoFields({
  value,
  onChange,
}: {
  value: StoreInfo
  onChange: (patch: Partial<StoreInfo>) => void
}) {
  const slugValid = Boolean(value.slug.trim()) && value.slug === slugify(value.slug)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="store-name">
            Store name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="store-name"
            value={value.name}
            placeholder="What customers should call your shop"
            onChange={(event) => {
              const name = event.target.value
              // Keep the web address in step until the merchant edits it themselves.
              const shouldFollow = !value.slug || value.slug === slugify(value.name)
              onChange({ name, ...(shouldFollow ? { slug: slugify(name) } : {}) })
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="store-slug">
            Web address <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-sm text-muted-foreground">{STORE_URL_HOST}/</span>
            <Input
              id="store-slug"
              value={value.slug}
              onChange={(event) => onChange({ slug: event.target.value })}
              aria-invalid={value.slug.length > 0 && !slugValid}
            />
            {value.slug.length > 0 && (
              <span className={cn("shrink-0", slugValid ? "text-success" : "text-destructive")}>
                {slugValid ? <Check className="size-4" /> : <X className="size-4" />}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">This is the link you share with customers.</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="store-tagline">One line about your shop</Label>
        <Input
          id="store-tagline"
          value={value.tagline}
          placeholder="e.g. Everyday provisions, delivered across Accra."
          onChange={(event) => onChange({ tagline: event.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="store-phone">
            Phone <span className="text-destructive">*</span>
          </Label>
          <Input
            id="store-phone"
            value={value.phone}
            onChange={(event) => onChange({ phone: event.target.value })}
            aria-invalid={value.phone.length > 0 && !isValidGhanaPhone(value.phone)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="store-whatsapp">WhatsApp</Label>
          <Input
            id="store-whatsapp"
            value={value.whatsapp}
            placeholder="Same as your phone"
            onChange={(event) => onChange({ whatsapp: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="store-email">Email</Label>
          <Input
            id="store-email"
            type="email"
            value={value.email}
            onChange={(event) => onChange({ email: event.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border p-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
          {value.logoInitials || "?"}
        </span>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="store-initials">Logo</Label>
          <Input
            id="store-initials"
            maxLength={3}
            value={value.logoInitials}
            placeholder="AP"
            onChange={(event) => onChange({ logoInitials: event.target.value.toUpperCase() })}
            className="w-24"
          />
          <p className="text-xs text-muted-foreground">
            Your initials stand in for a logo. Uploading an image comes later.
          </p>
        </div>
      </div>
    </div>
  )
}
