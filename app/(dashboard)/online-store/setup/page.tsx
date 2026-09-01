import { SetupWizard } from "@/components/online-store/setup-wizard"

export const metadata = {
  title: "Set up your online store — MyStoreGuard",
}

/**
 * The guided activation flow lives at its own route rather than as a hub tab
 * — it's a start-to-finish task, not a place the merchant returns to. Once
 * the store is live, Store settings is where individual things get changed.
 */
export default function OnlineStoreSetupPage() {
  return <SetupWizard />
}
