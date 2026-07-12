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

// --- Task 2.2 (war-room-config-expansion): migrate opt-in gate + opt-in-default rewording ---

// (8) migrate mode gains the opt-in pre-flight: it frames commitLearnings as off-by-default,
//     the accept path writes through the war-config validator, and the decline path aborts with
//     the exact "nothing migrated" message and nothing staged.
test('doc-contract: migrate mode gates on the commitLearnings opt-in (ask → validator-path accept / abort decline)', () => {
  assert.match(skill, /`migrate` mode/, 'migrate mode section must exist')
  assert.match(skill, /opt-in \/ off by default/i,
    'migrate pre-flight must frame commitLearnings as opt-in / off by default (retired: default `true`)')
  assert.match(skill, /--stdin --fill-defaults/,
    'accept path must write memory.commitLearnings: true through the war-config validator path')
  assert.match(skill, /nothing migrated — re-run after opting in/,
    'decline path must abort with the exact "nothing migrated — re-run after opting in" message')
})

// (9) The evict flip-back ask is unchanged, but its justification no longer cites the retired
//     default `true`; it now frames commitLearnings as opt-in / turned on.
test('doc-contract: evict flip-back ask survives, justified by opt-in (not the retired default `true`)', () => {
  const ask = lineWith(skill, 'whether to also set `memory.commitLearnings: false`')
  assert.match(ask, /opt-in \/ off by default/i,
    'evict ask justification must frame commitLearnings as opt-in / off by default')
})

// (10) migration.md's two operator-facing spots — the migrate Step-5 opt-in confirm and the
//      evict flip-back justification — are reworded to the opt-in default.
test('doc-contract: migration.md migrate-confirm + evict-justification reworded to opt-in default', () => {
  const confirm = lineWith(migration, 'Confirm committing is on for this repo')
  assert.match(confirm, /opt-in \/ off by default/i,
    'migration.md migrate opt-in confirm must frame commitLearnings as opt-in / off by default')
  assert.match(migration, /flipping it back off/i,
    'migration.md evict justification must reframe the flip as turning an opted-in flag back off (not the retired default `true`)')
})

// (11) OLD-absent (ADR 0025): no surface in either doc still claims the retired `true` default
//      or the economy-pins-false framing. A value assignment (`commitLearnings: true` on the accept
//      path) is NOT a default claim, so the guard anchors on "default … `true`" and "economy … pin … false".
test('doc-contract: no retired commitLearnings default-`true` / economy-pins-false claim survives', () => {
  for (const [name, doc] of [['SKILL.md', skill], ['migration.md', migration]]) {
    const defaultTrue = doc.split('\n').filter(l => /\bdefaults?\b[^`\n]{0,14}`true`/i.test(l))
    assert.deepEqual(defaultTrue, [],
      `${name}: retired "default … \`true\`" commitLearnings claim must be gone; offending: ${JSON.stringify(defaultTrue)}`)
    const economyPins = doc.split('\n').filter(l => /economy[^\n]*pin[^\n]*false/i.test(l))
    assert.deepEqual(economyPins, [],
      `${name}: retired "economy pins \`false\`" framing must be gone; offending: ${JSON.stringify(economyPins)}`)
  }
})
