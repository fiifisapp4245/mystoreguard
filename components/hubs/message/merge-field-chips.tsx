"use client"

import { Button } from "@/components/ui/button"
import { MERGE_FIELDS } from "@/lib/message-data"

/**
 * Clickable merge-field chips shared by Compose, the Automated trigger
 * editor, and Templates — inserts the literal placeholder text into a
 * textarea at the current cursor position (or appends it if no ref/cursor
 * is available).
 */
export function MergeFieldChips({ onInsert }: { onInsert: (field: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {MERGE_FIELDS.map((field) => (
        <Button
          key={field}
          type="button"
          variant="outline"
          size="sm"
          className="h-7 rounded-full px-2.5 text-xs font-normal"
          onClick={() => onInsert(field)}
        >
          {field}
        </Button>
      ))}
    </div>
  )
}

/** Inserts `field` into `value` at the given textarea's cursor, falling back to append-at-end. */
export function insertAtCursor(
  el: HTMLTextAreaElement | null,
  value: string,
  field: string,
  setValue: (next: string) => void
) {
  if (!el) {
    setValue(value + field)
    return
  }
  const start = el.selectionStart ?? value.length
  const end = el.selectionEnd ?? value.length
  const next = value.slice(0, start) + field + value.slice(end)
  setValue(next)
  requestAnimationFrame(() => {
    el.focus()
    const pos = start + field.length
    el.setSelectionRange(pos, pos)
  })
}
