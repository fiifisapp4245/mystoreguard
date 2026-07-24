/**
 * Announces filtered/searched list result counts to screen reader users.
 *
 * Sighted users see the row count in a table change as they type into a
 * search box or flip a filter — screen reader users get nothing unless we
 * announce it explicitly. This renders a visually-hidden, polite live
 * region right after a screen's search/filter toolbar so assistive tech
 * reads out the new count each time it changes.
 */
export function LiveResultCount({
  count,
  itemLabel,
}: {
  count: number
  itemLabel: string
}) {
  const label = count === 1 || itemLabel.endsWith("s") ? itemLabel : pluralize(itemLabel)

  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {count} {label} shown
    </div>
  )
}

/** Deliberately minimal — just the two irregular-plural shapes that show up
 * in this app's nouns ("delivery" → "deliveries"), otherwise a plain "+s". */
function pluralize(word: string): string {
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`
  return `${word}s`
}
