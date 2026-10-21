#!/usr/bin/env node
// target-artifacts.mjs — the `**Target artifacts**` block parser (plan 2026-10-20-rea-artifact-
// evidence Task 1.7; D8, D18; PIN-6, PIN-15). Node >= 24.
//
// The machine source for three restated facts (ADR 0025 rule 8). Every doc surface either
// names these constants or carries the value behind a fixed lead-in that
// target-artifacts.test.mjs extracts and compares to the export:
//   TARGET_ARTIFACTS_MARKER — the block's marker line, verbatim.
//   MANIFEST_PATH_TEMPLATE  — where a worker commits the digest manifest, on the task branch.
//   MANIFEST_KEYS           — the only keys a manifest carries (G6); any other key is payload.
// The grammar, the digest rule and the cite-only rule live in
// skills/war-strategy/references/artifact-evidence.md, never here.
//
// Usage:
//   node target-artifacts.mjs <plan.md>
// Prints one JSON object: { rows: [{ path, sha256, provider }], citingTasks: ['1.1', ...] }.
// `{ rows: [], citingTasks: [] }` when the plan carries no block. The Lead threads `rows` as
// `args.targetArtifacts` and adds the evidence seat only on the `citingTasks` tasks; the engine
// never scans plan text itself.
//
// Exit contract:
//   0 — parsed (an absent block is a normal parse).
//   2 — no path given, the file is unreadable, a row under the marker breaks the row shape,
//       the marker carries no `- path:` row at all (a `* path:` bullet, a table row, a heading),
//       or a row-shaped line sits in Part 1 outside any block (an orphan: after a continuation
//       line, after prose, or with no marker above it). Row-shaped means the line opens as
//       `- path: \`<path>\` · sha256:` (ROW_HEAD), so an orphan with a bad sha256 or a missing
//       provider is loud too, never read as prose. A malformed, rowless or orphaned row is
//       loud on purpose: a silently dropped artifact would run a plan's evidence seat against
//       fewer targets than the plan declares. The rule: every row-shaped line in Part 1 reaches
//       `rows`, or the parse throws.
//
// Parse rules:
//   - Part 1 is every line before the first Part 2 H2: `## Commander's Intent` (either ADR 0014
//     heading), `## Build order` or `## Phase`. The block has placement latitude anywhere in
//     Part 1 and is never a required H2 (G14).
//   - Code fences (``` lines) hide their contents from every rule; the fence line itself is
//     skipped. A fenced example block or tag is inert.
//   - The marker is a line whose trimmed text starts with TARGET_ARTIFACTS_MARKER. Its rows
//     follow on the next lines, one per artifact, in the shape artifact-evidence.md shows:
//       - path: `<path>` · sha256: `<64 lowercase hex>` · provider: `<name>`
//     Blank lines between the marker and the first row, and between rows, are skipped (valid
//     Markdown puts one under the marker; a loose list puts one between every row). The first
//     non-blank line under the marker must be a `- path:` row, or the marker is rowless and the
//     parse throws. After a row, the next non-blank line that is not a `- path:` bullet ends the
//     block. A row-shaped line (ROW_HEAD) the outer loop then meets in Part 1 is an orphan and
//     throws; a `- path:` bullet that does not open as a row is ordinary prose outside a block.
//     More than one block concatenates in document order.
//   - citingTasks: each `### Task <id>:` heading in Part 2 opens a task; its `- Plan slice:`
//     bullet (plus continuation lines up to a blank line or a new construct) cites a tag when it
//     carries `rea:ev_<64hex>`. Prose that merely mentions `rea:` does not cite. A bullet other
//     than `- Plan slice:` (`- Done when:`, `- Files:`) never cites. citingTasks is empty when
//     no block rows exist: a citation with no declared target seats nothing.

import { readFileSync, realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const TARGET_ARTIFACTS_MARKER = '**Target artifacts**'
export const MANIFEST_PATH_TEMPLATE = 'docs/plans/evidence/<plan-slug>/<task-id>.manifest.json'
export const MANIFEST_KEYS = Object.freeze(['evidence_id', 'sha256', 'provider', 'tool', 'parameters', 'limitations'])

const PART2_H2 = /^##\s+(?:(?:AI-)?Commander's Intent|Build order|Phase\b)/
const FENCE = /^\s*```/
const ROW_START = /^\s*-\s+path:/
// The orphan guard's key: a line that opens as a row (backticked path, then `· sha256:`), whether
// or not the rest of ROW holds. Narrower than ROW_START (a prose `- path:` bullet is inert) and
// wider than ROW (a row-shaped orphan with a bad sha256 or no provider still throws).
const ROW_HEAD = /^\s*-\s+path:\s*`[^`]+`\s*·\s*sha256:/
const ROW = /^\s*-\s+path:\s*`([^`]+)`\s*·\s*sha256:\s*`([0-9a-f]{64})`\s*·\s*provider:\s*`([^`]+)`\s*$/
const TASK_H3 = /^###\s+Task\s+(\S+?):/
const PLAN_SLICE = /^\s*-\s+Plan slice:/
const NEW_CONSTRUCT = /^\s*(#{1,6}\s|\*\*|-\s)/
const REA_TAG = /\brea:ev_[0-9a-f]{64}\b/

export function parseTargetArtifacts(text) {
  const lines = String(text).split(/\r?\n/)
  const rows = []
  const citingTasks = []
  let inFence = false
  let inPart1 = true
  let task = null        // current task id (Part 2)
  let slice = null       // accumulating Plan slice text for `task`, or null

  const closeSlice = () => {
    if (slice != null && task != null && REA_TAG.test(slice) && !citingTasks.includes(task)) citingTasks.push(task)
    slice = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (FENCE.test(line)) { inFence = !inFence; continue }
    if (inFence) continue

    if (inPart1 && PART2_H2.test(line)) inPart1 = false

    if (inPart1) {
      if (!line.trim().startsWith(TARGET_ARTIFACTS_MARKER)) {
        // A row-shaped line the row loop did not consume is an orphan: loud, never dropped.
        // ROW_HEAD, not ROW_START, so a plain `- path:` bullet in prose never trips it, and not
        // ROW, so a row-shaped orphan with a bad field does not pass as prose.
        if (ROW_HEAD.test(line)) throw new Error(`orphan Target artifacts row at line ${i + 1}: ${line.trim()}`)
        continue
      }
      const marker = i + 1
      // Blank lines under the marker and between rows are skipped by one predicate; `i` advances
      // only over consumed rows, so a non-row after a blank (a second marker, a heading) is
      // re-read by the outer loop, and a row-shaped line re-read there is an orphan.
      const nextNonBlank = k => { while (k < lines.length && lines[k].trim() === '') k++; return k }
      let j = nextNonBlank(i + 1)
      const first = j
      for (; j < lines.length && ROW_START.test(lines[j]); j = nextNonBlank(j + 1)) {
        const m = lines[j].match(ROW)
        if (!m) throw new Error(`malformed Target artifacts row at line ${j + 1}: ${lines[j].trim()}`)
        rows.push({ path: m[1], sha256: m[2], provider: m[3] })
        i = j
      }
      // Rowless marker (`* path:`, a table row, a heading, end of file): loud, never rows [].
      if (j === first) throw new Error(`Target artifacts marker at line ${marker} carries no rows`)
      continue
    }

    const h = line.match(TASK_H3)
    if (h) { closeSlice(); task = h[1]; continue }
    if (PLAN_SLICE.test(line)) { closeSlice(); slice = line; continue }
    if (slice != null) {
      if (line.trim() === '' || NEW_CONSTRUCT.test(line)) closeSlice()
      else slice += '\n' + line
    }
  }
  closeSlice()
  return { rows, citingTasks: rows.length ? citingTasks : [] }
}

// ---- CLI --------------------------------------------------------------------------------
const isMain = (() => {
  try { return realpathSync(process.argv[1] ?? '') === realpathSync(fileURLToPath(import.meta.url)) } catch { return false }
})()

if (isMain) {
  const file = process.argv[2]
  if (!file) {
    process.stderr.write('target-artifacts: usage: node target-artifacts.mjs <plan.md>\n')
    process.exit(2)
  }
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch (e) {
    process.stderr.write(`target-artifacts: cannot read ${file}: ${e.message}\n`)
    process.exit(2)
  }
  try {
    process.stdout.write(JSON.stringify(parseTargetArtifacts(text)) + '\n')
  } catch (e) {
    process.stderr.write(`target-artifacts: ${file}: ${e.message}\n`)
    process.exit(2)
  }
}
