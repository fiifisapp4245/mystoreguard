import { notFound, redirect } from "next/navigation"

import { GROUPS, getHub, hubFirstTabPath } from "@/lib/modules"

export function generateStaticParams() {
  return GROUPS.filter((g) => g.type === "hub").map((g) => ({ hubId: g.id }))
}

export default async function HubIndexPage({
  params,
}: {
  params: Promise<{ hubId: string }>
}) {
  const { hubId } = await params

  if (!getHub(hubId)) {
    notFound()
  }

  redirect(hubFirstTabPath(hubId))
}
