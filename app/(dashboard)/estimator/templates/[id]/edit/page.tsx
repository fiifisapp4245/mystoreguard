import { TemplateBuilderForm } from "@/components/estimator/template-builder-form"
import { TEMPLATES } from "@/lib/estimator-data"

export function generateStaticParams() {
  return TEMPLATES.map((template) => ({ id: template.id }))
}

export const metadata = {
  title: "Edit template — MyStoreGuard",
}

/**
 * Templates duplicated from the library exist only in the client-side
 * store, not the build-time TEMPLATES array — so the lookup happens inside
 * TemplateBuilderForm (a Client Component), against the live store.
 */
export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TemplateBuilderForm templateId={id} />
}
