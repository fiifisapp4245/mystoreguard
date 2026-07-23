import { TemplateDetailView } from "@/components/estimator/template-detail-view"
import { TEMPLATES } from "@/lib/estimator-data"

export function generateStaticParams() {
  return TEMPLATES.map((template) => ({ id: template.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const template = TEMPLATES.find((t) => t.id === id)
  return {
    title: template ? `${template.name} — MyStoreGuard` : "Template — MyStoreGuard",
  }
}

/**
 * Templates created or duplicated at runtime (e.g. from the library) live
 * only in the client-side store, not the build-time TEMPLATES array — so
 * the actual lookup happens inside TemplateDetailView (a Client Component),
 * against the live store, rather than gating on a server-side notFound().
 */
export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TemplateDetailView templateId={id} />
}
