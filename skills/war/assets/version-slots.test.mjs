import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
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

// The `## Releasing` section also carries the Status-blurb authoring checklist — the only
// authoring-time surface guarding the release-prose overclaim family, which no lint can judge.
// The lock is deliberately LIGHT: the subsection heading plus ONE distinctive anchor token, never
// a byte-pin of the bullet prose (a heavy pin makes every wording tweak a two-file change for no
// defect coverage). Extraction anchors on the heading BOUNDARY '\n## Releasing' — the same
// first-occurrence trap the Status-token extraction above records, where a table row quoting a
// heading in backticks precedes the real heading. It is a separate reader from the undersell
// guard's on purpose: that guard's own extraction stays untouched. `### ` subheadings do not
// terminate either section — the '\n## ' terminator requires a space at the third character.
const CHECKLIST_HEADING = '### Status-blurb authoring checklist'
// Anchor token: the provenance slug. It lives in a checklist BULLET, not the heading, and occurs
// nowhere else in README.md — so deleting the checklist body while leaving the heading still reds
// this lock, which a heading-only assert would sail through.
const CHECKLIST_ANCHOR = 'release-blurb-overstates-guard-semantics'

function releasingSection(readme) {
  const start = readme.indexOf('\n## Releasing')
  if (start === -1) return null
  const rest = readme.slice(start + '\n## Releasing'.length)
  const nextHeading = rest.indexOf('\n## ')
  return nextHeading === -1 ? rest : rest.slice(0, nextHeading)
}

function assertChecklistPresent(section, label) {
  assert.ok(section != null, `${label}: no '## Releasing' section — the Status-blurb authoring checklist lock cannot run`)
  assert.ok(
    section.includes(CHECKLIST_HEADING),
    `${label}: '## Releasing' is missing the '${CHECKLIST_HEADING}' subsection — the release-prose overclaim family's only authoring-time guard`,
  )
  assert.ok(
    section.includes(CHECKLIST_ANCHOR),
    `${label}: the Status-blurb authoring checklist lost its provenance anchor '${CHECKLIST_ANCHOR}' — the heading survived but the bullets did not`,
  )
}

test('README Releasing carries the Status-blurb authoring checklist (heading + anchor token)', () => {
  const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8')
  assertChecklistPresent(releasingSection(readme), 'README.md')
})

// Unwired negative reference — the both-ways half of the proof. The `## Releasing` region in its
// real shape with the ENTIRE subsection (heading and bullets) absent, run through the same
// extraction+assert path and asserted RED. Without it, a lock that quietly stopped firing (a
// renamed heading, an extraction that returns the wrong slice) would stay green forever. Not a
// fixture file by design: it never drifts out of sync with the reader it exercises.
const RELEASING_WITHOUT_CHECKLIST = `
## Releasing

A version bump **must** update all four version slots across three files together (\`marketplace.json\` carries two) — Claude Code dispatches plugin updates by the \`marketplace.json\` version string, so a stale \`marketplace.json\` makes a release a silent no-op (release-drift / mirrored-value pattern):

| File | Field(s) to bump |
|---|---|
| \`.claude-plugin/plugin.json\` | \`version\` |
| \`.claude-plugin/marketplace.json\` | \`metadata.version\` **and** \`plugins[0].version\` |
| \`README.md\` | the \`## Status\` line/paragraph |

## Status
`

test('checklist lock is non-vacuous: a subsection-absent reference fails the same path', () => {
  assert.throws(
    () => assertChecklistPresent(releasingSection(RELEASING_WITHOUT_CHECKLIST), 'negative reference'),
    /Status-blurb authoring checklist/,
    'the negative reference passed the checklist lock — the lock has stopped firing and the README assert above is vacuous',
  )
})

// Release-commit shape guards — the two prose halves of a bump that the four-slot
// lock-step cannot see. A release commit does three things (bump the slots, replace
// the `## Status` blurb IN PLACE, append the CHANGELOG entry newest-first); the two
// tests below make the second and third mechanical instead of review-caught.

// The Status blurb is REPLACED, never stacked: exactly one paragraph-leading bold
// semver token lives under `## Status`, and it is the canonical version. A stale
// blurb left above or below the new one yields a second line-start `**x.y.z**`
// token and reds here — inline semvers in blurb prose (e.g. "0.18.1 → 0.19.0
// window") are not line-start-bold and never match.
test('README ## Status carries exactly one blurb, for the canonical version (replace-in-place)', () => {
  const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8')
  const statusIdx = readme.indexOf('\n## Status')
  assert.notEqual(statusIdx, -1, 'README.md has no `## Status` heading')
  const rest = readme.slice(statusIdx + '\n## Status'.length)
  const nextHeading = rest.indexOf('\n## ')
  const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading)

  const leadTokens = [...section.matchAll(/^\*\*(\d+\.\d+\.\d+)\*\*/gm)].map((m) => m[1])
  assert.equal(
    leadTokens.length, 1,
    `## Status must carry exactly ONE paragraph-leading bold semver blurb token; found ${leadTokens.length} (${leadTokens.join(', ') || 'none'}) — a bump replaces the blurb in place, never stacks a new one beside the old`,
  )
  assert.equal(
    leadTokens[0], readSlots()['plugin.json#version'],
    'the ## Status blurb token is not the canonical plugin.json version — the blurb was not replaced as part of the bump',
  )
})

// The CHANGELOG is append-only newest-first: its FIRST `## ` entry heading must be
// the canonical version's, shaped `## x.y.z — YYYY-MM-DD`. Bumping the slots
// without relocating the superseded blurb into CHANGELOG.md (or appending the
// entry below an older one) reds here.
test('CHANGELOG.md leads with the canonical version entry (newest-first append)', () => {
  const changelog = readFileSync(join(repoRoot, 'CHANGELOG.md'), 'utf8')
  const first = changelog.match(/^## (\S+) — (\d{4}-\d{2}-\d{2})$/m)
  assert.ok(first, 'CHANGELOG.md has no `## <version> — <date>` entry heading at all — extraction is fail-closed')
  assert.equal(
    first[1], readSlots()['plugin.json#version'],
    `CHANGELOG.md's newest entry is ${first[1]}, not the canonical plugin.json version — a release bump appends its entry newest-first`,
  )
})

// The CHANGELOG header declares the newest entry "the live head blurb, authored here beside its
// README ## Status twin". Twin means byte-equal: the README block between `## Status` and the
// "Earlier release notes" pointer equals the CHANGELOG body between the lead heading and the next
// `## ` heading. Hand-mirrored release prose drifted three times in one PR (#2097's rot class) —
// this pin makes the drift a red test instead of an audit finding.
test('README ## Status block and the CHANGELOG lead entry body are byte twins', () => {
  const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8')
  const changelog = readFileSync(join(repoRoot, 'CHANGELOG.md'), 'utf8')
  const statusIdx = readme.indexOf('\n## Status\n')
  assert.ok(statusIdx !== -1, 'README.md has no `## Status` heading')
  const statusBody = readme.slice(statusIdx + '\n## Status\n'.length)
  const pointerIdx = statusBody.indexOf('\nEarlier release notes live in')
  assert.ok(pointerIdx !== -1, 'README.md ## Status lost its "Earlier release notes" pointer line — the twin extraction is fail-closed')
  const readmeBlock = statusBody.slice(0, pointerIdx).trim()
  const lead = changelog.match(/^## \S+ — \d{4}-\d{2}-\d{2}\n/m)
  assert.ok(lead, 'CHANGELOG.md has no lead entry heading')
  const after = changelog.slice(lead.index + lead[0].length)
  const nextIdx = after.search(/^## /m)
  const changelogBlock = (nextIdx === -1 ? after : after.slice(0, nextIdx)).trim()
  assert.equal(readmeBlock, changelogBlock, 'README ## Status block and the CHANGELOG lead entry body differ — edit both, byte-identical')
})

// The lead-entry test above sees only the FIRST heading — a release entry duplicated
// or inserted out of order below the lead passes it. Newest-first is a property of the
// whole ladder: every `## x.y.z — date` heading must be strictly below its predecessor
// (numeric compare via cmpSemver — a lexical sort ranks 0.14.9 above 0.14.10), which
// also forbids duplicate version entries. Dates are deliberately not ordered: same-day
// releases are legitimate and the version ladder alone carries the invariant.
test('CHANGELOG.md entries are strictly descending by version (no dupes, no out-of-order insert)', () => {
  const changelog = readFileSync(join(repoRoot, 'CHANGELOG.md'), 'utf8')
  const versions = [...changelog.matchAll(/^## (\d+\.\d+\.\d+) — \d{4}-\d{2}-\d{2}$/gm)].map((m) => m[1])
  assert.ok(versions.length >= 2, 'CHANGELOG.md has fewer than two entry headings — the ordering check is fail-closed')
  for (let i = 1; i < versions.length; i++) {
    assert.ok(
      cmpSemver(versions[i], versions[i - 1]) < 0,
      `CHANGELOG.md entry ${versions[i]} is not strictly below its predecessor ${versions[i - 1]} — entries append newest-first, one entry per version`,
    )
  }
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

// The one slot-history reader: both the monotonic floor and the categorical-scope guard
// read the same bounded first-parent window through it.
function readSlotLog(cwd) {
  return spawnSync('git', SLOT_LOG_ARGS, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
}

test('version slots: the tip never moves backwards (lock-step ≠ monotonic)', (t) => {
  const git = readSlotLog(repoRoot)

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
      `monotonic floor: fail-open — empty log, git found no slot-touching first-parent commits at all (window: the last ${WINDOW} slot-touching commits; shallow clone, fresh history, or a moved plugin.json path)`,
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

// Categorical-scope guard (#2004, PIN-15). A Status blurb's closing categorical claim ("every
// other change in the window is ...") has omitted real landed classes more than once, past the
// checklist item that exists to catch it. When the `## Status` paragraph uses a phrase from the
// closed set below, the paragraph must name every class the window touches. Window: the previous
// version-bump commit (the newest slot-history commit that introduced a version other than the
// current one, read through readSlotLog) to the newest commit that introduced the current version
// (operator ruling 2026-11-13), or to HEAD when no commit introduced it yet. A commit after the
// release commit is outside the window. Files come from `git diff --name-only --no-renames`.
const CATEGORICAL_PHRASES = /every other change|all other changes|the rest of the window/i

// Closed class table, first match wins. `names` is how a blurb names the class. A path no row
// matches is reported as unclassified and reds the guard: the table must grow, never guess.
const SCOPE_CLASSES = [
  { name: 'release slots', paths: /^(\.claude-plugin\/(plugin|marketplace)\.json|README\.md|CHANGELOG\.md)$/, names: /\b(release|version) slots?\b|\bversion bump\b|\bCHANGELOG\b/i },
  { name: 'tests', paths: /\.test\.(mjs|js|sh|py)$|(^|\/)fixtures?\/|test-harness/, names: /\btests?\b/i },
  { name: 'engine', paths: /^skills\/war\/assets\/workflow-template\.js$/, names: /\bengine\b|workflow-template/i },
  { name: 'hooks', paths: /^hooks\//, names: /\bhooks?\b/i },
  { name: 'agent cards', paths: /^agents\//, names: /\bagent cards?\b|\bcards?\b/i },
  { name: 'skill prose', paths: /^skills\/.*\.md$/, names: /\bskills?( prose)?\b|\breferences?\b/i },
  { name: 'scripts and floors', paths: /^(skills\/|\.github\/|\.claude\/|\.gitignore$)/, names: /\bscripts?\b|\bfloors?\b|\btooling\b/i },
  { name: 'docs', paths: /^(docs\/|\.tours\/|[^/]+\.md$|LICENSE$)/, names: /\bdocs?\b|\bdocumentation\b|\bADRs?\b|\bglossary\b|\blessons?\b|\blearnings\b/i },
]

function classifyPath(path) {
  return SCOPE_CLASSES.find((c) => c.paths.test(path))?.name ?? null
}

// Returns { skip } when the guard has nothing to judge, else the window verdict. Only an
// unusable git context or a window with no previous bump skips past a categorical sentence.
function categoricalScope({ cwd, current, status: raw }) {
  // Flatten line wraps once, so a hard-wrapped phrase or class name still matches.
  const status = raw.replace(/\s+/g, ' ')
  if (!CATEGORICAL_PHRASES.test(status)) return { skip: 'no categorical sentence' }
  const log = readSlotLog(cwd)
  if (log.error || log.status !== 0 || String(log.stdout).trim() === '') {
    return { skip: `unusable git context or empty slot history (${log.error?.message ?? `git exit ${log.status}`})` }
  }
  // The log is newest first. `end` is the first commit whose added version equals `current`:
  // the newest commit that introduced it. `base` is the first commit after that whose added
  // version differs. No commit introduced `current` (an uncommitted release tree) ends at HEAD.
  let hash = null
  let base = null
  let end = null
  const introduced = new Set()
  for (const line of String(log.stdout).split('\n')) {
    const c = line.match(/^commit ([0-9a-f]{40})/)
    if (c) { hash = c[1]; continue }
    const v = line.match(/^\+.*"version"\s*:\s*"(\d+\.\d+\.\d+)"/)
    if (v && hash && !introduced.has(hash)) {
      introduced.add(hash)
      if (v[1] !== current) { base = hash; break }
      end ??= hash
    }
  }
  if (base == null) return { skip: `no previous version bump in the last ${WINDOW} slot-touching commits` }
  end ??= 'HEAD'
  const diff = spawnSync('git', ['diff', '--name-only', '--no-renames', base, end], { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  assert.equal(diff.status, 0, `categorical-scope: git diff ${base}..${end} failed: ${String(diff.stderr).trim()}`)
  const files = String(diff.stdout).split('\n').filter(Boolean)
  const unclassified = files.filter((f) => classifyPath(f) == null)
  const present = [...new Set(files.map(classifyPath).filter(Boolean))]
  const missing = present.filter((name) => !SCOPE_CLASSES.find((c) => c.name === name).names.test(status))
  return { base, end, files, present, missing, unclassified }
}

function assertScope(verdict, label) {
  assert.deepEqual(verdict.unclassified, [], `${label}: window files match no SCOPE_CLASSES row (extend the closed table): ${verdict.unclassified.join(', ')}`)
  assert.deepEqual(
    verdict.missing, [],
    `${label}: the Status paragraph makes a categorical claim over the window ${verdict.base.slice(0, 8)}..${verdict.end.slice(0, 8)} but never names these touched classes: ${verdict.missing.join(', ')}. Name each class, or drop the categorical sentence.`,
  )
}

function liveStatusParagraph() {
  const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8')
  const idx = readme.indexOf('\n## Status\n')
  assert.notEqual(idx, -1, 'README.md has no `## Status` heading — extraction is fail-closed')
  const body = readme.slice(idx + '\n## Status\n'.length)
  const end = body.indexOf('\nEarlier release notes live in')
  return (end === -1 ? body : body.slice(0, end)).trim()
}

test('categorical-scope: live Status blurb', (t) => {
  const verdict = categoricalScope({ cwd: repoRoot, current: readSlots()['plugin.json#version'], status: liveStatusParagraph() })
  if (verdict.skip) return t.diagnostic(`SKIP categorical-scope: ${verdict.skip}`)
  assertScope(verdict, 'README.md ## Status')
})

// Both ways on a synthetic repo: a paragraph that omits the touched `hooks` class reds, and the
// same paragraph naming it passes, so the guard is proved live, not vacuous.
test('categorical-scope: synthetic window', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'categorical-scope-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const env = {
    ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.invalid', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.invalid',
  }
  const git = (...args) => {
    const r = spawnSync('git', args, { cwd: dir, env, encoding: 'utf8' })
    assert.equal(r.status, 0, `synthetic git ${args.join(' ')} failed: ${r.stderr}`)
  }
  const put = (rel, body) => {
    mkdirSync(join(dir, dirname(rel)), { recursive: true })
    writeFileSync(join(dir, rel), body)
  }
  const bump = (v) => put('.claude-plugin/plugin.json', `${JSON.stringify({ name: 'p', version: v }, null, 2)}\n`)
  git('init', '-q')
  bump('0.0.1'); git('add', '-A'); git('commit', '-qm', 'v0.0.1')
  bump('0.0.2'); put('agents/old.md', 'before the window\n'); git('add', '-A'); git('commit', '-qm', 'v0.0.2')
  put('hooks/guard.sh', 'exit 0\n'); git('add', '-A'); git('commit', '-qm', 'hook')
  put('docs/note.md', 'note\n'); git('add', '-A'); git('commit', '-qm', 'doc')
  bump('0.0.3'); put('README.md', '## Status\n'); git('add', '-A'); git('commit', '-qm', 'v0.0.3')

  const omits = '**0.0.3** — moves the version slots. Every other change in the window is docs.'
  const red = categoricalScope({ cwd: dir, current: '0.0.3', status: omits })
  assert.deepEqual(red.present.sort(), ['docs', 'hooks', 'release slots'], 'the window is the previous bump to the 0.0.3 release commit: the pre-window agents/ file must not appear')
  assert.throws(() => assertScope(red, 'synthetic'), /never names these touched classes: hooks/)
  assert.deepEqual(red.missing, ['hooks'])

  // A hard-wrapped phrase and class name still match, so a wrap never skips the guard.
  const wrapped = '**0.0.3** — moves the version\nslots. Every\nother change in the window is docs.'
  assert.deepEqual(categoricalScope({ cwd: dir, current: '0.0.3', status: wrapped }).missing, ['hooks'])

  const names = '**0.0.3** — moves the version slots and fixes the hooks. Every other change in the window is docs.'
  assertScope(categoricalScope({ cwd: dir, current: '0.0.3', status: names }), 'synthetic')
  assert.equal(categoricalScope({ cwd: dir, current: '0.0.3', status: '**0.0.3** — hooks.' }).skip, 'no categorical sentence')

  // The window ends at the newest commit that introduced the current version (operator ruling
  // 2026-11-13): a later commit that touches an unnamed class stays out, so the blurb stays green.
  const release = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: dir, env, encoding: 'utf8' }).stdout.trim()
  put('agents/late.md', 'after the release commit\n'); git('add', '-A'); git('commit', '-qm', 'post-release card')
  const late = categoricalScope({ cwd: dir, current: '0.0.3', status: names })
  assert.equal(late.end, release, 'the window ends at the commit that introduced 0.0.3, not at HEAD')
  assert.ok(!late.present.includes('agent cards'), 'a commit after the release commit is outside the window')
  assertScope(late, 'synthetic post-release')

  // Fail-closed arm, read through the uncommitted-release fallback: no commit introduced 0.0.4,
  // so the window ends at HEAD, and a path no SCOPE_CLASSES row matches reds every named class.
  put('bin/tool', 'tool\n'); git('add', '-A'); git('commit', '-qm', 'unclassified')
  const unmatched = categoricalScope({ cwd: dir, current: '0.0.4', status: names })
  assert.equal(unmatched.base, release)
  assert.equal(unmatched.end, 'HEAD')
  assert.deepEqual(unmatched.unclassified, ['bin/tool'])
  assert.throws(() => assertScope(unmatched, 'synthetic'), /match no SCOPE_CLASSES row/)
})
