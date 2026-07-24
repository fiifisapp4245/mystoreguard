#!/usr/bin/env node
/**
 * Fails the build if placeholder/internal-notes text ("TODO", "TBD") has
 * crept back into anything the marketing site renders to a real visitor.
 * See ID-02 in the July 2026 QA audit — a literal "TODO: replace with the
 * real booking link" and "Founder name TBD" were live on production.
 *
 * This intentionally does NOT scan the whole repo: TODOs in dashboard/demo
 * code are normal working notes for an internal prototype. Scope is the
 * public marketing surface only.
 */
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = fileURLToPath(new URL("..", import.meta.url))

const DIRS_TO_SCAN = ["app/(marketing)"]

const FILES_TO_SCAN = [
  "lib/team.ts",
  "lib/testimonials.ts",
  "lib/site-config.ts",
  "lib/pricing.ts",
  "components/site-header.tsx",
  "components/site-footer.tsx",
  "components/cta-group.tsx",
  "components/pricing-tiers.tsx",
  "components/whatsapp-cta.tsx",
  "components/comparison-table.tsx",
  "components/flow-diagram.tsx",
  "components/screenshot.tsx",
]

const PLACEHOLDER_PATTERN = /\bTODO\b|\bTBD\b/

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) walk(full, out)
    else if (/\.(tsx?|jsx?)$/.test(entry)) out.push(full)
  }
  return out
}

const files = [
  ...DIRS_TO_SCAN.flatMap((dir) => walk(join(ROOT, dir))),
  ...FILES_TO_SCAN.map((f) => join(ROOT, f)),
]

let failed = false

for (const file of files) {
  let contents
  try {
    contents = readFileSync(file, "utf8")
  } catch {
    continue // FILES_TO_SCAN entries are best-effort; skip if renamed/removed
  }
  const lines = contents.split("\n")
  lines.forEach((line, i) => {
    if (PLACEHOLDER_PATTERN.test(line)) {
      failed = true
      console.error(`${file.replace(ROOT, "")}:${i + 1}: ${line.trim()}`)
    }
  })
}

if (failed) {
  console.error("\n✖ Placeholder text (TODO/TBD) found in marketing-facing content — see above.")
  process.exit(1)
} else {
  console.log("✓ No placeholder text found in marketing-facing content.")
}
