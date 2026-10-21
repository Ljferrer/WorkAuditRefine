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
// `{ rows: [], citingTasks: [] }` when the plan carries no block. The Lead threads this
// output as `args.targetArtifacts`; the engine never scans plan text itself.
//
// Exit contract:
//   0 — parsed (an absent block is a normal parse).
//   2 — no path given, the file is unreadable, or a row under the marker breaks the row shape.
//       A malformed row is loud on purpose: a silently dropped artifact would run a plan's
//       evidence seat against fewer targets than the plan declares.
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
//     The first line that is not a `- path:` bullet ends the block. More than one block
//     concatenates in document order.
//   - citingTasks: each `### Task <id>:` heading in Part 2 opens a task; its `- Plan slice:`
//     bullet (plus continuation lines up to a blank line or a new construct) cites a tag when it
//     carries `rea:ev_<64hex>`. Prose that merely mentions `rea:` does not cite.

import { readFileSync, realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const TARGET_ARTIFACTS_MARKER = '**Target artifacts**'
export const MANIFEST_PATH_TEMPLATE = 'docs/plans/evidence/<plan-slug>/<task-id>.manifest.json'
export const MANIFEST_KEYS = Object.freeze(['evidence_id', 'sha256', 'provider', 'tool', 'parameters', 'limitations'])

const PART2_H2 = /^##\s+(?:(?:AI-)?Commander's Intent|Build order|Phase\b)/
const FENCE = /^\s*```/
const ROW_START = /^\s*-\s+path:/
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
      if (!line.trim().startsWith(TARGET_ARTIFACTS_MARKER)) continue
      for (let j = i + 1; j < lines.length && ROW_START.test(lines[j]); j++) {
        const m = lines[j].match(ROW)
        if (!m) throw new Error(`malformed Target artifacts row at line ${j + 1}: ${lines[j].trim()}`)
        rows.push({ path: m[1], sha256: m[2], provider: m[3] })
        i = j
      }
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
  return { rows, citingTasks }
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
