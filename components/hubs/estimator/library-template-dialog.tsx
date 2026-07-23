"use client"

import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getTemplatesStore, LIBRARY_TEMPLATES, setTemplatesStore, type Template } from "@/lib/estimator-data"
import { TODAY_ISO } from "@/lib/period-utils"

export function LibraryTemplateDialog({
  open,
  onOpenChange,
  editHrefFor,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editHrefFor: (id: string) => string
}) {
  const router = useRouter()

  function handlePick(library: Template) {
    const newId = `${library.id}-copy-${getTemplatesStore().length + 1}`
    const duplicated: Template = {
      ...library,
      id: newId,
      name: `${library.name} (copy)`,
      status: "Inactive",
      createdDate: TODAY_ISO,
    }
    setTemplatesStore([duplicated, ...getTemplatesStore()])
    onOpenChange(false)
    router.push(editHrefFor(newId))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Start from a library template</DialogTitle>
          <DialogDescription>Duplicate a ready-made template and adjust it — far less work than building from scratch.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {LIBRARY_TEMPLATES.map((library) => (
            <Card
              key={library.id}
              className="cursor-pointer transition-colors hover:bg-accent/40"
              onClick={() => handlePick(library)}
            >
              <CardContent className="flex flex-col gap-1.5 py-3">
                <p className="font-medium">{library.name}</p>
                <Badge variant="outline" className="w-fit font-normal">
                  {library.domain}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {library.lineItems.length} line item{library.lineItems.length === 1 ? "" : "s"} · {library.fields.length} field
                  {library.fields.length === 1 ? "" : "s"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
