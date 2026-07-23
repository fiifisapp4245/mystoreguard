import { notFound } from "next/navigation"

import { TemplateDetailView } from "@/components/estimator/template-detail-view"
import { TEMPLATES } from "@/lib/estimator-data"

export function generateStaticParams() {
  return TEMPLATES.map((template) => ({ id: template.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const template = TEMPLATES.find((t) => t.id === id)
  return {
    title: template ? `${template.name} — MyStoreGuard` : "Not found — MyStoreGuard",
  }
}

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const template = TEMPLATES.find((t) => t.id === id)

  if (!template) {
    notFound()
  }

  return <TemplateDetailView template={template} />
}
