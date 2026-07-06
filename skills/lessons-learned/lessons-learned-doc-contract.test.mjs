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
