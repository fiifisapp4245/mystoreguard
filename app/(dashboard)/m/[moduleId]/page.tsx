import { notFound } from "next/navigation"

import { ModulePage } from "@/components/module-page"
import { getModule, MODULES } from "@/lib/modules"

export function generateStaticParams() {
  return MODULES.map((module) => ({ moduleId: module.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ moduleId: string }>
}) {
  const { moduleId } = await params
  const moduleConfig = getModule(moduleId)

  return {
    title: moduleConfig ? `${moduleConfig.name} — MyStoreGuard` : "Not found — MyStoreGuard",
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ moduleId: string }>
}) {
  const { moduleId } = await params
  const moduleConfig = getModule(moduleId)

  if (!moduleConfig) {
    notFound()
  }

  return <ModulePage module={moduleConfig} />
}
