import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Repo root resolved from THIS file's location — never process.cwd(): the WAR
// subagent cwd is the main repo (not this worktree) and cwd resets between bash
// calls. This test lives at skills/war/assets/, so the repo root is three up.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

// A release version lives in FOUR slots across THREE files (marketplace.json
// carries two). Claude Code dispatches plugin updates by marketplace.json's
// version string, so a partial bump makes a release a silent no-op. These
// mechanical guards turn any single-slot drift red instead of waiting for a
// manual doc sweep. Slots are keyed by name so a failure names the culprit.
function readSlots() {
  const plugin = JSON.parse(readFileSync(join(repoRoot, '.claude-plugin', 'plugin.json'), 'utf8'))
  const marketplace = JSON.parse(readFileSync(join(repoRoot, '.claude-plugin', 'marketplace.json'), 'utf8'))
  const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8')

  // README ## Status token: the leading **x.y.z** bold token of the paragraph
  // under the `## Status` heading. Extract by construct (anchor on the heading,
  // then the first bold semver), never by line number.
  const statusIdx = readme.indexOf('## Status')
  const statusMatch = statusIdx === -1 ? null : readme.slice(statusIdx).match(/\*\*(\d+\.\d+\.\d+)\*\*/)

  return {
    'plugin.json#version': plugin.version,
    'marketplace.json#metadata.version': marketplace.metadata?.version,
    'marketplace.json#plugins[0].version': marketplace.plugins?.[0]?.version,
    'README.md ## Status token': statusMatch?.[1],
  }
}

const SEMVER = /^\d+\.\d+\.\d+$/

// Fail-closed: a failed extraction yields undefined, which must fail loudly
// rather than sneak past the lock-step check (undefined === undefined would
// pass vacuously if two slots both failed to extract).
test('version slots: all four extract to a well-formed version (fail-closed)', () => {
  const slots = readSlots()
  for (const [name, value] of Object.entries(slots)) {
    assert.ok(value != null, `${name} could not be extracted — extraction is fail-closed`)
    assert.match(value, SEMVER, `${name} is not a bare semver string: ${JSON.stringify(value)}`)
  }
})

// Lock-step: each slot is asserted against plugin.json#version independently,
// so bumping any single slot alone (delete-and-trace) fails exactly the drifted
// comparison and names it — the fragmented "did you also bump marketplace?"
// footgun becomes a red gate.
test('version slots: all four move in lock-step', () => {
  const slots = readSlots()
  const canonical = slots['plugin.json#version']
  for (const [name, value] of Object.entries(slots)) {
    if (name === 'plugin.json#version') continue
    assert.equal(
      value, canonical,
      `${name} (${value}) drifted from plugin.json#version (${canonical}) — a version bump must move all four slots together`,
    )
  }
})

// The README "Releasing" prose must name the FOUR slots, not undersell the bump
// as "three version-of-truth files" (which hides that marketplace.json carries
// two of the four). Scope the absence check to the ## Releasing section so a
// future ## Status release note quoting the retired wording can't trip the
// guard (recorded trap: release blurbs re-fire their own absence guards).
test('README Releasing prose names the four slots, not the "three files" undersell', () => {
  const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8')
  const start = readme.indexOf('## Releasing')
  assert.notEqual(start, -1, '## Releasing section not found in README.md')
  const rest = readme.slice(start + '## Releasing'.length)
  const nextHeading = rest.indexOf('\n## ')
  const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading)

  assert.doesNotMatch(
    section, /three version-of-truth files/i,
    'README Releasing section still undersells the bump as "three version-of-truth files" — name the four version slots across three files (marketplace.json carries two)',
  )
  assert.match(
    section, /four version slots/i,
    'README Releasing section must name the four version slots across three files',
  )
})
