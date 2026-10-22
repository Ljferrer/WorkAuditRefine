// target-artifacts.test.mjs — the `**Target artifacts**` parser (plan 2026-10-20-rea-artifact-
// evidence Task 1.7; D8, D18; PIN-6, PIN-15) and its doc-token guard.
//
// The parser test and the doc-token guard test are titled exactly as End-state 20 names them;
// the manifest path test is titled exactly as End-state 27 names it:
//   1. the parser reads block rows anywhere in Part 1 (more than one block, in document order,
//      blank lines allowed under a marker and between its rows), skips code fences, drops a
//      block under any Part 2 H2, and names the tasks whose `Plan slice:` cites a `rea:` tag on
//      the bullet line or a continuation line (a tag on a later bullet or after a blank line
//      never cites; with no block rows citingTasks is empty); a marker with no `- path:` row
//      under it throws; a row-shaped line in Part 1 outside any block (after a continuation
//      line, after prose, or with no marker above it, full-shape or with a bad sha256) throws as
//      an orphan, while a plain `- path:` bullet, a backticked path bullet with no `· sha256:`,
//      a fenced row and a Part 2 row outside a block never do; a fenced Part 2 H2 does not end
//      Part 1; MANIFEST_KEYS is frozen; the CLI prints
//      the same object and exits 2 on an unreadable file (stderr names `cannot read`), on a
//      missing path (stderr names the usage line), on a malformed row, on a rowless marker and
//      on an orphan row; a rowless marker after a valid block throws with its own line number
//      (a global rows-empty guard would pass it);
//   2. the doc-token guard (ADR 0025 rule 8, extraction plus equality): every surface in the
//      per-surface map carries a lead-in-anchored value, and that value deepEquals the export.
//      Every bare occurrence of a lead-in must carry a shaped value, so a second occurrence
//      that drifts to plain text reds the guard instead of being skipped.
//      `CONTEXT.md` and `artifact-evidence-lead.md` are NOT in the map — they name constants;
//   3. the manifest path test (End-state 27, D23): the `<sha12>` placeholder sits between
//      `<task-id>` and `.manifest.json`, two artifacts under one task resolve to two files in one
//      plan-slug directory, and MANIFEST_KEYS is unchanged.
//
// Repo root resolves from import.meta.url, never process.cwd(): a WAR subagent's cwd is the
// main checkout and resets between bash calls.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
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

// A merged plan with one block in the Assumptions ledger and a second in Non-goals (not at a
// fixed slot; the second has a blank line under its marker), a fenced decoy block in Part 1,
// unfenced decoy blocks in Part 2 (one directly under `## Commander's Intent`, one under a
// task), and tasks: 1.1 cites a rea: tag on its Plan slice line, 1.2 only talks about `rea:` in
// prose, 1.3 cites one on a Plan slice continuation line, 1.4 carries a tag on the `- Done when:`
// bullet after its slice, 1.5 carries one after a blank line under its slice, 2.1 cites one
// inside a fence. Only 1.1 and 1.3 cite.
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
**Target artifacts**

- path: \`/opt/app/plugin.so\` · sha256: \`${HEX}\` · provider: \`rizin\`
## Commander's Intent
**Target artifacts**
- path: \`/intent/decoy.bin\` · sha256: \`${HEX}\` · provider: \`ghidra\`
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
### Task 1.3: wrapped
- Files: \`d.mjs\`
- Plan slice: do the other thing
  (verified: rea:${EV} at sha256:${HEX}).
- requiresTest: true
### Task 1.4: terminated by the next bullet
- Files: \`e.mjs\`
- Plan slice: no tag here
- Done when: see rea:${EV} at sha256:${HEX}
- requiresTest: true
### Task 1.5: terminated by a blank line
- Files: \`f.mjs\`
- Plan slice: no tag here either

  (verified: rea:${EV} at sha256:${HEX}).
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
  assert.equal(MANIFEST_PATH_TEMPLATE, 'docs/plans/evidence/<plan-slug>/<task-id>.<sha12>.manifest.json')
  assert.deepEqual(MANIFEST_KEYS, ['evidence_id', 'sha256', 'provider', 'tool', 'parameters', 'limitations'])
  // deepEqual ignores frozenness: a consumer must not be able to push a key into the shared export.
  assert.ok(Object.isFrozen(MANIFEST_KEYS), 'MANIFEST_KEYS is frozen')

  const out = parseTargetArtifacts(PLAN)
  assert.deepEqual(out, {
    rows: [
      { path: '/opt/app/app.bin', sha256: HEX, provider: 'ghidra' },
      { path: '/opt/app/lib.dylib', sha256: HEX2, provider: 'rizin' },
      { path: '/opt/app/plugin.so', sha256: HEX, provider: 'rizin' },
    ],
    citingTasks: ['1.1', '1.3'],
  })

  // Each Part 2 H2 arm ends Part 1 on its own: a block directly under it is a decoy. The same
  // H2 inside a fence does not end Part 1 (the fence check runs before the H2 check), so a block
  // declared after a fenced example heading still parses.
  const row = `- path: \`/x\` · sha256: \`${HEX}\` · provider: \`ghidra\``
  for (const h2 of ["## Commander's Intent", "## AI-Commander's Intent", '## Build order (for /war)', '## Phase 1 — x']) {
    assert.deepEqual(
      parseTargetArtifacts(`# p\n## Context\n${h2}\n${TARGET_ARTIFACTS_MARKER}\n${row}\n`),
      { rows: [], citingTasks: [] },
      `decoy under ${h2}`,
    )
    assert.deepEqual(
      parseTargetArtifacts(`# p\n## Context\n\`\`\`\n${h2}\n\`\`\`\n${TARGET_ARTIFACTS_MARKER}\n${row}\n`),
      { rows: [{ path: '/x', sha256: HEX, provider: 'ghidra' }], citingTasks: [] },
      `a fenced Part 2 H2 does not end Part 1 (${h2})`,
    )
  }

  // Block absent → the empty shape, never undefined fields.
  assert.deepEqual(parseTargetArtifacts('# plan\n## Context\nnothing\n## Phase 1 — x\n'), { rows: [], citingTasks: [] })
  // Block absent with a citing Plan slice → citingTasks still empty: no declared target, no seat.
  assert.deepEqual(
    parseTargetArtifacts(`# plan\n## Context\nnothing\n## Phase 1 — x\n### Task 1.1: cites\n- Plan slice: see rea:${EV} at sha256:${HEX}\n`),
    { rows: [], citingTasks: [] },
  )

  // A row under the marker that breaks the row shape is loud, never silently dropped.
  assert.throws(
    () => parseTargetArtifacts(`# p\n## Context\n${TARGET_ARTIFACTS_MARKER}\n- path: \`/x\` · sha256: \`abc\` · provider: \`ghidra\`\n`),
    /malformed Target artifacts row/,
  )

  // A loose Markdown list (a blank line between rows) keeps the block open: both rows parse in
  // order, with one blank line and with two. A blank line followed by a non-row ends the block,
  // and a second marker after the blank opens the next block.
  const rowA = `- path: \`/a\` · sha256: \`${HEX}\` · provider: \`ghidra\``
  const rowB = `- path: \`/b\` · sha256: \`${HEX2}\` · provider: \`rizin\``
  const both = { rows: [{ path: '/a', sha256: HEX, provider: 'ghidra' }, { path: '/b', sha256: HEX2, provider: 'rizin' }], citingTasks: [] }
  for (const gap of ['\n', '\n\n']) {
    assert.deepEqual(
      parseTargetArtifacts(`# p\n## Context\n${TARGET_ARTIFACTS_MARKER}\n${rowA}\n${gap}${rowB}\n`),
      both,
      `loose list with gap ${JSON.stringify(gap)}`,
    )
  }
  assert.deepEqual(
    parseTargetArtifacts(`# p\n## Context\n${TARGET_ARTIFACTS_MARKER}\n${rowA}\n\nprose, not a row\n`),
    { rows: [{ path: '/a', sha256: HEX, provider: 'ghidra' }], citingTasks: [] },
    'a blank line then a non-row ends the block',
  )
  assert.deepEqual(
    parseTargetArtifacts(`# p\n## Context\n${TARGET_ARTIFACTS_MARKER}\n${rowA}\n\n${TARGET_ARTIFACTS_MARKER}\n${rowB}\n`),
    both,
    'a second marker after the blank opens the next block',
  )

  // A rowless marker AFTER a valid block throws with its own line number: the guard is
  // per-marker, never a global rows-empty check (which would pass this plan with rows [/a]).
  assert.throws(
    () => parseTargetArtifacts(`# p\n## Context\n${TARGET_ARTIFACTS_MARKER}\n${rowA}\n\n${TARGET_ARTIFACTS_MARKER}\n| x |\n`),
    /Target artifacts marker at line 6 carries no rows/,
  )

  // A row-shaped line the row loop did not consume is an orphan and throws with its own line
  // number, never rows [/a] with exit 0: after a continuation line, after prose under a blank,
  // with no marker above it at all, and (row-shaped but not full-shape) with a bad sha256 or no
  // provider after prose.
  const orphanAfterContinuation = `# p\n## Context\n${TARGET_ARTIFACTS_MARKER}\n${rowA}\n  (the main binary)\n${rowB}\n`
  assert.throws(() => parseTargetArtifacts(orphanAfterContinuation), /orphan Target artifacts row at line 6/)
  assert.throws(
    () => parseTargetArtifacts(`# p\n## Context\n${TARGET_ARTIFACTS_MARKER}\n${rowA}\n\nprose, not a row\n${rowB}\n`),
    /orphan Target artifacts row at line 7/,
  )
  assert.throws(() => parseTargetArtifacts(`# p\n## Context\n${rowA}\n`), /orphan Target artifacts row at line 3/)
  for (const broken of [
    '- path: `/b` · sha256: `abc` · provider: `x`',
    `- path: \`/b\` · sha256: \`${HEX2}\``,
  ]) {
    assert.throws(
      () => parseTargetArtifacts(`# p\n## Context\n${TARGET_ARTIFACTS_MARKER}\n${rowA}\nprose, not a row\n${broken}\n`),
      /orphan Target artifacts row at line 6/,
      `row-shaped orphan with a broken field: ${broken}`,
    )
  }
  // The orphan guard keys on the row head (`- path: \`…\` · sha256:`), never on `- path:` alone:
  // a plain `- path:` bullet in Part 1 prose, a backticked path bullet with no `· sha256:`, a
  // fenced full-shape row, and a full-shape row in Part 2 outside any block never throw.
  for (const prose of ['- path: the repo root, nothing more', '- path: `/opt/app` is where it installs']) {
    assert.deepEqual(
      parseTargetArtifacts(`# p\n## Context\n${prose}\n${TARGET_ARTIFACTS_MARKER}\n${rowA}\n`),
      { rows: [{ path: '/a', sha256: HEX, provider: 'ghidra' }], citingTasks: [] },
      `a path bullet in prose is not an orphan: ${prose}`,
    )
  }
  assert.deepEqual(
    parseTargetArtifacts(`# p\n## Context\n\`\`\`\n${rowA}\n\`\`\`\n`),
    { rows: [], citingTasks: [] },
    'a fenced full-shape row is inert',
  )
  assert.deepEqual(
    parseTargetArtifacts(`# p\n## Context\n## Phase 1 — x\n${rowA}\n`),
    { rows: [], citingTasks: [] },
    'a Part 2 row outside a block is inert',
  )

  // A marker with no `- path:` row under it is loud too, never rows [] with exit 0: a `* path:`
  // bullet, a table row, an Evidence-consumed-style bullet, a heading after a blank line, and a
  // marker at end of file each throw with the marker's line number.
  const star = `# p\n## Context\n${TARGET_ARTIFACTS_MARKER}\n* path: \`/x\` · sha256: \`${HEX}\` · provider: \`ghidra\`\n`
  assert.throws(() => parseTargetArtifacts(star), /Target artifacts marker at line 3 carries no rows/)
  for (const under of [
    `| path | sha256 | provider |\n| /x | ${HEX} | ghidra |\n`,
    `- \`/x\` · sha256: \`${HEX}\` · provider: \`ghidra\`\n`,
    `\n## Next heading\n- path: \`/x\` · sha256: \`${HEX}\` · provider: \`ghidra\`\n`,
    '',
  ]) {
    assert.throws(
      () => parseTargetArtifacts(`# p\n## Context\n${TARGET_ARTIFACTS_MARKER}\n${under}`),
      /Target artifacts marker at line 3 carries no rows/,
      `rowless marker followed by ${JSON.stringify(under)}`,
    )
  }

  // CLI: same object on stdout, exit 0; exit 2 on an unreadable file and on a missing path.
  // The temp dir is removed in `finally`, so a failing assertion leaves nothing under tmpdir.
  const dir = mkdtempSync(join(tmpdir(), 'target-artifacts-'))
  try {
    const planPath = join(dir, 'plan.md')
    writeFileSync(planPath, PLAN)
    const ok = spawnSync(process.execPath, [CLI, planPath], { encoding: 'utf8' })
    assert.equal(ok.status, 0, ok.stderr)
    assert.deepEqual(JSON.parse(ok.stdout), out)

    const missing = spawnSync(process.execPath, [CLI, join(dir, 'absent.md')], { encoding: 'utf8' })
    assert.equal(missing.status, 2)
    assert.match(missing.stderr, /cannot read/)

    const noArg = spawnSync(process.execPath, [CLI], { encoding: 'utf8' })
    assert.equal(noArg.status, 2)
    assert.match(noArg.stderr, /usage: node target-artifacts\.mjs/)

    // CLI: a malformed row maps the parser's throw to exit 2, never an uncaught exit 1.
    const badPath = join(dir, 'bad.md')
    writeFileSync(badPath, `# p\n## Context\n${TARGET_ARTIFACTS_MARKER}\n- path: \`/x\` · sha256: \`abc\` · provider: \`ghidra\`\n`)
    const bad = spawnSync(process.execPath, [CLI, badPath], { encoding: 'utf8' })
    assert.equal(bad.status, 2, bad.stderr)
    assert.match(bad.stderr, /malformed Target artifacts row/)

    // CLI: a rowless marker maps the parser's throw to exit 2 as well.
    const rowlessPath = join(dir, 'rowless.md')
    writeFileSync(rowlessPath, star)
    const rowless = spawnSync(process.execPath, [CLI, rowlessPath], { encoding: 'utf8' })
    assert.equal(rowless.status, 2, rowless.stderr)
    assert.match(rowless.stderr, /Target artifacts marker at line 3 carries no rows/)

    // CLI: an orphan row maps the parser's throw to exit 2 as well.
    const orphanPath = join(dir, 'orphan.md')
    writeFileSync(orphanPath, orphanAfterContinuation)
    const orphan = spawnSync(process.execPath, [CLI, orphanPath], { encoding: 'utf8' })
    assert.equal(orphan.status, 2, orphan.stderr)
    assert.match(orphan.stderr, /orphan Target artifacts row at line 6/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// --- one manifest per cited artifact (D23) -----------------------------------------------
// `<sha12>` keys the file to one artifact: a task that cites N artifacts commits N manifests
// under one `<plan-slug>/<task-id>.` prefix. The placeholder only names the file; the full
// 64-hex digest the seat compares stays in the manifest's `sha256` key (MANIFEST_KEYS).
test('manifest path: one manifest per cited artifact, keyed by the first 12 hex of its sha256', () => {
  assert.equal(MANIFEST_PATH_TEMPLATE, 'docs/plans/evidence/<plan-slug>/<task-id>.<sha12>.manifest.json')
  assert.ok(MANIFEST_PATH_TEMPLATE.endsWith('/<task-id>.<sha12>.manifest.json'), 'the sha12 key sits between the task id and the .manifest.json suffix')
  assert.equal(MANIFEST_PATH_TEMPLATE.split('<sha12>').length - 1, 1, 'exactly one <sha12> placeholder')
  // Two cited artifacts under one task resolve to two distinct files; the first 12 hex of a
  // 64-hex digest is the key, never the whole digest and never a git SHA.
  const resolve = (slug, id, sha256) => {
    assert.match(sha256, /^[0-9a-f]{64}$/, 'the key is cut from a full 64-hex sha256')
    return MANIFEST_PATH_TEMPLATE.replace('<plan-slug>', slug).replace('<task-id>', id).replace('<sha12>', sha256.slice(0, 12))
  }
  const a = resolve('2026-10-20-rea-artifact-evidence', '1.1', HEX)
  const b = resolve('2026-10-20-rea-artifact-evidence', '1.1', 'b'.repeat(64))
  assert.equal(a, `docs/plans/evidence/2026-10-20-rea-artifact-evidence/1.1.${HEX.slice(0, 12)}.manifest.json`)
  assert.notEqual(a, b, 'one task, two artifacts, two manifest files')
  assert.equal(a.slice(0, a.lastIndexOf('/') + 1), b.slice(0, b.lastIndexOf('/') + 1), 'both files share the plan-slug directory')
  assert.ok(!a.includes('<') && !b.includes('<'), 'every placeholder resolves')
  // MANIFEST_KEYS is unchanged: the full digest still rides the manifest body under `sha256`.
  assert.deepEqual(MANIFEST_KEYS, ['evidence_id', 'sha256', 'provider', 'tool', 'parameters', 'limitations'])
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
// Zero occurrences throws (fail closed). Every bare occurrence of the lead-in must carry a
// shaped value: an occurrence whose value drifted to plain text throws instead of being
// skipped. `text` defaults to the surface's source; a caller passes it only to prove the arms.
function extractAfterLeadIn(file, leadIn, shape, text = src(file)) {
  const re = new RegExp(esc(leadIn) + shape.source, 'g')
  const found = [...text.matchAll(re)].map(m => m[1])
  assert.ok(found.length > 0, `${file}: lead-in ${JSON.stringify(leadIn)} absent or not followed by a value`)
  const bare = text.split(leadIn).length - 1
  assert.equal(bare, found.length, `${file}: lead-in ${JSON.stringify(leadIn)} occurs ${bare} times but ${found.length} carry a shaped value`)
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

  // The extractor's fail-closed arms, proven red: a lead-in no surface carries, and a second
  // occurrence of a lead-in whose value drifted to plain text (synthetic text, not a surface).
  assert.throws(() => extractAfterLeadIn(MANIFEST_PATH_SURFACE.file, 'No such lead-in: ', /`([^`\n]+)`/), /absent/)
  assert.throws(
    () => extractAfterLeadIn('synthetic', 'Marker: ', /(\*\*[^*\n]+\*\*)/, 'Marker: **Target artifacts**\nMarker: Target artifacts\n'),
    /occurs 2 times but 1 carry a shaped value/,
  )
  assert.deepEqual(
    extractAfterLeadIn('synthetic', 'Marker: ', /(\*\*[^*\n]+\*\*)/, 'Marker: **a**\nMarker: **b**\n'),
    ['**a**', '**b**'],
    'every occurrence is returned when each carries a shaped value',
  )
})
