// target-artifacts.test.mjs — the `**Target artifacts**` parser (plan 2026-10-20-rea-artifact-
// evidence Task 1.7; D8, D18; PIN-6, PIN-15) and its doc-token guard.
//
// Two tests, titled exactly as End-state 20 names them:
//   1. the parser reads block rows anywhere in Part 1, skips code fences, and names the tasks
//      whose `Plan slice:` cites a `rea:` tag; the CLI prints the same object and exits 2 on an
//      unreadable file;
//   2. the doc-token guard (ADR 0025 rule 8, extraction plus equality): every surface in the
//      per-surface map carries a lead-in-anchored value, and that value deepEquals the export.
//      `CONTEXT.md` and `artifact-evidence-lead.md` are NOT in the map — they name constants.
//
// Repo root resolves from import.meta.url, never process.cwd(): a WAR subagent's cwd is the
// main checkout and resets between bash calls.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

import {
  TARGET_ARTIFACTS_MARKER,
  MANIFEST_PATH_TEMPLATE,
  MANIFEST_KEYS,
  parseTargetArtifacts,
} from './target-artifacts.mjs'

const HERE = dirname(fileURLToPath(import.meta.url)) // skills/war/assets
const REPO = resolve(HERE, '..', '..', '..')
const CLI = join(HERE, 'target-artifacts.mjs')
const src = rel => readFileSync(join(REPO, rel), 'utf8')

const HEX = '0123456789abcdef'.repeat(4) // 64 lowercase hex
const HEX2 = 'fedcba9876543210'.repeat(4)
const EV = 'ev_' + 'abcdef0123456789'.repeat(4)

// A merged plan whose block sits in the Assumptions ledger (not at a fixed slot), with a
// fenced decoy block in Part 1, an unfenced decoy block in Part 2, and three tasks: 1.1 cites a
// rea: tag in its Plan slice, 1.2 only talks about `rea:` in prose, 2.1 cites one inside a fence.
const PLAN = `# A plan
## Context — the gap / problem
Some claim (verified: rea:${EV} at sha256:${HEX}).
## Pivotal constraints
- none
## Resolved design tree
| D1 | x | y |
\`\`\`
**Target artifacts**
- path: \`/fenced/decoy.bin\` · sha256: \`${HEX2}\` · provider: \`ghidra\`
\`\`\`
## Assumptions ledger
- A1 · basis · blast radius · check
**Target artifacts**
- path: \`/opt/app/app.bin\` · sha256: \`${HEX}\` · provider: \`ghidra\`
- path: \`/opt/app/lib.dylib\` · sha256: \`${HEX2}\` · provider: \`rizin\`

## Non-goals / deferred
## Commander's Intent
- Purpose: p
## Build order (for /war)
- Phase 1
## Phase 1 — one
### Task 1.1: cites
- Files: \`a.mjs\`
- Plan slice: do the thing (verified: rea:${EV} at sha256:${HEX}).
- requiresTest: true
### Task 1.2: prose only
- Files: \`b.mjs\`
- Plan slice: the lint flags a \`rea:\` source without a base; never cites a record.
**Target artifacts**
- path: \`/part2/decoy.bin\` · sha256: \`${HEX}\` · provider: \`ghidra\`
- requiresTest: true
## Phase 2 — two
### Task 2.1: fenced
- Files: \`c.mjs\`
- Plan slice: see the example:
\`\`\`
(verified: rea:${EV} at sha256:${HEX})
\`\`\`
- requiresTest: true
## Deferred validations (backstops)
None
`

test('target-artifacts: parses rows anywhere in Part 1, fence-aware, and names citing tasks', () => {
  assert.equal(TARGET_ARTIFACTS_MARKER, '**Target artifacts**')
  assert.equal(MANIFEST_PATH_TEMPLATE, 'docs/plans/evidence/<plan-slug>/<task-id>.manifest.json')
  assert.deepEqual(MANIFEST_KEYS, ['evidence_id', 'sha256', 'provider', 'tool', 'parameters', 'limitations'])

  const out = parseTargetArtifacts(PLAN)
  assert.deepEqual(out, {
    rows: [
      { path: '/opt/app/app.bin', sha256: HEX, provider: 'ghidra' },
      { path: '/opt/app/lib.dylib', sha256: HEX2, provider: 'rizin' },
    ],
    citingTasks: ['1.1'],
  })

  // Block absent → the empty shape, never undefined fields.
  assert.deepEqual(parseTargetArtifacts('# plan\n## Context\nnothing\n## Phase 1 — x\n'), { rows: [], citingTasks: [] })

  // A row under the marker that breaks the row shape is loud, never silently dropped.
  assert.throws(
    () => parseTargetArtifacts(`# p\n## Context\n${TARGET_ARTIFACTS_MARKER}\n- path: \`/x\` · sha256: \`abc\` · provider: \`ghidra\`\n`),
    /malformed Target artifacts row/,
  )

  // CLI: same object on stdout, exit 0; exit 2 on an unreadable file and on a missing path.
  const dir = mkdtempSync(join(tmpdir(), 'target-artifacts-'))
  const planPath = join(dir, 'plan.md')
  writeFileSync(planPath, PLAN)
  const ok = spawnSync(process.execPath, [CLI, planPath], { encoding: 'utf8' })
  assert.equal(ok.status, 0, ok.stderr)
  assert.deepEqual(JSON.parse(ok.stdout), out)

  const missing = spawnSync(process.execPath, [CLI, join(dir, 'absent.md')], { encoding: 'utf8' })
  assert.equal(missing.status, 2)
  assert.match(missing.stderr, /target-artifacts/)

  const noArg = spawnSync(process.execPath, [CLI], { encoding: 'utf8' })
  assert.equal(noArg.status, 2)
})

// --- the doc-token guard -----------------------------------------------------------------
// Each surface carries ONE fixed lead-in; the value is the bold literal (marker) or the
// backticked token(s) that follow it. The extractor fails closed: a surface whose lead-in is
// absent throws, so a reworded surface reds the guard instead of passing vacuously.
const MARKER_SURFACES = [
  { file: 'skills/war-strategy/references/plan-interview.md', leadIn: 'Artifact recon lane — marker ' },
  { file: 'skills/red-team/references/lenses.md', leadIn: 'Target artifacts marker: ' },
  { file: 'skills/red-team/SKILL.md', leadIn: 'Target artifacts marker: ' },
  { file: 'skills/war-strategy/references/artifact-evidence.md', leadIn: 'Marker: ' },
]
const MANIFEST_PATH_SURFACE = { file: 'skills/war-strategy/references/artifact-evidence.md', leadIn: 'Manifest path: ' }
const MANIFEST_KEYS_SURFACE = { file: 'skills/war-strategy/references/artifact-evidence.md', leadIn: 'Manifest keys: ' }

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Every occurrence of `<leadIn><value>` on the surface, where `shape` captures the value.
// Zero occurrences throws (fail closed).
function extractAfterLeadIn(file, leadIn, shape) {
  const text = src(file)
  const re = new RegExp(esc(leadIn) + shape.source, 'g')
  const found = [...text.matchAll(re)].map(m => m[1])
  assert.ok(found.length > 0, `${file}: lead-in ${JSON.stringify(leadIn)} absent or not followed by a value`)
  return found
}

test('doc-token guard: every mapped surface carries the lead-in-anchored value of TARGET_ARTIFACTS_MARKER, MANIFEST_PATH_TEMPLATE or MANIFEST_KEYS equal to the export', () => {
  for (const { file, leadIn } of MARKER_SURFACES) {
    for (const value of extractAfterLeadIn(file, leadIn, /(\*\*[^*\n]+\*\*)/)) {
      assert.deepEqual(value, TARGET_ARTIFACTS_MARKER, `${file}: marker after ${JSON.stringify(leadIn)}`)
    }
  }

  const paths = extractAfterLeadIn(MANIFEST_PATH_SURFACE.file, MANIFEST_PATH_SURFACE.leadIn, /`([^`\n]+)`/)
  assert.deepEqual(paths, [MANIFEST_PATH_TEMPLATE], `${MANIFEST_PATH_SURFACE.file}: Manifest path line`)

  const keyLines = extractAfterLeadIn(MANIFEST_KEYS_SURFACE.file, MANIFEST_KEYS_SURFACE.leadIn, /([^\n]+)/)
  assert.equal(keyLines.length, 1, `${MANIFEST_KEYS_SURFACE.file}: exactly one Manifest keys line`)
  const keys = [...keyLines[0].matchAll(/`([^`]+)`/g)].map(m => m[1])
  assert.deepEqual(keys, MANIFEST_KEYS, `${MANIFEST_KEYS_SURFACE.file}: Manifest keys line`)

  // The extractor's fail-closed arm, proven red on a lead-in no surface carries.
  assert.throws(() => extractAfterLeadIn(MANIFEST_PATH_SURFACE.file, 'No such lead-in: ', /`([^`\n]+)`/), /absent/)
})
