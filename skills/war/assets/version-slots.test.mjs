import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
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
  // under the `## Status` heading. Extract by construct — anchor on the heading
  // boundary (leading \n skips the backtick `## Status` reference in the
  // Releasing table row, which precedes the real heading), then the first bold
  // semver — never by line number.
  const statusIdx = readme.indexOf('\n## Status')
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

// Monotonic floor — lock-step is NOT monotonic. A coherent all-four-slots DOWNGRADE moves
// every slot together, so the lock-step test above passes it: that is exactly how a Gate-2
// `docs(learnings)` commit staged from a stale publication worktree silently reverted a
// landed release (#1083). This floor reads a BOUNDED first-parent window of slot-touching
// history in ONE git spawn (never unbounded history, never a spawn per commit) and refuses
// a tip below that window's max. A tip-vs-HEAD^ check would not do: the incident buries
// itself the moment any commit lands on top, while the window max stays red until a restore
// commit returns the tip to it (detection-then-repair).
//
// `--diff-merges=first-parent` is passed EXPLICITLY and is load-bearing: on a campaign
// branch every slot-touching commit in this window is a merge (measured 50 of 50 at the
// implementation base), so the whole signal comes from merge diffs — which modern git shows
// only because `--first-parent` IMPLIES that flag. Pin it or the mechanic rides an unpinned
// display default: `--diff-merges=off` on the identical command yields ZERO versions, and
// this suite runs in EVERY refiner-dispatched gate. The non-vacuity assertion below is what
// makes that failure loud instead of a campaign-wide vacuous green.
const WINDOW = 50
const SLOT_LOG_ARGS = [
  'log', '--first-parent', '--diff-merges=first-parent',
  '-n', String(WINDOW), '-p', '--', '.claude-plugin/plugin.json',
]

// Three-component NUMERIC compare — a lexical compare ranks "0.14.9" above "0.14.10".
// Local helper by design: no dependency for eleven lines of arithmetic.
function cmpSemver(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i]
  }
  return 0
}

test('version slots: the tip never moves backwards (lock-step ≠ monotonic)', (t) => {
  const git = spawnSync('git', SLOT_LOG_ARGS, {
    cwd: repoRoot, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  })

  // Fail-open boundary, sharp: ONLY an unusable git context passes with a note — a spawn
  // failure (no git binary, output over maxBuffer), a non-zero git exit (not a git repo),
  // or a genuinely EMPTY log (shallow clone, fresh history: no slot-touching commits in the
  // window). Everything past this point is judged, never skipped.
  if (git.error) {
    return t.diagnostic(`monotonic floor: fail-open — git spawn failed (${git.error.message})`)
  }
  if (git.status !== 0) {
    return t.diagnostic(
      `monotonic floor: fail-open — unusable git context, \`git log\` exited ${git.status}: ${String(git.stderr).trim()}`,
    )
  }
  const log = String(git.stdout)
  if (log.trim() === '') {
    return t.diagnostic(
      `monotonic floor: fail-open — empty log, no slot-touching commits in the last ${WINDOW} first-parent commits`,
    )
  }

  const seen = [...log.matchAll(/^\+.*"version"\s*:\s*"(\d+\.\d+\.\d+)"/gm)].map((m) => m[1])

  // NON-VACUITY: a non-empty log whose parse finds zero versions is RED, never a pass. A
  // broken parse must never masquerade as an empty window — that is the one hole the
  // fail-open above could otherwise open, and an unpinned `--diff-merges` walks straight
  // into it.
  assert.ok(
    seen.length > 0,
    `monotonic floor: \`git log\` returned ${log.length} bytes but the +-side "version" parse found ZERO versions — the PARSE is broken (start with the --diff-merges=first-parent pin, then the +-side "version" regex), not an empty window; a broken parse never passes vacuously`,
  )

  const max = seen.reduce((hi, v) => (cmpSemver(v, hi) > 0 ? v : hi), seen[0])
  // Same canonical source as the lock-step test — the working tree's plugin.json. The other
  // three slots need no monotonicity of their own: lock-step already ties them to this one.
  const current = readSlots()['plugin.json#version']

  assert.ok(
    cmpSemver(current, max) >= 0,
    `plugin.json#version (${current}) is BELOW the highest version in the last ${WINDOW} slot-touching first-parent commits (${max}) — the release tip moved BACKWARDS. `
    + 'The lock-step test cannot see this: a coherent all-four-slots revert moves every slot together and passes it. '
    + 'Known incident class: a Gate-2 `docs(learnings)` commit staged from a stale publication/verify worktree re-committed old slot files over a landed release. '
    + `REMEDY — owner is the Lead/operator, never a parallel task-branch edit (slot files are release-class shared files): restore all four slots to ${max} or higher in ONE dedicated commit on the affected branch tip, before dispatching or resuming workers. This test stays red until that restore lands.`,
  )
})
