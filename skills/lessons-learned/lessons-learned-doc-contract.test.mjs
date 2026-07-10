import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Prose-gate for /lessons-learned repo-awareness (plan 2026-07-06, Phase 1 Task 3).
// No such gate existed before — safe-swap.test.sh guards the shell script, not the doc prose.
// Pattern mirrors war-config.test.mjs `doc-contract:` tests (node --test, read files as text).
// REPO_ROOT is 2 levels up from skills/lessons-learned/.
const __dir = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dir, '..', '..')
const skill = readFileSync(join(REPO_ROOT, 'skills/lessons-learned/SKILL.md'), 'utf8')
const migration = readFileSync(join(REPO_ROOT, 'skills/lessons-learned/references/migration.md'), 'utf8')

// Grab a single line matching a substring (throws if absent — makes intent explicit).
const lineWith = (text, needle) => {
  const line = text.split('\n').find(l => l.includes(needle))
  assert.ok(line, `no line containing ${JSON.stringify(needle)}`)
  return line
}

// (1) Phase 5 housekeeping render-index passes --repo. If someone reverts the render
//     back to `--local "$STAGING"` alone, this line no longer matches and the test fails.
test('doc-contract: Phase 5 render-index passes --repo (repo-adopted store keeps [repo] rows)', () => {
  const render = lineWith(skill, 'render-index --local "$STAGING"')
  assert.match(render, /render-index --local "\$STAGING" --repo /,
    'Phase 5 render-index must pass --repo <repo root> or a repo-adopted store silently drops every [repo] row on re-render')
})

// (2) The evict re-render clause stays LOCAL-ONLY by design (no --repo). Eviction abandons
//     the repo root and must drop [repo] markers. Anchored on the evict-specific prose so it
//     does not accidentally match the migrate Step 5 render (which legitimately has --repo).
test('doc-contract: evict re-render is local-only — NO --repo (eviction drops [repo] markers)', () => {
  const evict = lineWith(migration, 'evicted rows lose their')
  assert.ok(evict.includes('render-index --local "$CLAUDE_MEMORY_LOCAL"'),
    'evict clause must render-index the local root')
  assert.ok(!evict.includes('--repo'),
    'the evict re-render must stay local-only (NO --repo) — eviction must drop [repo] markers by design')
})

// (3) The Common-mistakes bullet documenting the silent-drop failure mode exists.
//     Removing the bullet removes the "silently drops every `[repo]` row" phrase and this fails.
test('doc-contract: Common mistakes warns that dropping --repo silently drops [repo] rows', () => {
  assert.match(skill, /Common mistakes/,
    'SKILL.md must have a Common mistakes section')
  assert.match(skill, /silently drops every `\[repo\]` row/,
    'Common mistakes must warn that a --repo-less Phase 5 render silently drops every [repo] row')
})

// (4) migration.md Step 5 gains the CLAUDE.md pointer sub-step (append-if-absent, same PR).
//     Removing the sub-step removes this sentence and this fails.
test('doc-contract: migration Step 5 has the CLAUDE.md pointer sub-step (append-if-absent)', () => {
  assert.match(migration, /`CLAUDE\.md` carries the pointer line/,
    'migration.md Step 5 must ensure the target repo CLAUDE.md carries the ratified pointer line')
  assert.match(migration, /append-if-absent/,
    'the pointer sub-step must be append-if-absent (never rewrite existing operator content)')
})

// --- Criterion 6 (memory-store-hygiene plan, Task 1.3): verifier trichotomy + tool-driven hub check ---

// (5) The Phase-2 verifier prompt states the HOT/COLD/MISSING link trichotomy. Case-tolerant,
//     mid-sentence anchors (the three state tokens survive rewording of the surrounding prose).
test('doc-contract: verifier prompt carries the HOT/COLD/MISSING link trichotomy', () => {
  assert.match(skill, /\bhot\b/i, 'trichotomy must name the HOT state')
  assert.match(skill, /\bcold\b/i, 'trichotomy must name the COLD (archived) state')
  assert.match(skill, /\bmissing\b/i, 'trichotomy must name the MISSING state')
  assert.match(skill, /trichotomy/i, 'the link trichotomy must be stated as such')
})

// (6) Phase 3 counts inbound refs via `war-memory inbound`, not the retired prose grep.
//     If someone reverts to `grep -rl "\[\[<slug>\]\]"`, the inbound invocation disappears
//     and this fails. Anchored on the CLI verb + subcommand, case-tolerant on spacing.
test('doc-contract: Phase 3 hub check invokes war-memory inbound (not the prose grep)', () => {
  assert.match(skill, /war-memory\.mjs" inbound <slug>/,
    'Phase 3 must run `war-memory.mjs inbound <slug>` for the inbound count')
  assert.doesNotMatch(skill, /grep -rl "\\\[\\\[<slug>\\\]\\\]"/,
    'the retired Phase-3 prose grep must be gone — the count comes from `war-memory inbound`')
})

// (7) OLD-absent: no surviving instruction produces a removal/retire verdict from a hot-only
//     `ls`. Every line that mentions "hot-only" must also carry "never" — i.e. the only place
//     the hot-only listing appears is the forbiddance, never an affirmative removal verdict.
//     (Mirrors Task 1.1's `archives ALL of these` OLD-absent guard — ADR 0025 discipline.)
test('doc-contract: no hot-only-ls removal verdict survives (hot-only appears only as forbiddance)', () => {
  const offenders = skill.split('\n').filter(l => /hot-only/i.test(l) && !/never/i.test(l))
  assert.deepEqual(offenders, [],
    `every "hot-only" mention must be the forbiddance ("never ... from a hot-only ls"); offending lines: ${JSON.stringify(offenders)}`)
})
