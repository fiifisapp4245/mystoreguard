import { notFound } from "next/navigation"

import { TemplateBuilderForm } from "@/components/estimator/template-builder-form"
import { TEMPLATES } from "@/lib/estimator-data"

export function generateStaticParams() {
  return TEMPLATES.map((template) => ({ id: template.id }))
}

export const metadata = {
  title: "Edit template — MyStoreGuard",
}

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const template = TEMPLATES.find((t) => t.id === id)

  if (!template) {
    notFound()
  }

  return <TemplateBuilderForm initialTemplate={template} />
}
