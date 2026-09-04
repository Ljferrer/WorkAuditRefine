// Doc/CLI shell-out consistency drift-guard (plan D11, ADR 0025) + the
// spec-posterity citation rule (F7 / ADR 0046) — two rules, two corpora,
// decoupled (plan 2026-08-06-doc-cli-consistency-corpus D1): the verb rule
// scans readdir-derived skills/*/SKILL.md plus the enumerated
// EVICTION_DESTINATIONS; the spec-posterity rule sweeps the directory-scanned
// posterity corpus (every SKILL.md, every skills/*/references/*.md, every
// agents/*.md card, plus README.md). The placement census test binds the
// references-file partition between the verb-side lists (D2) AND each
// exclusion's stated reason (red-team adjudication 6: claimedVerbs empty per
// entry, schemas.md carve-out excepted).
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

// --- the verb-side partition over skills/*/references/*.md -----------------
// UNION scan (prompt-surface simplification, adjudication I): SKILL.md prose evicts tier-2+
// blocks verbatim into per-skill references/ files, so the verb-claim scan follows the moved
// text — a moved shell-out claim stays checked, never silently unscanned. Membership is a
// conscious per-file decision (a blanket widening is impossible: contract/design references
// legitimately name module EXPORTS beside module filenames — see VERB_SCAN_EXCLUSIONS); the
// placement census test below (D2) default-denies every unplaced references file.
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
  // #1306: the interview doctrine's whole CLI exposure is its Stage-0 recon command
  // (war-memory.mjs `query`, which resolves against the live VERBS dispatch) — verb-scanned
  // so a future verb rename rots that command loudly, never silently.
  'skills/war-strategy/references/plan-interview.md',
  // in-band-absorb-default D6 (Task 6.1): sweep-exclusion.md carries the Lead's campaign
  // contention-set duty — a Node one-liner importing the campaign-ledger.mjs EXPORT
  // `extractFilesFromPlanFile` (never a ledger CLI verb; the verb set is closed) — verb-scanned
  // so a future shell-out rephrasing of that import rots loudly, never silently.
  'skills/war/references/sweep-exclusion.md',
]

// Reason-excluded from the VERB scan only (D9/D10) — never from the posterity rule: every
// entry below is still swept by the directory-scanned posterity corpus. An exclusion is a
// conscious placement with a stated per-entry reason, not suppression.
const VERB_SCAN_EXCLUSIONS = [
  // schemas.md names war-config.mjs directly beside its EXPORT `resolveGate`; war-config.mjs
  // is flag-based with an empty-by-design verb set (see MODULES), so verb-scanning this
  // contract reference is a guaranteed false red (probe-verified).
  'skills/war/references/schemas.md',
  'skills/war/references/auditor-teach.md',         // no shell-out prose for the scanned modules
  // vale-custom-interview.md phrases only war-config.mjs flags (empty-by-design verb set, the
  // schemas.md precedent) and the external `vale` CLI — no scanned-module verbs.
  'skills/war-room/references/vale-custom-interview.md',
  // budget-rebaseline.md is the operator budget re-baseline pass; its only command prose
  // targets prompt-surface-budgets.test.mjs and assert-budget-raise-cited.sh — neither is a
  // scanned module, and it phrases no verb for any scanned module.
  'skills/war/references/budget-rebaseline.md',
  'skills/war/references/gastown-design-params.md', // no shell-out prose for the scanned modules
  'skills/war/references/refiner-recovery.md',      // no shell-out prose for the scanned modules
  // gate-failure-classification.md holds the `## Gate-failure classification` section evicted
  // byte-identical from agents/war-refiner.md (in-band-absorb-default D12, ADR 0042); its only
  // command prose is git (the base re-run / re-attach idiom) — no scanned-module verb.
  'skills/war/references/gate-failure-classification.md',
  // gate-audit-checklist.md holds the `execution-evidence` gate-audit checklist section evicted
  // byte-identical from agents/war-auditor.md (in-band-absorb-default D16, ADR 0042); its only
  // command prose is read-only git (`cat-file -t` / `rev-parse`) — no scanned-module verb.
  'skills/war/references/gate-audit-checklist.md',
  'skills/war/references/file-followups.md',        // no shell-out prose for the scanned modules (gh + gh-preflight.sh only)
  'skills/war/references/worker-servitor-edges.md', // no shell-out prose for the scanned modules
  // run-manifest.md holds the SKILL.md Run-manifest per-stamp field detail (evicted to byte-fund
  // the card's 56 B of headroom, #1855 completion); its only command prose is the
  // `git rev-parse --path-format=absolute --git-common-dir` anchor idiom and a `date -u`
  // clock read — neither is a scanned module.
  'skills/war/references/run-manifest.md',
  'skills/red-team/references/lenses.md',           // no shell-out prose for the scanned modules
  'skills/red-team/references/loop-budget.md',      // no shell-out prose for the scanned modules
  // glossary-cold.md holds evicted CONTEXT.md glossary bodies (incident/recovery doctrine);
  // no shell-out prose for the scanned modules (re-verified at the 2026-08-16 land base, D10).
  'skills/war/references/glossary-cold.md',
  // no shell-out prose for the scanned modules (names war-config.mjs only as a de-mirror
  // target, with no verb after it)
  'skills/war/references/touched-doc-accuracy.md',
  // disposition-eligibility.md holds the evicted war-auditor.md absorb/ask eligibility
  // blockquotes; no shell-out prose for the scanned modules — it names workflow-template.js
  // constructs (aceBisect, asks[]) which is NOT a scanned module, and never phrases a CLI
  // verb, so the rotted-reason loop below keeps this exclusion honest (ask-disposition T1.1).
  'skills/war/references/disposition-eligibility.md',
  // no shell-out prose for the scanned modules (arming/refute/waive doctrine only; names
  // the recon corpus classes by prose, never a CLI command)
  'skills/war-strategy/references/strategy-verifier.md',
  // budget-raise-floor.md carries the Budget-Raise merge floor's branch prose plus blocks
  // evicted verbatim from agents/war-refiner.md (byte-funding, engine-reliability Phase 2
  // Task 2); its only command prose targets assert-budget-raise-cited.sh, git, and
  // provision-worktrees.sh — none a scanned module. It does name war-config.mjs (in the
  // evicted Gate-contract block, `war-config.mjs --resolve-gate`), but the following token
  // is a flag, so no verb is claimed for any scanned module.
  'skills/war/references/budget-raise-floor.md',
]

function skillDocs() {
  const skillsDir = join(REPO, 'skills')
  const docs = []
  for (const d of readdirSync(skillsDir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue
    const p = join(skillsDir, d.name, 'SKILL.md')
    if (existsSync(p)) docs.push({ path: `skills/${d.name}/SKILL.md`, text: readFileSync(p, 'utf8') })
  }
  // Unguarded read: an enumerated destination that vanishes (rename/delete) must throw,
  // never silently narrow the UNION scan (lesson: enumerated-destination-list-existssync-
  // guard-fail-open-vs-sibling-fail-closed).
  for (const rel of EVICTION_DESTINATIONS)
    docs.push({ path: rel, text: readFileSync(join(REPO, rel), 'utf8') })
  assert.ok(docs.length > 0, 'no skills/*/SKILL.md found — repo root misresolved?')
  return docs
}

// --- posterity corpus (D1) -------------------------------------------------
// Directory-scanned, never an editable in-file list: membership is readdir-derived per
// skills/<name>/ dir (its listed SKILL.md and references/*.md members — a skill dir without
// SKILL.md or references/ is a normal state, skipped), plus every agents/*.md card, plus
// README.md (ADR 0046's reach includes the README, for the spec-posterity rule only). All
// reads are unguarded readFileSync: a scanned path that vanishes between scan and read throws.

function referencesFiles() {
  const skillsDir = join(REPO, 'skills')
  const out = []
  for (const d of readdirSync(skillsDir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue
    const entries = readdirSync(join(skillsDir, d.name), { withFileTypes: true })
    if (!entries.some(e => e.isDirectory() && e.name === 'references')) continue
    for (const f of readdirSync(join(skillsDir, d.name, 'references')))
      if (f.endsWith('.md')) out.push(`skills/${d.name}/references/${f}`)
  }
  return out.sort()
}

function posterityCorpus() {
  const skillsDir = join(REPO, 'skills')
  const paths = []
  for (const d of readdirSync(skillsDir, { withFileTypes: true }))
    if (d.isDirectory() && readdirSync(join(skillsDir, d.name)).includes('SKILL.md'))
      paths.push(`skills/${d.name}/SKILL.md`)
  paths.push(...referencesFiles())
  for (const f of readdirSync(join(REPO, 'agents')))
    if (f.endsWith('.md')) paths.push(`agents/${f}`)
  paths.push('README.md')
  return paths.map(rel => ({ path: rel, text: src(rel) }))
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

// An unbalanced trailing fence leaves the tail UNSTRIPPED — still scanned (fail-closed).
const stripFences = text => text.replace(/```[\s\S]*?```/g, '')

function specCitations(path, text) {
  const out = []
  const stripped = stripFences(text)
  for (const m of stripped.matchAll(/docs\/specs\/(\S*)/gi)) {
    let rest = m[1].replace(/[`"'\)\].,;:]+$/, '') // trim trailing punctuation/markdown
    // D5 (#1358 finding 9): the PATH SEGMENT ends at the first backtick / ] / ) — beyond
    // that delimiter the whitespace-free run is markdown plumbing (a closing code span, a
    // link's text/target seam, or emphasis riding on those), not path bytes. Truncating
    // BEFORE the carve-out tests keeps a composite wrapper from smuggling its markdown
    // metacharacters into the glob/placeholder tests below.
    const cut = rest.search(/[`\])]/)
    // #1687: the truncated-away tail is markdown plumbing for the HEAD's path, but a
    // link carries a SECOND citation in its target half — `[docs/specs/](docs/specs/x.md)`.
    // The greedy \S* run swallows that target, so a carved-out head (bare mention, glob,
    // placeholder) used to hide a real spec citation. Keep the tail and re-scan it
    // whenever the head carves out; a flagged head already reports the whole run.
    const tail = cut >= 0 ? rest.slice(cut) : ''
    if (cut >= 0) rest = rest.slice(0, cut)
    // A paired emphasis wrapper (**bold** / _italic_) is decoration, not a glob: strip the
    // trailing marker run only when the char before the match opens it — anchoring to the
    // paired leading marker keeps an unpaired trailing glob (docs/specs/2026-*) carved out.
    const before = stripped[m.index - 1]
    if (before === '*' || before === '_') rest = rest.replace(/[*_]+$/, '')
    // carve-outs: bare output-directory mention (survey-corps), placeholder / glob
    // path-shape, date-placeholder path-shape
    const carved = rest === '' || /[<*…]/.test(rest) || /yyyy/i.test(rest)
    if (carved) {
      // the head is mechanics; the swallowed tail may still hold a real citation
      if (/docs\/specs\//i.test(tail)) out.push(...specCitations(path, tail))
      continue
    }
    out.push({ path, cite: m[0] })
  }
  return out
}

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

test('verb-scan placement census (D2): every skills/*/references/*.md file is consciously placed', () => {
  // Default-deny partition: the directory scan is truth, and every references file must sit
  // in exactly one of the two lists — census friction on every newcomer is the point.
  // Deletion asymmetry (D13), stated as intent: a DELETED references file simply leaves the
  // scan-derived posterity corpus (a deleted file is no live surface — by design), while an
  // enumerated verb-list member still fails loud both ways — deleting the FILE throws via
  // skillDocs()'s unguarded readFileSync and reds this census as a STALE ROW, and deleting
  // its in-file ROW reds this census as an UNPLACED path.
  const overlap = EVICTION_DESTINATIONS.filter(p => VERB_SCAN_EXCLUSIONS.includes(p))
  assert.deepEqual(overlap, [], `a references file is verb-scanned or reason-excluded, never both — remove it from one list: ${JSON.stringify(overlap)}`)
  const scanned = referencesFiles()
  const union = [...EVICTION_DESTINATIONS, ...VERB_SCAN_EXCLUSIONS].sort()
  const unplaced = scanned.filter(p => !union.includes(p))
  const stale = union.filter(p => !scanned.includes(p))
  assert.deepEqual(scanned, union, 'references-file placement census failed (default-deny).'
    + (unplaced.length ? ` UNPLACED: ${JSON.stringify(unplaced)} — a new references file is red until consciously placed: add it to EVICTION_DESTINATIONS if it phrases a scanned module's CLI commands, else to VERB_SCAN_EXCLUSIONS with a reason comment.` : '')
    + (stale.length ? ` STALE ROW: ${JSON.stringify(stale)} — the listed file is gone from skills/*/references/; restore the file or delete its row (and the coverage it claimed).` : ''))
  // #1306: the placement itself is load-bearing and the census alone cannot tell WHICH list
  // a path landed in — plan-interview.md must be in the VERB-SCANNED list, so its Stage-0
  // recon command stays checked against the live dispatch.
  assert.ok(EVICTION_DESTINATIONS.includes('skills/war-strategy/references/plan-interview.md'),
    'plan-interview.md must be verb-scanned (EVICTION_DESTINATIONS), not reason-excluded (#1306)')
  // ADR 0025 (/red-team adjudication 6): an exclusion's REASON is a checked property, not
  // prose — CLI command prose added to an excluded file reds here instead of rotting
  // unscanned. schemas.md is the single documented carve-out: it names war-config.mjs
  // beside its EXPORT `resolveGate` (probe-verified guaranteed false red — see its reason
  // comment in VERB_SCAN_EXCLUSIONS).
  const CARVE_OUT = 'skills/war/references/schemas.md'
  const rotted = []
  for (const rel of VERB_SCAN_EXCLUSIONS) {
    if (rel === CARVE_OUT) continue
    const text = src(rel)
    for (const mod of Object.keys(MODULES))
      for (const verb of claimedVerbs(text, mod)) rotted.push({ path: rel, mod, verb })
  }
  assert.deepEqual(rotted, [], 'an excluded references file now phrases a scanned module\'s'
    + ' CLI command — its exclusion reason ("no shell-out prose for the scanned modules")'
    + ` has rotted: move it to EVICTION_DESTINATIONS:\n${JSON.stringify(rotted, null, 2)}`)
})

test('spec-posterity (F7 / ADR 0046): no scanned doctrine surface — nor README.md — cites a docs/specs path', () => {
  // D3 sentinel floors (replacing the retired membership loop over in-file list entries):
  // the corpus is scan-derived, so no in-file edit can narrow it — one sentinel pins each
  // family's presence, and the deepEquals below prove the scanned slices are DERIVED.
  const corpus = posterityCorpus()
  const corpusPaths = corpus.map(d => d.path)
  for (const rel of ['skills/war/SKILL.md', 'agents/war-worker.md', 'skills/war-strategy/references/plan-interview.md', 'README.md'])
    assert.ok(corpusPaths.includes(rel), `posterity corpus must include ${rel} (D3 sentinel)`)
  // The SKILL.md and agent-card slices must each deepEqual a fresh readdirSync of their
  // family, and the references slice must deepEqual referencesFiles() (the census-bound scan)
  // — the census idiom applied here: four sentinels alone cannot tell a readdir-derived
  // corpus from a hardcoded array that happens to contain those four paths.
  assert.deepEqual(
    corpusPaths.filter(p => p.endsWith('/SKILL.md')).sort(),
    readdirSync(join(REPO, 'skills'), { withFileTypes: true })
      .filter(d => d.isDirectory() && readdirSync(join(REPO, 'skills', d.name)).includes('SKILL.md'))
      .map(d => `skills/${d.name}/SKILL.md`).sort(),
    'the posterity corpus SKILL.md slice must be readdir-derived, not hand-kept')
  assert.deepEqual(
    corpusPaths.filter(p => p.startsWith('agents/')).sort(),
    readdirSync(join(REPO, 'agents')).filter(f => f.endsWith('.md')).map(f => `agents/${f}`).sort(),
    'the posterity corpus agent-card slice must be readdir-derived, not hand-kept')
  assert.deepEqual(
    corpusPaths.filter(p => p.includes('/references/')).sort(),
    referencesFiles(),
    'the posterity corpus references slice must be readdir-derived, not hand-kept')
  const bad = corpus.flatMap(({ path, text }) => specCitations(path, text))
  assert.deepEqual(bad, [], `a live surface cites a docs/specs path (specs are posterity — repoint at the maintained home or delete the pointer):\n${JSON.stringify(bad, null, 2)}`)
})

test('spec-posterity carve-outs: input-shape mechanics excluded by pattern; concrete citations and the pin scope are not', () => {
  // concrete citations flagged — markdown-link, inline-code, and mixed-case forms
  // (the whole link is one whitespace-free run, so it surfaces as one finding)
  assert.equal(specCitations('FIXTURE', 'See [`docs/specs/2026-01-01-x-design.md`](docs/specs/2026-01-01-x-design.md) §2.').length, 1, 'a markdown-link citation must be flagged')
  assert.equal(specCitations('FIXTURE', 'per `docs/specs/2026-01-01-x-design.md` §4').length, 1, 'an inline-code citation must be flagged')
  assert.equal(specCitations('FIXTURE', 'per Docs/Specs/2026-01-01-X-Design.md').length, 1, 'the match is case-insensitive')
  // emphasis-wrapped citations are decoration, not globs (paired-emphasis trim) — while an
  // unpaired trailing glob keeps its carve-out
  assert.equal(specCitations('FIXTURE', 'see **docs/specs/2026-01-01-x-design.md** §3').length, 1, 'a bold-wrapped citation must be flagged, not carved as a glob')
  assert.equal(specCitations('FIXTURE', 'see _docs/specs/2026-01-01-x-design.md_ §3').length, 1, 'an italic-underscore-wrapped citation must be flagged')
  // composite emphasis (D5, #1358 finding 9): the wrapper's markdown metacharacters are not
  // path bytes — the path-segment truncation keeps them out of the carve-out tests
  assert.equal(specCitations('FIXTURE', 'see **`docs/specs/2026-01-01-x-design.md`** §3').length, 1, 'a bold-wrapped code-span citation must be flagged, not carved as a glob')
  assert.ok(specCitations('FIXTURE', 'see **[`docs/specs/2026-01-01-x-design.md`](docs/specs/2026-01-01-x-design.md)** §3').length >= 1, 'a bold-link composite citation must be flagged')
  assert.deepEqual(specCitations('FIXTURE', 'sweep `docs/specs/2026-*` for that year'), [], 'a date-prefix glob keeps its carve-out (the emphasis trim needs a paired leading marker)')
  // #1687: a link whose TEXT half carves out (bare mention, glob, placeholder) but whose
  // TARGET half is a real spec path must still be flagged — the greedy \S* run swallows
  // the target, so the carve-out re-scans the truncated-away tail. Revert the tail re-scan
  // and each of these three returns [] (both-ways proof).
  assert.equal(specCitations('FIXTURE', 'see [docs/specs/](docs/specs/2026-01-01-x-design.md) §2').length, 1, 'a bare-mention link text must not hide a real spec target')
  assert.equal(specCitations('FIXTURE', 'see [docs/specs/*.md](docs/specs/2026-01-01-x-design.md) §2').length, 1, 'a glob link text must not hide a real spec target')
  assert.equal(specCitations('FIXTURE', 'see [docs/specs/<slug>](docs/specs/2026-01-01-x-design.md) §2').length, 1, 'a placeholder link text must not hide a real spec target')
  // the carve-out still holds when BOTH halves are mechanics
  assert.deepEqual(specCitations('FIXTURE', 'see [docs/specs/](docs/specs/<slug>-design.md) here'), [], 'a link with mechanics on both halves keeps its carve-out')
  // carve-outs: bare output dir, globs, placeholders, ellipsis, date placeholder, fenced examples
  assert.deepEqual(specCitations('FIXTURE', 'synthesizes one spec per group into `docs/specs/` — then verifies.'), [], 'the bare output directory is input-shape mechanics')
  assert.deepEqual(specCitations('FIXTURE', 'Scan `docs/specs/*.md` and `docs/specs/*-design.md` for orphans.'), [], 'glob patterns are input-shape mechanics')
  assert.deepEqual(specCitations('FIXTURE', 'named `docs/specs/<name>` or `docs/specs/2026-07-02-<slug>-design.md`'), [], 'placeholder tokens are path-shape examples')
  assert.deepEqual(specCitations('FIXTURE', 'grep the plan for a `docs/specs/…` or issue link'), [], 'a trailing ellipsis is a path-shape example')
  assert.deepEqual(specCitations('FIXTURE', 'shaped `docs/specs/YYYY-MM-DD-<slug>-design.md`; and `docs/specs/yyyy-mm-dd-x.md`'), [], 'date placeholders are path-shape examples, case-insensitively')
  assert.deepEqual(specCitations('FIXTURE', 'Example:\n```\n/war-strategy docs/specs/2026-01-01-real-design.md\n```\nprose after.'), [], 'fenced command/template examples are input-shape mechanics')
  // stripFences pins: (1) prose BETWEEN two fenced blocks stays scanned — a greedy
  // /```[\s\S]*```/ mutant would strip fence-to-fence and blind the guard across the corpus;
  // (2) an unbalanced trailing fence leaves the tail UNSTRIPPED (fail-closed), still scanned.
  assert.equal(specCitations('FIXTURE', '```\na\n```\nsee docs/specs/2026-01-01-x-design.md here\n```\nb\n```').length, 1, 'prose between two fenced blocks must still be scanned (non-greedy fence strip)')
  assert.equal(specCitations('FIXTURE', 'intro\n```\nunbalanced tail\nper docs/specs/2026-01-01-x-design.md §2').length, 1, 'an unbalanced trailing fence leaves the tail scanned (fail-closed)')
  // war-campaign/SKILL.md's legacy citation is retired (plan 2026-08-05 Task 5.1) and its
  // same-wave split pin removed at phase close — the file gets no special treatment, so a
  // resurrection there (verbatim or reworded) is flagged like any other citation
  assert.equal(specCitations('skills/war-campaign/SKILL.md', 'Full design: `docs/specs/2026-07-01-war-companion-skills-design.md` §7.').length, 1, 'a resurrection of the retired war-campaign citation is flagged (no split pin remains)')
})
