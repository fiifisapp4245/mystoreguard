"use client"

import { useState } from "react"
import { Award, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { AREAS, formatGHS, isValidGhanaPhone } from "@/lib/mock-data"
import { enrolMember, findMemberByPhone, getLoyaltyMembersStore, type LoyaltyMember } from "@/lib/loyalty-data"

/**
 * The register's phone-first customer control. Every customer already
 * reaches the till, so identification (and 30-second inline enrolment)
 * lives here — this never blocks checkout; skipping is always one click.
 */
export function CustomerIdentificationControl({
  member,
  onAttach,
  onDetach,
}: {
  member: LoyaltyMember | null
  onAttach: (member: LoyaltyMember) => void
  onDetach: () => void
}) {
  const [query, setQuery] = useState("")
  const [showEnrol, setShowEnrol] = useState(false)
  const [enrolName, setEnrolName] = useState("")
  const [enrolPhone, setEnrolPhone] = useState("")
  const [enrolArea, setEnrolArea] = useState("")
  const [enrolConsent, setEnrolConsent] = useState(false)

  const trimmedQuery = query.trim()
  const matches =
    trimmedQuery.length >= 2
      ? getLoyaltyMembersStore()
          .filter(
            (m) =>
              m.status === "Active" &&
              (m.name.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
                m.phone.replace(/\s/g, "").includes(trimmedQuery.replace(/\s/g, "")))
          )
          .slice(0, 5)
      : []

  function handleSubmit() {
    if (!trimmedQuery) return
    const byPhone = findMemberByPhone(trimmedQuery)
    if (byPhone) {
      onAttach(byPhone)
      setQuery("")
      return
    }
    const byId = getLoyaltyMembersStore().find((m) => m.id === trimmedQuery && m.status === "Active")
    if (byId) {
      onAttach(byId)
      setQuery("")
      return
    }
    setEnrolPhone(isValidGhanaPhone(trimmedQuery) ? trimmedQuery : "")
    setEnrolName("")
    setEnrolArea("")
    setEnrolConsent(false)
    setShowEnrol(true)
  }

  const enrolMissingFields = [
    !isValidGhanaPhone(enrolPhone) && "a valid Ghana phone number",
    !enrolName.trim() && "a name",
  ].filter(Boolean) as string[]

  function handleEnrol() {
    if (!isValidGhanaPhone(enrolPhone) || !enrolName.trim()) return
    const newMember = enrolMember({
      phone: enrolPhone.replace(/\s/g, ""),
      name: enrolName.trim(),
      area: enrolArea || undefined,
      marketingConsent: enrolConsent,
    })
    onAttach(newMember)
    setShowEnrol(false)
    setQuery("")
  }

  if (member) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
        <div className="flex min-w-0 items-center gap-2">
          <Award className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{member.name}</p>
            <p className="text-xs text-muted-foreground">
              {member.tier} · {member.points} pts
              {member.storeCredit > 0 && ` · ${formatGHS(member.storeCredit)} store credit`}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onDetach} aria-label="Remove customer">
          <X className="size-3.5" />
        </Button>
      </div>
    )
  }

  if (showEnrol) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
        <p className="text-xs font-medium text-muted-foreground">Enrol — 30 seconds</p>
        <div className="flex flex-col gap-1">
          <Label htmlFor="enrol-phone" className="sr-only">
            Phone number (required)
          </Label>
          <Input
            id="enrol-phone"
            placeholder="Phone number"
            aria-required="true"
            value={enrolPhone}
            onChange={(e) => setEnrolPhone(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="enrol-name" className="sr-only">
            Name (required)
          </Label>
          <Input
            id="enrol-name"
            placeholder="Name"
            aria-required="true"
            value={enrolName}
            onChange={(e) => setEnrolName(e.target.value)}
          />
        </div>
        <Select value={enrolArea} onValueChange={setEnrolArea}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Area (optional)" />
          </SelectTrigger>
          <SelectContent>
            {AREAS.map((area) => (
              <SelectItem key={area} value={area}>
                {area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-2">
          <label htmlFor="enrol-consent" className="text-xs text-muted-foreground">
            Send me offers and updates
          </label>
          <Switch id="enrol-consent" checked={enrolConsent} onCheckedChange={setEnrolConsent} />
        </div>
        <div className="flex flex-col gap-1">
          {enrolMissingFields.length > 0 && (
            <p className="text-xs text-muted-foreground">Still needs: {enrolMissingFields.join(", ")}</p>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowEnrol(false)
                setQuery("")
              }}
            >
              Skip
            </Button>
            <Button className="flex-1" disabled={!isValidGhanaPhone(enrolPhone) || !enrolName.trim()} onClick={handleEnrol}>
              Enrol
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col gap-1">
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Phone number or loyalty ID" aria-label="Phone number or loyalty ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={handleSubmit} disabled={!trimmedQuery}>
          Find
        </Button>
      </div>
      {matches.length > 0 && (
        <div className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-sm">
          {matches.map((m) => (
            <button
              key={m.id}
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
              onClick={() => {
                onAttach(m)
                setQuery("")
              }}
            >
              <span>{m.name}</span>
              <span className="text-xs text-muted-foreground">{m.phone}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
