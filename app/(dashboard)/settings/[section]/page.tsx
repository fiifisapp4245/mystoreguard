import { notFound } from "next/navigation"

import { SettingsShell } from "@/components/settings/settings-shell"
import { getSettingsSection, SETTINGS_SECTIONS } from "@/lib/settings-registry"

export function generateStaticParams() {
  return SETTINGS_SECTIONS.map((section) => ({ section: section.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  const settingsSection = getSettingsSection(section)

  return {
    title: settingsSection ? `${settingsSection.label} — Settings — MyStoreGuard` : "Not found — MyStoreGuard",
  }
}

export default async function SettingsSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params

  if (!getSettingsSection(section)) {
    notFound()
  }

  return <SettingsShell activeSectionId={section} />
}
