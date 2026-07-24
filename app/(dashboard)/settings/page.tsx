import { redirect } from "next/navigation"

import { FIRST_SETTINGS_SECTION_ID } from "@/lib/settings-registry"

export default function SettingsIndexPage() {
  redirect(`/settings/${FIRST_SETTINGS_SECTION_ID}`)
}
