// Doc/CLI shell-out consistency drift-guard (plan D11, ADR 0025) + the
// spec-posterity citation rule (F7 / ADR 0046) over the same doc corpus.
//
// Every CLI verb a SKILL.md phrases for one of the named dispatch modules must
// resolve to a REAL dispatch case in that module — extraction + equality, not
// presence. `aggregateBackstops` is a `campaign-ledger.mjs` EXPORT with no CLI
// case; the campaign SKILL.md says "it is a module export, not a CLI subcommand"
// and this test locks that sentence's truth so the uniform "shell out to X.mjs
// <verb>" idiom can never silently mislabel it as a subcommand.
// See memory: uniform-shell-out-idiom-mislabels-export-only-function-as-cli-subcommand.
//
// Repo root is resolved from import.meta.url, NEVER process.cwd(): a WAR
// subagent's cwd is the main repo (not this worktree) and resets between bash
// calls, so a cwd-relative root would read the wrong tree.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url)) // skills/_shared
const REPO = resolve(HERE, '..', '..')               // repo root

// The named dispatch modules (plan Task 1.3). war-config.mjs is flag-based
// (--preset/--stdin/--resolve-gate/--fill-defaults + a positional path); it
// dispatches on has('--flag'), never on a verb, so its verb set is empty by
// design and any bare-word verb a doc invents for it is a real defect.
const MODULES = {
  'campaign-ledger.mjs': 'skills/war-campaign/assets/campaign-ledger.mjs',
  'war-memory.mjs': 'skills/_shared/war-memory.mjs',
  'war-config.mjs': 'skills/war/assets/war-config.mjs',
  'safe-swap.sh': 'skills/lessons-learned/assets/safe-swap.sh',
}

const src = rel => readFileSync(join(REPO, rel), 'utf8')

// --- extract real dispatch cases BY CONSTRUCT ------------------------------
// Each extractor is fail-closed: a missing anchor throws (a refactor that
// renames the dispatch surfaces the drift instead of silently emptying the
// allow-set into a false pass). ponytail: per-module extractors, no shared
// AST — there are exactly four named modules and each dispatches differently.

function jsSwitchCases(text) { // campaign-ledger.mjs: switch (cmd) { case '<verb>': }
  const i = text.indexOf('switch (cmd)')
  assert.ok(i >= 0, 'campaign-ledger.mjs: `switch (cmd)` dispatch not found')
  return new Set([...text.slice(i).matchAll(/case '([a-z][a-z0-9-]*)':/g)].map(m => m[1]))
}

function jsVerbsObject(text) { // war-memory.mjs: const VERBS = { <verb>: fn }
  const i = text.indexOf('const VERBS = {')
  assert.ok(i >= 0, 'war-memory.mjs: `const VERBS = {` dispatch not found')
  const block = text.slice(i, text.indexOf('};', i))
  return new Set([...block.matchAll(/^\s*'?([a-z][a-z0-9-]*)'?\s*:/gm)].map(m => m[1]))
}

function shCaseArms(text) { // safe-swap.sh: case "$cmd" in <verb>) ... ;; esac
  const i = text.indexOf('case "$cmd" in')
  assert.ok(i >= 0, 'safe-swap.sh: `case "$cmd" in` dispatch not found')
  const block = text.slice(i, text.indexOf('esac', i))
  return new Set([...block.matchAll(/^\s*([a-z][a-z0-9-]*)\)/gm)].map(m => m[1]))
}

function dispatchCases() {
  return {
    'campaign-ledger.mjs': jsSwitchCases(src(MODULES['campaign-ledger.mjs'])),
    'war-memory.mjs': jsVerbsObject(src(MODULES['war-memory.mjs'])),
    'war-config.mjs': new Set(), // flag-based CLI — no verb subcommands (see MODULES note)
    'safe-swap.sh': shCaseArms(src(MODULES['safe-swap.sh'])),
  }
}

// --- extract CLI verbs CLAIMED by SKILL.md prose ---------------------------
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// The token right after a module name is its verb. Reject flags (--x),
// placeholders (<x>), and shell args/redirects/vars/pipes. Accept mixed-case
// identifiers so a camelCase export (aggregateBackstops) mislabeled as a verb
// is captured whole, not truncated at its first capital.
function normalizeVerb(tok) {
  if (!tok || tok.startsWith('--')) return null
  if (/^[<'"$>|&]/.test(tok)) return null
  const m = tok.match(/^([A-Za-z][A-Za-z0-9_-]*)/)
  return m ? m[1] : null
}

// A "claimed verb" = the first token after the module name in either
// (1) an inline `code span` or (2) a raw "shell out to <module> <verb>" phrase
// (the plan's two grep forms). The module name preceding "shell out to" (the
// real "…owned by `X` — shell out to it" prose) never matches — the verb must
// follow the module, which must follow the phrase.
function claimedVerbs(skillText, moduleName) {
  const out = []
  const push = tok => { const v = normalizeVerb(tok); if (v) out.push(v) }
  const mod = escapeRe(moduleName)
  for (const span of skillText.match(/`[^`]+`/g) || []) {
    const inner = span.slice(1, -1)
    for (const m of inner.matchAll(new RegExp(mod + '\\s+(\\S+)', 'g'))) push(m[1])
  }
  for (const m of skillText.matchAll(new RegExp('shell out to\\s+`?(?:node\\s+)?\\S*?' + mod + '\\s+`?(\\S+)', 'gi'))) push(m[1])
  return out
}

function skillDocs() {
  const skillsDir = join(REPO, 'skills')
  const docs = []
  for (const d of readdirSync(skillsDir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue
    const p = join(skillsDir, d.name, 'SKILL.md')
    if (existsSync(p)) docs.push({ path: `skills/${d.name}/SKILL.md`, text: readFileSync(p, 'utf8') })
  }
  // UNION scan (prompt-surface simplification, adjudication I): SKILL.md prose evicts tier-2+
  // blocks verbatim into per-skill references/ files, so the verb-claim scan follows the moved
  // text — a moved shell-out claim stays checked, never silently unscanned. Enumerated eviction
  // destinations only (a shrink task extends this list in the same commit as its move): the
  // pre-existing contract/design references (e.g. skills/war/references/schemas.md) legitimately
  // name module EXPORTS beside module filenames and are not shell-out prose.
  const EVICTION_DESTINATIONS = [
    'skills/war/references/setup.md',
    'skills/war/references/docker-gate.md',
    'skills/war/references/submodule-flows.md',
    'skills/war/references/resume-and-recovery.md',
    'skills/lessons-learned/references/tighten.md',
    'skills/lessons-learned/references/migration.md',
    'skills/lessons-learned/references/recovery.md',
    'skills/red-team/references/backstop-legitimacy.md',
    'skills/war-campaign/references/add-resolution.md',
    'skills/war-machine/references/afk-conversion.md',
    'skills/war-review/references/offer-issue.md',
    'skills/war-review/references/scavenge.md',
    // Spec-posterity corpus widening (plan 2026-08-05 Task 5.4, F7 / ADR 0046): the two
    // retired-citation homes the hand-enumerated list could not previously see.
    'skills/lessons-learned/references/seeding.md',
    'skills/war/references/design.md',
  ]
  // Unguarded read: an enumerated destination that vanishes (rename/delete) must throw,
  // never silently narrow the UNION scan (lesson: enumerated-destination-list-existssync-
  // guard-fail-open-vs-sibling-fail-closed).
  for (const rel of EVICTION_DESTINATIONS)
    docs.push({ path: rel, text: readFileSync(join(REPO, rel), 'utf8') })
  assert.ok(docs.length > 0, 'no skills/*/SKILL.md found — repo root misresolved?')
  return docs
}

// --- spec-posterity rule (F7 / ADR 0046, plan 2026-08-05 Task 5.4) ---------
// docs/specs/ files are posterity — never updated, never cited by skill doctrine
// surfaces or the README; live surfaces cite maintained-truthful homes (ADRs,
// references/ files, agent cards, code, memories). Input-shape MECHANICS are
// carved out by pattern, case-insensitively: path-shape examples (placeholder
// tokens — <slug>, YYYY-MM-DD, a trailing ellipsis), glob patterns (*), and the
// bare docs/specs/ output-directory mention (survey-corps). Fenced code blocks
// are stripped first: in this corpus a fence is always a command/template/output
// example — input-shape mechanics by definition — while doctrine citations live
// in prose links and inline code spans, exactly where this rule looks.

// Same-wave split pin (lesson: drift-guard-pin-for-task-split-intermediate-state):
// plan 2026-08-05 Task 5.1 owns retiring war-campaign/SKILL.md's legacy spec
// citation; Task 5.4 ships this guard from the same frozen phase base, where that
// one citation still exists. Splitting exactly these bytes out of that one file
// before the scan keeps the guard green at the frozen base and leaves it INERT
// once the retirement lands (the split matches nothing); any other docs/specs
// citation in that file — including a reworded resurrection — is flagged.
const WAR_CAMPAIGN_LEGACY = 'Full design: [`../../docs/specs/2026-07-01-war-companion-skills-design.md`](../../docs/specs/2026-07-01-war-companion-skills-design.md) §7.'

// An unbalanced trailing fence leaves the tail UNSTRIPPED — still scanned (fail-closed).
const stripFences = text => text.replace(/```[\s\S]*?```/g, '')

function specCitations(path, text) {
  if (path === 'skills/war-campaign/SKILL.md') text = text.split(WAR_CAMPAIGN_LEGACY).join('')
  const out = []
  for (const m of stripFences(text).matchAll(/docs\/specs\/(\S*)/gi)) {
    const rest = m[1].replace(/[`"'\)\].,;:]+$/, '') // trim trailing punctuation/markdown
    if (rest === '') continue          // bare output-directory mention (survey-corps)
    if (/[<*…]/.test(rest)) continue   // placeholder / glob path-shape
    if (/yyyy/i.test(rest)) continue   // date-placeholder path-shape
    out.push({ path, cite: m[0] })
  }
  return out
}

// The verb-rule corpus + README.md — ADR 0046's reach includes the README
// (the README extension), for this rule only.
const specRuleCorpus = () => [...skillDocs(), { path: 'README.md', text: src('README.md') }]

function unresolved(docs, cases) {
  const bad = []
  for (const { path, text } of docs)
    for (const [mod, set] of Object.entries(cases))
      for (const verb of claimedVerbs(text, mod))
        if (!set.has(verb)) bad.push({ path, mod, verb })
  return bad
}

// --- tests -----------------------------------------------------------------

test('dispatch-case extraction found the real verbs (fail-closed sanity)', () => {
  const c = dispatchCases()
  for (const v of ['init', 'add', 'sweep', 'next', 'record']) assert.ok(c['campaign-ledger.mjs'].has(v), `campaign-ledger.mjs missing case '${v}'`)
  for (const v of ['query', 'render-index', 'archive', 'lint', 'consolidate', 'migrate']) assert.ok(c['war-memory.mjs'].has(v), `war-memory.mjs missing verb '${v}'`)
  for (const v of ['stage', 'verify', 'commit', 'recover']) assert.ok(c['safe-swap.sh'].has(v), `safe-swap.sh missing subcommand '${v}'`)
  assert.equal(c['war-config.mjs'].size, 0, 'war-config.mjs is flag-based; it has no verb subcommands')
})

test('every CLI verb phrased in a SKILL.md resolves to a real dispatch case', () => {
  const bad = unresolved(skillDocs(), dispatchCases())
  assert.deepEqual(bad, [], `SKILL.md phrases a shell-out verb with no matching dispatch case:\n${JSON.stringify(bad, null, 2)}`)
})

test('aggregateBackstops is a campaign-ledger export, NOT a CLI subcommand, and never phrased as a shell-out', () => {
  const ledger = src(MODULES['campaign-ledger.mjs'])
  assert.match(ledger, /export function aggregateBackstops\b/, 'aggregateBackstops must be a module export')
  assert.ok(!dispatchCases()['campaign-ledger.mjs'].has('aggregateBackstops'), 'aggregateBackstops must NOT be a CLI dispatch case')
  for (const { path, text } of skillDocs())
    assert.ok(!claimedVerbs(text, 'campaign-ledger.mjs').includes('aggregateBackstops'), `${path} phrases aggregateBackstops as a shell-out verb`)
})

test('delete-and-trace: an injected fake verb fails resolution; real verbs do not', () => {
  const cases = dispatchCases()
  // inject a fake verb into fixture prose -> must be flagged unresolved
  const fakeSpan = [{ path: 'FIXTURE', text: 'Run `campaign-ledger.mjs frobnicate` first.' }]
  assert.ok(unresolved(fakeSpan, cases).some(b => b.mod === 'campaign-ledger.mjs' && b.verb === 'frobnicate'), 'a fake code-span verb must be flagged')
  // the export mislabeled as a shell-out (both grep forms) -> must be flagged
  const fakeShellout = [{ path: 'FIXTURE', text: 'shell out to campaign-ledger.mjs aggregateBackstops for the union.' }]
  assert.ok(unresolved(fakeShellout, cases).some(b => b.verb === 'aggregateBackstops'), 'an export phrased as a shell-out must be flagged')
  // no false positive: genuine verbs resolve clean (proves the guard is not vacuous)
  const good = [{ path: 'FIXTURE', text: 'Run `campaign-ledger.mjs sweep`, then `safe-swap.sh recover`.' }]
  assert.deepEqual(unresolved(good, cases), [], 'genuine verbs must resolve to their dispatch cases')
})

test('spec-posterity (F7 / ADR 0046): no scanned doctrine surface — nor README.md — cites a docs/specs path', () => {
  const bad = specRuleCorpus().flatMap(({ path, text }) => specCitations(path, text))
  assert.deepEqual(bad, [], `a live surface cites a docs/specs path (specs are posterity — repoint at the maintained home or delete the pointer):\n${JSON.stringify(bad, null, 2)}`)
})

test('spec-posterity carve-outs: input-shape mechanics excluded by pattern; concrete citations and the pin scope are not', () => {
  // concrete citations flagged — markdown-link, inline-code, and mixed-case forms
  // (the whole link is one whitespace-free run, so it surfaces as one finding)
  assert.equal(specCitations('FIXTURE', 'See [`docs/specs/2026-01-01-x-design.md`](docs/specs/2026-01-01-x-design.md) §2.').length, 1, 'a markdown-link citation must be flagged')
  assert.equal(specCitations('FIXTURE', 'per `docs/specs/2026-01-01-x-design.md` §4').length, 1, 'an inline-code citation must be flagged')
  assert.equal(specCitations('FIXTURE', 'per Docs/Specs/2026-01-01-X-Design.md').length, 1, 'the match is case-insensitive')
  // carve-outs: bare output dir, globs, placeholders, ellipsis, date placeholder, fenced examples
  assert.deepEqual(specCitations('FIXTURE', 'synthesizes one spec per group into `docs/specs/` — then verifies.'), [], 'the bare output directory is input-shape mechanics')
  assert.deepEqual(specCitations('FIXTURE', 'Scan `docs/specs/*.md` and `docs/specs/*-design.md` for orphans.'), [], 'glob patterns are input-shape mechanics')
  assert.deepEqual(specCitations('FIXTURE', 'named `docs/specs/<name>` or `docs/specs/2026-07-02-<slug>-design.md`'), [], 'placeholder tokens are path-shape examples')
  assert.deepEqual(specCitations('FIXTURE', 'grep the plan for a `docs/specs/…` or issue link'), [], 'a trailing ellipsis is a path-shape example')
  assert.deepEqual(specCitations('FIXTURE', 'shaped `docs/specs/YYYY-MM-DD-<slug>-design.md`; and `docs/specs/yyyy-mm-dd-x.md`'), [], 'date placeholders are path-shape examples, case-insensitively')
  assert.deepEqual(specCitations('FIXTURE', 'Example:\n```\n/war-strategy docs/specs/2026-01-01-real-design.md\n```\nprose after.'), [], 'fenced command/template examples are input-shape mechanics')
  // the war-campaign pin is BYTE- and FILE-scoped (see WAR_CAMPAIGN_LEGACY above)
  assert.deepEqual(specCitations('skills/war-campaign/SKILL.md', `intro. ${WAR_CAMPAIGN_LEGACY} outro.`), [], 'the exact legacy line is tolerated in war-campaign/SKILL.md alone')
  assert.equal(specCitations('skills/war-campaign/SKILL.md', 'Full design: `docs/specs/2026-07-01-war-companion-skills-design.md` §7.').length, 1, 'a reworded resurrection in the same file is flagged')
  assert.equal(specCitations('skills/aftermath/SKILL.md', `intro. ${WAR_CAMPAIGN_LEGACY} outro.`).length, 1, 'the same bytes in ANY OTHER file are flagged')
})
