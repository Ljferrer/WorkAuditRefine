# /red-team Hardening Implementation Plan (v0.4.2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This plan is also `/war`-executable — the **Build order** below maps tasks to WAR phases.

**Goal:** Make `/red-team` either verify the correct plan with complete probe coverage, or return a non-passing verdict that says exactly what went wrong — **never a silently-wrong `CLEARED`** on a mis-targeted or partially-dropped run.

**Architecture:** Defense in depth. The **testable gate module** (`red-team-gate.mjs`, which has `*.test.mjs`) owns all decision logic — anchor validation, coverage classification, off-target discard, and the new fail-closed `INCOMPLETE` verdict. The un-testable Workflow **scaffold** stays thin: it threads a Lead-supplied **fingerprint**, prepends a **scope-lock** preamble to every prompt, requires each probe to attest what it read (`read_anchor`), retries a dropped probe once, and returns well-formed raw data (no silent `filter(Boolean)`). This mirrors the repo's `land-decision.mjs`/gate split: judgment in the tested module, thin mechanics in the Workflow.

**Tech Stack:** Node.js ES modules (`.mjs`), `node:test` + `node:assert/strict` (colocated `*.test.mjs`, no `package.json`); the Workflow scaffold is plain JS run by the Claude Code Workflow tool (compile-checked as an `AsyncFunction`, and exercised behaviorally by compiling it with mocked Workflow globals).

**Source of truth:** [`docs/specs/2026-06-19-red-team-hardening-design.md`](../specs/2026-06-19-red-team-hardening-design.md) (v0.4.2). The five failure-mode layers (L1–L5) map to the tasks below.

**Resolved open decisions (spec §8):** v0.4.2 (sequenced after the pending v0.4.1 wrap-up); `INCOMPLETE` is a **distinct** verdict (not overloaded onto `BLOCKED`); retry budget = **1**; the **gate is the canonical** anchor validator (the scaffold does no inline early-abort).

## Spec refinements (conscious deviations — ratify in the plan's red-team)
1. **Fingerprint is computed by the Lead (Bash), not the scaffold.** Workflow scripts have **no filesystem / Node API access**, so the scaffold cannot read the plan to derive `{ absPath, titleLine, tokens }`. The Lead computes it from the absolute `planFile` before launching and passes it in `args.fingerprint`. This is also *stronger*: the fingerprint is a deterministic ground truth immune to the very drift L3 detects (an in-Workflow fingerprint agent could itself drift).
2. **`repo` is added to the scaffold return + gate input.** L3 requires `read_anchor.resolved_path` to be "absolute and under `repo`"; the gate needs `repo` to check that. Spec §4's return shape gains `repo`.
3. **No inline early-abort in the scaffold** (spec §8 decision 4): the gate is the sole, tested validator — keeps the scaffold thin per the spec's own architecture principle.
4. **The optional deterministic-execution harness (spec §3 "optional deeper layer") is deferred to a follow-up plan** (`docs/plans/2026-06-20-red-team-exec-harness.md`), not built here. It is an independently-shippable subsystem; this plan delivers L1–L5 + the release.

**Build order (for `/war`):**
- **Phase 1 — Gate logic (testable core):** Task 1 → Task 2 (Task 2 builds on Task 1's `isOnTarget`).
- **Phase 2 — Scaffold raw data:** Task 3 → Task 4 → Task 5 (Task 4/5 reuse Task 3's `fingerprint` + test harness).
- **Phase 3 — Runbook & docs:** Task 6, Task 7 (independent; may run in parallel).
- **Phase 4 — Release & verify:** Task 8 → Task 9 (Task 9 depends on all).

**Back-compat contract (held by every gate change):** if `fingerprint`/`expected` are absent (a bare `[...]` array or `{ probeResults }` with no coverage info), the gate behaves exactly as it does today. Existing callers and the 10 existing gate tests stay green.

---

### Task 1: Gate — anchor attestation primitives (Layer 3 core)

**Files:**
- Modify: `skills/red-team/assets/red-team-gate.mjs` (add `import`, `normalizeTitle`, `isOnTarget`, `isUnder`)
- Test: `skills/red-team/assets/red-team-gate.test.mjs` (append)

- [ ] **Step 1: Write the failing tests**

Append to `skills/red-team/assets/red-team-gate.test.mjs`. The leading `import` is a top-level import (ESM hoists it, so appending it lower in the file is valid; no linter in this repo enforces import-first):

```js
import { normalizeTitle, isOnTarget } from './red-team-gate.mjs'

const FP = { absPath: '/repo/docs/plans/p.md', titleLine: '# My Plan', tokens: ['## A', '## B'] }
const anchor = (over = {}) => ({ resolved_path: '/repo/docs/plans/p.md', plan_title: '# My Plan', ...over })

test('normalizeTitle strips leading #, collapses whitespace, lowercases', () => {
  assert.equal(normalizeTitle('#  My   Plan '), normalizeTitle('my plan'))
  assert.equal(normalizeTitle('## My Plan'), 'my plan')
})

test('isOnTarget true when title matches and path is absolute under repo', () => {
  assert.equal(isOnTarget({ read_anchor: anchor() }, FP, '/repo'), true)
})

test('isOnTarget false when the attested title is a different plan (the drift signal)', () => {
  assert.equal(isOnTarget({ read_anchor: anchor({ plan_title: '# OmniEMR Section B' }) }, FP, '/repo'), false)
})

test('isOnTarget false when resolved_path is outside repo', () => {
  assert.equal(isOnTarget({ read_anchor: anchor({ resolved_path: '/other/docs/plans/p.md' }) }, FP, '/repo'), false)
})

test('isOnTarget false when resolved_path is not absolute', () => {
  assert.equal(isOnTarget({ read_anchor: anchor({ resolved_path: 'docs/plans/p.md' }) }, FP, '/repo'), false)
})

test('isOnTarget false when read_anchor is missing (required attestation absent)', () => {
  assert.equal(isOnTarget({ findings: [] }, FP, '/repo'), false)
})

test('isOnTarget true (back-compat) when no fingerprint is supplied', () => {
  assert.equal(isOnTarget({ findings: [] }, null, null), true)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd /path/to/WorkAuditRefine && node --test skills/red-team/assets/red-team-gate.test.mjs`
Expected: FAIL — `SyntaxError`/`The requested module './red-team-gate.mjs' does not provide an export named 'normalizeTitle'`.

- [ ] **Step 3: Write the minimal implementation**

In `skills/red-team/assets/red-team-gate.mjs`, add this import as the **first line** of the file (above the leading comment):

```js
import { isAbsolute } from 'node:path'
```

Then insert the following **after** the `allFindings` function (before `dedupe`):

```js
// --- Layer 3: anchor attestation --------------------------------------------
// Normalize a plan's title line for tolerant comparison: drop a leading '# ',
// collapse internal whitespace, lowercase.
export function normalizeTitle(s) {
  return String(s || '').replace(/^#+\s*/, '').replace(/\s+/g, ' ').trim().toLowerCase()
}

// True iff `p` is exactly `repo` or sits under `repo/`.
function isUnder(p, repo) {
  const base = String(repo).replace(/\/+$/, '')
  return p === base || p.startsWith(base + '/')
}

// A probe result is ON-TARGET iff it attests reading the RIGHT plan:
//  - read_anchor.plan_title matches the fingerprint's titleLine (normalized), AND
//  - read_anchor.resolved_path is absolute and under `repo`.
// A missing/non-object read_anchor ⇒ off-target (it cannot prove what it read).
// Back-compat: with no fingerprint, anchors are not enforced (returns true).
export function isOnTarget(result, fingerprint, repo) {
  if (!fingerprint) return true
  const a = result && result.read_anchor
  if (!a || typeof a !== 'object') return false
  const titleOk = normalizeTitle(a.plan_title) === normalizeTitle(fingerprint.titleLine)
  const p = a.resolved_path
  const pathOk = typeof p === 'string' && isAbsolute(p) && (!repo || isUnder(p, repo))
  return titleOk && pathOk
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test skills/red-team/assets/red-team-gate.test.mjs`
Expected: PASS — 17 tests, 0 fail (the 10 existing + 7 new).

- [ ] **Step 5: Commit**

```bash
git add skills/red-team/assets/red-team-gate.mjs skills/red-team/assets/red-team-gate.test.mjs
git commit -m "feat(red-team): gate anchor attestation — normalizeTitle + isOnTarget (L3)"
```

---

### Task 2: Gate — coverage classification + fail-closed `INCOMPLETE` (Layer 4 core)

**Files:**
- Modify: `skills/red-team/assets/red-team-gate.mjs` (add `classifyCoverage`, `isIncomplete`; extend `verdict`, `summarize`; rewire `main`)
- Test: `skills/red-team/assets/red-team-gate.test.mjs` (append)

- [ ] **Step 1: Write the failing tests**

Append to `skills/red-team/assets/red-team-gate.test.mjs`:

```js
import { classifyCoverage, isIncomplete } from './red-team-gate.mjs'

const onResult = (probe, findings = []) =>
  ({ probe, technique: 'analyzed', status: 'pass', read_anchor: anchor(), findings })
const offResult = (probe) =>
  ({ probe, technique: 'analyzed', status: 'pass', read_anchor: anchor({ plan_title: '# Wrong Plan' }), findings: [F('Major')] })
const droppedMarker = (probe) => ({ probe, dropped: true })

test('classifyCoverage splits on-target / off-target / dropped', () => {
  const c = classifyCoverage(
    [onResult('a'), offResult('b'), droppedMarker('c')], 3, FP, '/repo')
  assert.deepEqual(c.onTarget.map(r => r.probe), ['a'])
  assert.deepEqual(c.offTarget, ['b'])
  assert.deepEqual(c.dropped, ['c'])
  assert.equal(c.ran, 2)
  assert.equal(c.expected, 3)
})

test('isIncomplete true when a probe is off-target', () => {
  assert.equal(isIncomplete(classifyCoverage([onResult('a'), offResult('b')], 2, FP, '/repo')), true)
})

test('isIncomplete true when a probe was dropped', () => {
  assert.equal(isIncomplete(classifyCoverage([onResult('a'), droppedMarker('b')], 2, FP, '/repo')), true)
})

test('isIncomplete true when fewer probes ran than expected', () => {
  assert.equal(isIncomplete(classifyCoverage([onResult('a')], 3, FP, '/repo')), true)
})

test('isIncomplete false on full on-target coverage', () => {
  assert.equal(isIncomplete(classifyCoverage([onResult('a'), onResult('b')], 2, FP, '/repo')), false)
})

// --- verdict with coverage (the F1/F2/F3 regressions) ---
test('verdict INCOMPLETE when an off-target probe is present, never CLEARED (F1/F3)', () => {
  const cov = classifyCoverage([onResult('a'), offResult('b')], 2, FP, '/repo')
  assert.equal(verdict(allFindings(cov.onTarget), cov), 'INCOMPLETE')
})

test('verdict INCOMPLETE when a probe was dropped, never CLEARED (F2)', () => {
  const cov = classifyCoverage([onResult('a'), droppedMarker('b')], 2, FP, '/repo')
  assert.equal(verdict(allFindings(cov.onTarget), cov), 'INCOMPLETE')
})

test('off-target findings are discarded — they never reach classify/verdict', () => {
  const cov = classifyCoverage([onResult('a'), offResult('b')], 2, FP, '/repo')
  // offResult carried a Major; because it is off-target it must not appear in on-target findings.
  assert.equal(allFindings(cov.onTarget).length, 0)
})

test('verdict CLEARED on full on-target coverage with no findings (preserves today)', () => {
  const cov = classifyCoverage([onResult('a'), onResult('b')], 2, FP, '/repo')
  assert.equal(verdict(allFindings(cov.onTarget), cov), 'CLEARED')
})

test('verdict BLOCKED on full coverage with an on-target Major', () => {
  const cov = classifyCoverage([onResult('a', [F('Major')]), onResult('b')], 2, FP, '/repo')
  assert.equal(verdict(allFindings(cov.onTarget), cov), 'BLOCKED')
})

test('verdict back-compat: no coverage arg behaves as today', () => {
  assert.equal(verdict([F('Major')]), 'BLOCKED')
  assert.equal(verdict([]), 'CLEARED')
})

test('summarize with coverage reports expected / onTarget / offTarget / dropped', () => {
  const cov = classifyCoverage([onResult('a'), offResult('b'), droppedMarker('c')], 3, FP, '/repo')
  const s = summarize(cov.onTarget, cov)
  assert.equal(s.expected, 3)
  assert.equal(s.onTarget, 1)
  assert.deepEqual(s.offTarget, ['b'])
  assert.deepEqual(s.dropped, ['c'])
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test skills/red-team/assets/red-team-gate.test.mjs`
Expected: FAIL — no export `classifyCoverage`/`isIncomplete`; `verdict`/`summarize` ignore the 2nd arg.

- [ ] **Step 3: Add `classifyCoverage` + `isIncomplete`**

In `skills/red-team/assets/red-team-gate.mjs`, insert after `isOnTarget` (the Layer 3 block from Task 1):

```js
// --- Layer 4: coverage accounting + fail-closed verdict ----------------------
// Split probeResults into on-target / off-target / dropped. A dropped marker is
// { probe, dropped:true } (the scaffold emits one per probe whose agent died after
// a retry). Off-target findings are discarded by the caller (they describe the wrong
// artifact). `ran` = on-target + off-target (the slots that produced a real result).
export function classifyCoverage(probeResults, expected, fingerprint, repo) {
  const results = Array.isArray(probeResults) ? probeResults : []
  const dropped = [], onTarget = [], offTarget = []
  for (const r of results) {
    if (!r) continue
    if (r.dropped === true) { dropped.push(r.probe || 'unknown'); continue }
    if (isOnTarget(r, fingerprint, repo)) onTarget.push(r)
    else offTarget.push(r.probe || 'unknown')
  }
  const ran = onTarget.length + offTarget.length
  const exp = Number.isInteger(expected) ? expected : ran + dropped.length
  return { onTarget, offTarget, dropped, ran, expected: exp }
}

// INCOMPLETE when any probe was off-target, any was dropped, or fewer ran than expected.
export function isIncomplete(coverage) {
  if (!coverage) return false
  return coverage.offTarget.length > 0 || coverage.dropped.length > 0 || coverage.ran < coverage.expected
}
```

- [ ] **Step 4: Extend `verdict` and `summarize` (back-compatible)**

In the same file, replace the existing `verdict`:

```js
export function verdict(findings) {
  const { blockers, needsDecision, minors } = classify(findings)
  if (blockers.length || needsDecision.length) return 'BLOCKED'
  return minors.length ? 'CLEARED-WITH-NOTES' : 'CLEARED'
}
```

with:

```js
// `coverage` (optional) is the classifyCoverage result. Incomplete coverage is fail-closed:
// the gate NEVER returns CLEARED while a probe was off-target, dropped, or never ran.
export function verdict(findings, coverage = null) {
  if (isIncomplete(coverage)) return 'INCOMPLETE'
  const { blockers, needsDecision, minors } = classify(findings)
  if (blockers.length || needsDecision.length) return 'BLOCKED'
  return minors.length ? 'CLEARED-WITH-NOTES' : 'CLEARED'
}
```

And replace the existing `summarize`:

```js
export function summarize(results) {
  const r = (results || []).filter(Boolean)
  const count = pred => r.filter(pred).length
  return {
    probes: r.length,
    executed: count(x => x.technique === 'executed'),
    analyzed: count(x => x.technique === 'analyzed'),
    pass: count(x => x.status === 'pass'),
    fail: count(x => x.status === 'fail'),
    warn: count(x => x.status === 'warn'),
  }
}
```

with:

```js
// When `coverage` is supplied, the summary also reports the coverage accounting
// (expected vs on-target, plus the off-target / dropped probe names).
export function summarize(results, coverage = null) {
  const r = (results || []).filter(Boolean)
  const count = pred => r.filter(pred).length
  const base = {
    probes: r.length,
    executed: count(x => x.technique === 'executed'),
    analyzed: count(x => x.technique === 'analyzed'),
    pass: count(x => x.status === 'pass'),
    fail: count(x => x.status === 'fail'),
    warn: count(x => x.status === 'warn'),
  }
  if (coverage) {
    base.expected = coverage.expected
    base.onTarget = coverage.onTarget.length
    base.offTarget = coverage.offTarget
    base.dropped = coverage.dropped
  }
  return base
}
```

- [ ] **Step 5: Rewire `main` to classify coverage and discard off-target findings**

In the same file, in `main`, replace these three lines:

```js
  const results = Array.isArray(parsed) ? parsed : (parsed.probeResults || [])
  const findings = allFindings(results)
  process.stdout.write(JSON.stringify(
    { verdict: verdict(findings), ...classify(findings), summary: summarize(results) }, null, 2) + '\n')
```

with:

```js
  const results = Array.isArray(parsed) ? parsed : (parsed.probeResults || [])
  const fingerprint = Array.isArray(parsed) ? null : (parsed.fingerprint || null)
  const repo = Array.isArray(parsed) ? null : (parsed.repo || null)
  const expected = Array.isArray(parsed) ? undefined : parsed.expected
  // Coverage accounting kicks in once the run supplies a fingerprint or an expected count;
  // otherwise behave exactly as before. Off-target findings are discarded before classify.
  const coverage = (fingerprint || Number.isInteger(expected))
    ? classifyCoverage(results, expected, fingerprint, repo)
    : null
  const trusted = coverage ? coverage.onTarget : results
  const findings = allFindings(trusted)
  process.stdout.write(JSON.stringify(
    { verdict: verdict(findings, coverage), ...classify(findings), summary: summarize(trusted, coverage) },
    null, 2) + '\n')
```

- [ ] **Step 6: Run the full gate test file + a CLI smoke test**

Run: `node --test skills/red-team/assets/red-team-gate.test.mjs`
Expected: PASS — 30 tests, 0 fail (17 from Task 1 + 13 new).

CLI smoke (an off-target probe must force `INCOMPLETE`, not `CLEARED`):

```bash
echo '{"fingerprint":{"absPath":"/repo/docs/plans/p.md","titleLine":"# My Plan"},"repo":"/repo","expected":2,"probeResults":[{"probe":"a","technique":"analyzed","status":"pass","read_anchor":{"resolved_path":"/repo/docs/plans/p.md","plan_title":"# My Plan"},"findings":[]},{"probe":"b","dropped":true}]}' \
  | node skills/red-team/assets/red-team-gate.mjs --stdin
```

Expected: JSON with `"verdict": "INCOMPLETE"` and `summary.dropped` containing `"b"`.

- [ ] **Step 7: Commit**

```bash
git add skills/red-team/assets/red-team-gate.mjs skills/red-team/assets/red-team-gate.test.mjs
git commit -m "feat(red-team): gate coverage classification + fail-closed INCOMPLETE (L4)"
```

---

### Task 3: Scaffold — behavioral test harness + fingerprint threading & pre-flight (Layer 1)

**Files:**
- Modify: `skills/red-team/assets/workflow-scaffold.js` (destructure + require `fingerprint`; thread it; new return fields)
- Test: `skills/red-team/assets/workflow-scaffold.test.mjs` (add the behavioral harness + L1 tests)

- [ ] **Step 1: Add the behavioral harness + failing tests**

Append to `skills/red-team/assets/workflow-scaffold.test.mjs`:

```js
// --- Behavioral harness: run the scaffold exactly as the Workflow runtime does --------------
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

function compileScaffold() {
  const body = src.replace(/^export const meta/m, 'const meta')
  return new AsyncFunction('agent', 'parallel', 'pipeline', 'log', 'phase', 'args', 'budget', body)
}

// Faithful pipeline: each item flows through every stage independently; a throwing stage drops
// it to null (mirrors the Workflow tool's documented pipeline() semantics).
async function fakePipeline(items, ...stages) {
  return Promise.all(items.map(async (item, i) => {
    let v = item
    for (const stage of stages) {
      try { v = await stage(v, item, i) } catch { return null }
    }
    return v
  }))
}

// Run the scaffold with a mock `agent`. agentImpl(prompt, opts) returns the probe/confirm result
// (or null to simulate a dead probe). Captures every prompt + opts and every log line.
async function runScaffold(args, agentImpl) {
  const prompts = [], logs = []
  const fn = compileScaffold()
  const agent = async (prompt, opts = {}) => { prompts.push({ prompt, opts }); return agentImpl(prompt, opts) }
  const log = (m) => logs.push(m)
  const out = await fn(agent, () => {}, fakePipeline, log, () => {}, args, {})
  return { out, prompts, logs }
}

const FP = { absPath: '/abs/PLAN.md', titleLine: '# Land-path-agnostic Wrap-up', tokens: ['## A'] }
const anchorOf = (a) => ({ resolved_path: a.planFile, plan_title: a.fingerprint.titleLine })
const baseArgs = (over = {}) =>
  ({ planFile: '/abs/PLAN.md', repo: '/abs/REPO', sourceSpec: '/abs/SPEC.md', fingerprint: FP, probes: [], ...over })
// Default mock: every probe passes, attesting it read the right plan.
const passResult = (a) => (_, opts) =>
  ({ probe: opts.label, kind: 'spine', technique: 'analyzed', status: 'pass', read_anchor: anchorOf(a), findings: [] })

test('scaffold return threads the fingerprint + expected + repo to the gate', async () => {
  const a = baseArgs()
  const { out } = await runScaffold(a, passResult(a))
  assert.deepEqual(out.fingerprint, FP, 'fingerprint is threaded through unchanged')
  assert.equal(out.repo, '/abs/REPO', 'repo is returned for the gate under-repo check')
  assert.equal(out.expected, 5, 'expected = number of probes that ran (5 spine, sourceSpec set)')
  assert.equal(out.plan, '/abs/PLAN.md')
})

test('scaffold aborts when no fingerprint is supplied (Lead pre-flight is mandatory)', async () => {
  await assert.rejects(
    runScaffold(baseArgs({ fingerprint: undefined }), () => ({ status: 'pass', findings: [] })),
    /fingerprint/i,
    'a missing fingerprint must fail loud, not run unanchored probes'
  )
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test skills/red-team/assets/workflow-scaffold.test.mjs`
Expected: FAIL — `out.fingerprint`/`out.expected` are `undefined`; the abort test fails because the scaffold does not yet check for a missing fingerprint.

- [ ] **Step 3: Require + thread the fingerprint; update the return**

In `skills/red-team/assets/workflow-scaffold.js`, replace this line:

```js
const { planFile, repo, sourceSpec = 'none', probes = [] } = args
```

with:

```js
const { planFile, repo, sourceSpec = 'none', probes = [], fingerprint } = args

// Layer 1 — the fingerprint is the deterministic ground truth the gate validates every probe
// against. The Workflow sandbox has NO filesystem access, so the Lead computes it (Bash) from the
// absolute planFile and passes it in. Fail loud if it is missing — an unanchored run cannot detect
// wrong-target drift (see SKILL.md "Pre-flight").
if (!fingerprint || !fingerprint.titleLine) {
  throw new Error('red-team scaffold: args.fingerprint { absPath, titleLine, tokens } is required (Lead pre-flight) — refusing to run unanchored.')
}
```

Then replace the final return:

```js
return { plan: planFile, probeResults: results.filter(Boolean) }
```

with:

```js
return { plan: planFile, repo, fingerprint, expected: allProbes.length, probeResults: results.filter(Boolean) }
```

(`probeResults` becomes dropped-marker-aware in Task 5; this task only threads L1 data.)

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test skills/red-team/assets/workflow-scaffold.test.mjs`
Expected: PASS — all existing scaffold tests plus the 2 new ones, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add skills/red-team/assets/workflow-scaffold.js skills/red-team/assets/workflow-scaffold.test.mjs
git commit -m "feat(red-team): scaffold requires + threads Lead fingerprint (L1)"
```

---

### Task 4: Scaffold — scope-lock preamble on every prompt (Layer 2)

**Files:**
- Modify: `skills/red-team/assets/workflow-scaffold.js` (add `scopeLock`; prepend to probe + confirm prompts)
- Test: `skills/red-team/assets/workflow-scaffold.test.mjs` (append)

- [ ] **Step 1: Write the failing tests**

Append to `skills/red-team/assets/workflow-scaffold.test.mjs`:

```js
test('scaffold structure OK — scopeLock is a declared, invoked constant (survives comment stripping)', () => {
  const stripped = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
  assert.ok(/scopeLock\s*=/.test(stripped), 'scopeLock must be a declared constant, not only a comment')
  assert.ok(/scopeLock\(/.test(stripped), 'scopeLock must be invoked in executable code')
})

test('every probe prompt is scope-locked to the absolute planFile + repo + fingerprint title', async () => {
  const a = baseArgs({ probes: [
    { name: 'b1', kind: 'bespoke', technique: 'executed', prompt: 'do b1' },
    { name: 'b2', kind: 'bespoke', technique: 'analyzed', prompt: 'do b2' },
  ] })
  const { prompts } = await runScaffold(a, passResult(a))
  const probePrompts = prompts.filter(p => p.opts.phase === 'Probe')
  assert.equal(probePrompts.length, 7, '5 spine (sourceSpec set keeps coverage-vs-source) + 2 bespoke')
  for (const { prompt } of probePrompts) {
    assert.match(prompt, /SCOPE-LOCK/, 'every probe prompt carries the SCOPE-LOCK preamble')
    assert.ok(prompt.includes('/abs/PLAN.md'), 'scope-lock names the absolute planFile')
    assert.ok(prompt.includes('/abs/REPO'), 'scope-lock names the absolute repo')
    assert.ok(prompt.includes('Land-path-agnostic Wrap-up'), 'scope-lock names the expected plan title')
    assert.match(prompt, /IGNORE the session cwd/, 'scope-lock disowns the ambient cwd')
  }
})

test('executed probes are told to work in a COPY of repo; analyzed probes are read-restricted', async () => {
  const a = baseArgs()
  const { prompts } = await runScaffold(a, passResult(a))
  const byLabel = Object.fromEntries(prompts.map(p => [p.opts.label, p.prompt]))
  assert.match(byLabel['probe:executable-proof'], /cp -R|worktree add/, 'executed probe copies the repo')
  assert.match(byLabel['probe:executable-proof'], /\bcd\b/, 'executed probe cds into the copy')
  assert.match(byLabel['probe:claims-vs-reality'], /Restrict every Read/, 'analyzed probe is read-restricted to repo')
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test skills/red-team/assets/workflow-scaffold.test.mjs`
Expected: FAIL — no `scopeLock` token; prompts contain no `SCOPE-LOCK`/`cp -R`/`Restrict every Read`.

- [ ] **Step 3: Add the `scopeLock` constant**

In `skills/red-team/assets/workflow-scaffold.js`, insert immediately **after** the fingerprint guard added in Task 3 (after the `if (!fingerprint ...) throw` block) and **before** `const SPINE = [`:

```js
// Layer 2 — SCOPE-LOCK preamble. /red-team is routinely launched from project X's session to
// verify project Y's plan; a probe agent's ambient cwd + CLAUDE.md + memory otherwise OVERPOWER
// the explicit args and it red-teams the WRONG artifact. Prepended to EVERY probe (spine AND
// bespoke) and EVERY confirm. It also asks the agent to attest, in read_anchor, the plan it
// actually read — the gate validates that against the fingerprint (Layer 3). Prevention here;
// detection in the gate.
const scopeLock = (technique) => [
  'SCOPE-LOCK — READ THIS FIRST. IT OVERRIDES ANY AMBIENT PROJECT CONTEXT.',
  `You may be running inside an UNRELATED project's working directory. IGNORE the session cwd, its CLAUDE.md, and its memory.`,
  `The ONLY subject of this red-team is the plan file at ${planFile} (titled "${fingerprint.titleLine}")${sourceSpec !== 'none' ? `, its source spec ${sourceSpec},` : ','} and the repository rooted at ${repo}.`,
  `Do not read, reference, or reason about any file outside ${repo} (other than the plan/spec named above).`,
  technique === 'executed'
    ? `To inspect or run anything, first copy the repo into a throwaway sandbox (e.g. \`cp -R ${repo} <tmp>\` or \`git -C ${repo} worktree add <tmp>\`) and \`cd\` into that copy — run there only, never from the session cwd, and NEVER mutate ${repo}.`
    : `Restrict every Read / Grep / Glob to paths under ${repo} (plus the plan/spec named above); open nothing else on the machine.`,
  `If the plan you open is NOT titled "${fingerprint.titleLine}", or you find yourself reading another project's files, STOP — you are on the WRONG plan. Re-open ${planFile} and confine yourself to ${repo}.`,
  `In your FINDINGS result you MUST set read_anchor.resolved_path to the ABSOLUTE path of the plan file you actually read and read_anchor.plan_title to its first "# " heading line. This is checked against the expected plan; a mismatch discards your findings.`,
].join('\n')
```

- [ ] **Step 4: Prepend `scopeLock` to the probe + confirm prompts**

In the same file, in the `pipeline(...)` call, change the probe-stage `agent(` prompt from:

```js
    `${p.prompt}\n\nReturn ONLY the FINDINGS object (probe="${p.name}", kind="${p.kind}", technique="${p.technique}"). Prove any failure with reproduced evidence; never assert. Set needsDecision:true on any finding that is an ambiguity with more than one non-equivalent resolution — a hole only the user can settle.`,
```

to:

```js
    `${scopeLock(p.technique)}\n\n${p.prompt}\n\nReturn ONLY the FINDINGS object (probe="${p.name}", kind="${p.kind}", technique="${p.technique}"). Prove any failure with reproduced evidence; never assert. Set needsDecision:true on any finding that is an ambiguity with more than one non-equivalent resolution — a hole only the user can settle.`,
```

and change the confirm-stage `agent(` prompt from:

```js
      `Independently try to REFUTE this red-team finding — reproduce it or disprove it. `
      + `Work ONLY in a throwaway sandbox; never touch ${repo}.\nProbe: ${p.name}\nPlan: ${planFile}\n`
      + `Findings: ${JSON.stringify(res.findings)}`,
```

to:

```js
      `${scopeLock(p.technique)}\n\n`
      + `Independently try to REFUTE this red-team finding — reproduce it or disprove it. `
      + `Work ONLY in a throwaway sandbox; never touch ${repo}.\nProbe: ${p.name}\nPlan: ${planFile}\n`
      + `Findings: ${JSON.stringify(res.findings)}`,
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --test skills/red-team/assets/workflow-scaffold.test.mjs`
Expected: PASS — all prior scaffold tests + the 3 new ones, 0 fail.

- [ ] **Step 6: Commit**

```bash
git add skills/red-team/assets/workflow-scaffold.js skills/red-team/assets/workflow-scaffold.test.mjs
git commit -m "feat(red-team): scope-lock preamble on every probe + confirm (L2)"
```

---

### Task 5: Scaffold — required `read_anchor`, dropped markers, retry-once, return shape (Layers 3+4 data)

**Files:**
- Modify: `skills/red-team/assets/workflow-scaffold.js` (FINDINGS schema; named pipeline stages; retry + dropped markers)
- Test: `skills/red-team/assets/workflow-scaffold.test.mjs` (append)

- [ ] **Step 1: Write the failing tests**

Append to `skills/red-team/assets/workflow-scaffold.test.mjs`:

```js
test('FINDINGS schema requires read_anchor (Layer 3 attestation is mandatory)', async () => {
  const a = baseArgs()
  const { prompts } = await runScaffold(a, passResult(a))
  const probe = prompts.find(p => p.opts.phase === 'Probe')
  const required = probe.opts.schema.required
  assert.ok(required.includes('read_anchor'), 'read_anchor is a required FINDINGS field')
  assert.ok(probe.opts.schema.properties.read_anchor.required.includes('resolved_path'))
  assert.ok(probe.opts.schema.properties.read_anchor.required.includes('plan_title'))
})

test('a dropped probe is retried once, then emitted as a { probe, dropped:true } marker', async () => {
  const a = baseArgs()
  let calls = 0
  // claims-vs-reality dies on BOTH the initial run and the retry; everything else passes.
  const { out, logs } = await runScaffold(a, (_, opts) => {
    if (opts.phase === 'Probe' && opts.label === 'probe:claims-vs-reality') { calls++; return null }
    return { probe: opts.label, technique: 'analyzed', status: 'pass', read_anchor: anchorOf(a), findings: [] }
  })
  assert.equal(calls, 2, 'the dead probe was attempted twice (initial + one retry)')
  const marker = out.probeResults.find(r => r && r.dropped === true)
  assert.ok(marker, 'a dropped marker is emitted, not a silent omission')
  assert.equal(marker.probe, 'claims-vs-reality')
  assert.equal(out.probeResults.length, out.expected, 'every probe slot yields a result or a marker')
  assert.ok(logs.some(l => /retry/i.test(l)), 'the retry is logged')
})

test('a probe that dies once then succeeds on retry yields a real result (no marker)', async () => {
  const a = baseArgs()
  let first = true
  const { out } = await runScaffold(a, (_, opts) => {
    if (opts.phase === 'Probe' && opts.label === 'probe:dependency-feasibility' && first) { first = false; return null }
    return { probe: opts.label, technique: 'analyzed', status: 'pass', read_anchor: anchorOf(a), findings: [] }
  })
  assert.ok(!out.probeResults.some(r => r && r.dropped === true), 'retry succeeded — no dropped marker')
  assert.equal(out.probeResults.length, out.expected)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test skills/red-team/assets/workflow-scaffold.test.mjs`
Expected: FAIL — `read_anchor` not in the schema's `required`; no retry (dead probe silently dropped); `probeResults` omits dead slots instead of marking them.

- [ ] **Step 3: Make `read_anchor` a required FINDINGS field**

In `skills/red-team/assets/workflow-scaffold.js`, replace the `FINDINGS` schema:

```js
const FINDINGS = { type: 'object', required: ['probe', 'kind', 'technique', 'status', 'findings'], properties: {
  probe: { type: 'string' }, kind: { enum: ['spine', 'bespoke'] }, technique: { enum: ['executed', 'analyzed'] },
  sandbox: { type: 'string' }, status: { enum: ['pass', 'fail', 'warn'] },
  findings: { type: 'array', items: { type: 'object', properties: {
    severity: { enum: ['Critical', 'Major', 'Minor'] }, needsDecision: { type: 'boolean' },
    claim: { type: 'string' }, reality: { type: 'string' }, evidence: { type: 'string' },
    fix: { type: 'string' }, planRef: { type: 'string' } } } } } }
```

with (adds `read_anchor` to `required` and `properties`):

```js
const FINDINGS = { type: 'object', required: ['probe', 'kind', 'technique', 'status', 'findings', 'read_anchor'], properties: {
  probe: { type: 'string' }, kind: { enum: ['spine', 'bespoke'] }, technique: { enum: ['executed', 'analyzed'] },
  sandbox: { type: 'string' }, status: { enum: ['pass', 'fail', 'warn'] },
  // Layer 3 attestation: what the probe ACTUALLY read. The gate validates it against the fingerprint.
  read_anchor: { type: 'object', required: ['resolved_path', 'plan_title'], properties: {
    resolved_path: { type: 'string' }, plan_title: { type: 'string' } } },
  findings: { type: 'array', items: { type: 'object', properties: {
    severity: { enum: ['Critical', 'Major', 'Minor'] }, needsDecision: { type: 'boolean' },
    claim: { type: 'string' }, reality: { type: 'string' }, evidence: { type: 'string' },
    fix: { type: 'string' }, planRef: { type: 'string' } } } } } }
```

- [ ] **Step 4: Name the pipeline stages, retry dropped probes once, emit markers**

In the same file, replace the entire `const results = await pipeline(...)` block **and** the final `return` (the block that currently begins `const results = await pipeline(` and ends with the `return { plan: planFile, repo, fingerprint, ... }` line from Task 3):

```js
const results = await pipeline(
  allProbes,
  p => agent(
    `${scopeLock(p.technique)}\n\n${p.prompt}\n\nReturn ONLY the FINDINGS object (probe="${p.name}", kind="${p.kind}", technique="${p.technique}"). Prove any failure with reproduced evidence; never assert. Set needsDecision:true on any finding that is an ambiguity with more than one non-equivalent resolution — a hole only the user can settle.`,
    { label: `probe:${p.name}`, phase: 'Probe',
      agentType: p.technique === 'analyzed' ? 'Explore' : undefined, schema: FINDINGS }),
  async (res, p) => {                                   // adversarial-confirm: refute any reproducible blocker
    const blocking = res && (res.findings || []).some(f => f.severity === 'Critical' || f.severity === 'Major')
    if (!res || (res.status !== 'fail' && !blocking)) return res
    const c = await agent(
      `${scopeLock(p.technique)}\n\n`
      + `Independently try to REFUTE this red-team finding — reproduce it or disprove it. `
      + `Work ONLY in a throwaway sandbox; never touch ${repo}.\nProbe: ${p.name}\nPlan: ${planFile}\n`
      + `Findings: ${JSON.stringify(res.findings)}`,
      { label: `${ADVERSARIAL_CONFIRM}:${p.name}`, phase: 'Confirm',
        agentType: p.technique === 'analyzed' ? 'Explore' : undefined, schema: CONFIRM })
    if (c && c.reproduced === false) {
      return { ...res, status: 'warn',
        findings: (res.findings || []).map(f => ({ ...f, severity: 'Minor',
          reality: `${f.reality || ''} [unreproduced — downgraded by ${ADVERSARIAL_CONFIRM}: ${c.note || ''}]` })) }
    }
    return res
  })

return { plan: planFile, repo, fingerprint, expected: allProbes.length, probeResults: results.filter(Boolean) }
```

with:

```js
// Probe (stage 1) + adversarial-confirm (stage 2) as named stages so a dropped probe can be retried.
const runProbe = (p) => agent(
  `${scopeLock(p.technique)}\n\n${p.prompt}\n\nReturn ONLY the FINDINGS object (probe="${p.name}", kind="${p.kind}", technique="${p.technique}"). Prove any failure with reproduced evidence; never assert. Set needsDecision:true on any finding that is an ambiguity with more than one non-equivalent resolution — a hole only the user can settle.`,
  { label: `probe:${p.name}`, phase: 'Probe',
    agentType: p.technique === 'analyzed' ? 'Explore' : undefined, schema: FINDINGS })

const confirmStage = async (res, p) => {               // adversarial-confirm: refute any reproducible blocker
  const blocking = res && (res.findings || []).some(f => f.severity === 'Critical' || f.severity === 'Major')
  if (!res || (res.status !== 'fail' && !blocking)) return res
  const c = await agent(
    `${scopeLock(p.technique)}\n\n`
    + `Independently try to REFUTE this red-team finding — reproduce it or disprove it. `
    + `Work ONLY in a throwaway sandbox; never touch ${repo}.\nProbe: ${p.name}\nPlan: ${planFile}\n`
    + `Findings: ${JSON.stringify(res.findings)}`,
    { label: `${ADVERSARIAL_CONFIRM}:${p.name}`, phase: 'Confirm',
      agentType: p.technique === 'analyzed' ? 'Explore' : undefined, schema: CONFIRM })
  if (c && c.reproduced === false) {
    return { ...res, status: 'warn',
      findings: (res.findings || []).map(f => ({ ...f, severity: 'Minor',
        reality: `${f.reality || ''} [unreproduced — downgraded by ${ADVERSARIAL_CONFIRM}: ${c.note || ''}]` })) }
  }
  return res
}

const results = await pipeline(allProbes, runProbe, confirmStage)

// Layer 4 — never silently drop a dead probe. A null = the agent died after the harness's own
// retries (or was skipped). Retry it ONCE; if it still dies, emit a { probe, dropped:true } marker
// so the gate counts the coverage gap and refuses to return CLEARED on a thinner run.
const probeResults = []
for (let i = 0; i < allProbes.length; i++) {
  let r = results[i]
  if (!r) {
    log(`Probe ${allProbes[i].name} returned no result — retrying once.`)
    const retried = await pipeline([allProbes[i]], runProbe, confirmStage)
    r = retried[0]
  }
  probeResults.push(r || { probe: allProbes[i].name, dropped: true })
}
const dropped = probeResults.filter(r => r && r.dropped).map(r => r.probe)
if (dropped.length) log(`⚠ coverage gap: ${dropped.length}/${allProbes.length} probe(s) dropped after retry — ${dropped.join(', ')}. The gate will return INCOMPLETE.`)

return { plan: planFile, repo, fingerprint, expected: allProbes.length, probeResults }
```

- [ ] **Step 5: Run the scaffold tests + the AsyncFunction syntax check**

Run: `node --test skills/red-team/assets/workflow-scaffold.test.mjs`
Expected: PASS — all scaffold tests including the 3 new ones, 0 fail.

Standalone syntax check (the project's canonical scaffold check):

```bash
node -e "const s=require('fs').readFileSync('skills/red-team/assets/workflow-scaffold.js','utf8').replace(/^export const meta/m,'const meta');new (Object.getPrototypeOf(async function(){}).constructor)('agent','parallel','pipeline','log','phase','args','budget',s);console.log('scaffold syntax OK')"
```

Expected: prints `scaffold syntax OK`.

- [ ] **Step 6: Commit**

```bash
git add skills/red-team/assets/workflow-scaffold.js skills/red-team/assets/workflow-scaffold.test.mjs
git commit -m "feat(red-team): required read_anchor + dropped markers + retry-once (L3/L4 data)"
```

---

### Task 6: SKILL.md — Lead pre-flight, foreign-cwd handling (Layer 5), INCOMPLETE handling, invariant

**Files:**
- Modify: `skills/red-team/SKILL.md` (Run note; Steps 2/3/4/5/6; Invariants)

- [ ] **Step 1: Note the foreign-cwd default in the Run section**

Replace:

```
Default `<plan-file>` = the most recent `docs/plans/*.md`; `--repo` = cwd.
```

with:

```
Default `<plan-file>` = the most recent `docs/plans/*.md`; `--repo` = cwd. **`--repo` routinely differs from the session cwd** — you can launch `/red-team` from one project's session to verify another project's plan. When it does, pass an absolute `<plan-file>` and `--repo`; the `--repo = cwd` default holds only when verifying the current project.
```

- [ ] **Step 2: Add the Pre-flight to Step 2 (Lead computes fingerprint + scope assertions)**

Replace Step 2:

```
2. **Derive probes.** The five **spine** lenses always run. Then scan the plan for features and add **bespoke probes** from the catalog in `references/lenses.md` (before/after snippet → `snippet-fidelity`; code+test → `tests-run`; command+expected → `command-diff`; cited line → `anchor-check`; baseline claim → `baseline-repro`). Preview the attack surface (skip under `--fast`).
```

with:

```
2. **Pre-flight + derive probes.** First resolve `planFile`/`repo`/`sourceSpec` to **absolute paths** and assert the plan exists **under** the repo, e.g. `test -f "$PLAN" && case "$PLAN" in "$REPO"/*) ;; *) echo "plan not under repo"; esac` and `git -C "$REPO" rev-parse --show-toplevel`. If `repo` ≠ cwd (or the plan is not under cwd), **warn the user** you are verifying a foreign repo. Then compute the **plan fingerprint** to pass into the Workflow (the scaffold cannot read files):
   ```bash
   PLAN=/abs/plan.md; TITLE=$(grep -m1 '^# ' "$PLAN")
   # fingerprint = { absPath: "$PLAN", titleLine: "$TITLE", tokens: [first few '## ' headings] }
   ```
   Now derive probes: the five **spine** lenses always run; scan the plan for features and add **bespoke probes** from the catalog in `references/lenses.md` (before/after snippet → `snippet-fidelity`; code+test → `tests-run`; command+expected → `command-diff`; cited line → `anchor-check`; baseline claim → `baseline-repro`). Preview the attack surface (skip under `--fast`).
```

- [ ] **Step 3: Pass the fingerprint + run against a clean checkout in Step 3**

Replace Step 3:

```
3. **Run the Workflow.** Copy `assets/workflow-scaffold.js` to a scratch path (e.g. `.claude/red-team/<run>.js`), add your bespoke probes (edit the array or pass `args.probes`), and run `Workflow({ scriptPath, args: { planFile, repo, sourceSpec, probes } })`. Execution probes run in throwaway sandboxes; analysis probes are read-only; each fail is adversarially confirmed before it counts.
```

with:

```
3. **Run the Workflow.** Copy `assets/workflow-scaffold.js` to a scratch path (e.g. `.claude/red-team/<run>.js`), add your bespoke probes (edit the array or pass `args.probes`), and run `Workflow({ scriptPath, args: { planFile, repo, sourceSpec, probes, fingerprint } })` — **all paths absolute** and `fingerprint` from the pre-flight (the scaffold refuses to run without it). When `repo` ≠ cwd, point `repo` at a **clean git worktree/checkout of the target** (`git -C <target> worktree add <tmp>`), so even a probe "reading around" lands in the right project. The scaffold prepends a SCOPE-LOCK preamble to every probe + confirm, requires each probe to attest what it read (`read_anchor`), retries a dropped probe once, and returns dropped probes as markers (never silently filtered). Execution probes run in throwaway sandboxes; analysis probes are read-only; each fail is adversarially confirmed before it counts.
```

- [ ] **Step 4: Pipe the new shape + handle INCOMPLETE in Steps 4 and 6**

Replace Step 4:

```
4. **Gate.** Pipe the returned `probeResults` through `node ${CLAUDE_PLUGIN_ROOT}/skills/red-team/assets/red-team-gate.mjs --stdin` to get the verdict + classified blockers / needsDecision / minors.
```

with:

```
4. **Gate.** Pipe the **entire returned object** (`{ plan, repo, fingerprint, expected, probeResults }`) through `node ${CLAUDE_PLUGIN_ROOT}/skills/red-team/assets/red-team-gate.mjs --stdin`. The gate validates each probe's `read_anchor` against the fingerprint, **discards off-target findings**, and returns the verdict + classified blockers / needsDecision / minors + a `summary` with `expected` vs `onTarget` and the `offTarget`/`dropped` probe names. A verdict of **`INCOMPLETE`** means coverage is not whole (an off-target, dropped, or never-ran probe) — it is **never** `CLEARED`.
```

In Step 6 (`**Emit the report**`), append to the end of the sentence (before the final period):

```
; an `INCOMPLETE` verdict is reported as its own line with the `offTarget`/`dropped` probes that must be re-run
```

- [ ] **Step 5: Add the INCOMPLETE re-run loop + the attestation invariant**

In Step 5, insert this sentence at the **start** of Step 5's body (right after `**Grill → patch → re-verify (bounded loop, ≤ 2 rounds per blocker).**`):

```
If the verdict is `INCOMPLETE`, first **re-run only the off-target/dropped probes** (same bounded ≤ 2 rounds) until coverage is whole; a persistent `INCOMPLETE` is surfaced to the user as the terminal verdict — never downgraded to a pass.
```

In the `## Invariants (never violate)` list, add:

```
- **No verdict other than `INCOMPLETE` may be reported on incomplete coverage.** Every probe must attest (`read_anchor`) that it read the fingerprinted plan, and every expected probe must run; an off-target or dropped probe forces `INCOMPLETE` and a re-run. Prevention (scope-lock) is never trusted alone — the gate's anchor check is the authority.
```

- [ ] **Step 6: Verify the references resolve**

Run: `grep -n "fingerprint\|read_anchor\|INCOMPLETE" skills/red-team/SKILL.md`
Expected: matches in the pre-flight (Step 2), the run (Step 3), the gate (Step 4), the re-run loop (Step 5), and the invariant — no orphaned term.

- [ ] **Step 7: Commit**

```bash
git add skills/red-team/SKILL.md
git commit -m "docs(red-team): runbook — Lead pre-flight fingerprint, foreign-cwd, INCOMPLETE (L5)"
```

---

### Task 7: lenses.md — document read_anchor, scope-lock, INCOMPLETE, fingerprint

**Files:**
- Modify: `skills/red-team/references/lenses.md` (Schemas + Severity/gate sections)

- [ ] **Step 1: Document `read_anchor` + the fingerprint in the Schemas section**

In `skills/red-team/references/lenses.md`, replace the Schemas intro line:

```
`FINDINGS` (per probe) and `CONFIRM` (per adversarial-confirm) are defined in the scaffold. Shape of a finding:
```

with:

```
`FINDINGS` (per probe) and `CONFIRM` (per adversarial-confirm) are defined in the scaffold. `FINDINGS` has a **required** `read_anchor: { resolved_path, plan_title }` — what the probe ACTUALLY read; the gate validates it against the run's **fingerprint** (`{ absPath, titleLine, tokens }`, computed by the Lead from the absolute `planFile` and passed in `args.fingerprint`). A probe whose `read_anchor` does not match the fingerprint is **off-target**: its findings are discarded and it counts as a coverage failure. Shape of a finding:
```

- [ ] **Step 2: Add the scope-lock + INCOMPLETE subsection before `## Schemas`**

Insert before the `## Schemas` heading:

```markdown
## Scope-lock, attestation & coverage (foreign-cwd defense)
`/red-team` is routinely launched from project X's session to verify project Y's plan (`--repo` ≠ cwd). A probe agent's ambient cwd + CLAUDE.md + memory **overpower** explicit path args, so prevention alone is insufficient (drift survived absolute paths in the 2026-06-19 incident). The hardening is defense-in-depth:
- **Scope-lock preamble** — the scaffold prepends a hard preamble to **every** probe (spine *and* bespoke) and confirm: ignore the session cwd, the only subject is the fingerprinted plan + `repo`, executed probes work in a throwaway *copy* of `repo`, analyzed probes restrict reads to `repo`, and STOP if the opened plan's title differs. **Bespoke probe authors:** you get this for free, but still write your gist to name the absolute `repo`/`planFile`.
- **Anchor attestation** — every probe must report `read_anchor` (what it read); the gate discards off-target results. This is the layer that catches drift even when the preamble fails.
- **`INCOMPLETE` verdict** — the gate returns `CLEARED | CLEARED-WITH-NOTES | BLOCKED | INCOMPLETE`. `INCOMPLETE` whenever a probe was off-target, dropped, or never ran; the gate **never** returns `CLEARED` on incomplete coverage. The Lead re-runs the off-target/dropped probes before any other verdict can settle.
- *(Optional, deferred)* a deterministic execution harness for `executed` probes — see the follow-up plan; it removes agent judgment from mechanical pass/fail.

```

- [ ] **Step 3: Add INCOMPLETE to the Verdict line**

In the `## Severity & gate` section, replace:

```
- **Verdict:** `CLEARED` (no blockers/holes/minors) · `CLEARED-WITH-NOTES` (minors only) · `BLOCKED` (open blocker/hole).
```

with:

```
- **Verdict:** `CLEARED` (no blockers/holes/minors) · `CLEARED-WITH-NOTES` (minors only) · `BLOCKED` (open blocker/hole) · `INCOMPLETE` (coverage gap — an off-target, dropped, or never-ran probe; re-run before any other verdict).
```

- [ ] **Step 4: Verify**

Run: `grep -n "read_anchor\|INCOMPLETE\|fingerprint\|Scope-lock" skills/red-team/references/lenses.md`
Expected: matches in the Schemas intro, the new subsection, and the Verdict line.

- [ ] **Step 5: Commit**

```bash
git add skills/red-team/references/lenses.md
git commit -m "docs(red-team): document read_anchor, scope-lock, INCOMPLETE, fingerprint"
```

---

### Task 8: Version bump to v0.4.2

**Files:**
- Modify: `.claude-plugin/plugin.json` (`version`)
- Modify: `README.md` (`## Status`)

> **Sequencing:** the spec targets v0.4.2 *after* the pending v0.4.1 wrap-up. `plugin.json` is currently `0.4.0` (v0.4.1 is planned but unimplemented). If v0.4.1 lands first, this task bumps `0.4.1 → 0.4.2`; if the hardening lands first, it bumps `0.4.0 → 0.4.2`. Either way the target is **`0.4.2`**; the README Status names both changes so no release note is lost.

- [ ] **Step 1: Bump the plugin version**

In `.claude-plugin/plugin.json`, change the `version` line to:

```json
  "version": "0.4.2",
```

- [ ] **Step 2: Update README Status**

In `README.md` under `## Status`, replace the version paragraph with:

```
v0.4.2 — early. Hardens `/red-team` against verifying the **wrong** plan or silently passing on partial coverage: a Lead-computed plan **fingerprint** + a required per-probe **`read_anchor`** attestation lets the gate discard off-target probes, and a fail-closed **`INCOMPLETE`** verdict (no silent `filter(Boolean)`, dropped probes retried once then surfaced) means a mis-targeted or dropped run can never read as `CLEARED`. (Includes the v0.4.1 land-path-agnostic wrap-up.) Completes the war-room → red-team → war trilogy.
```

- [ ] **Step 3: Verify the manifest parses and the version is consistent**

Run:

```bash
node -e "const v=require('./.claude-plugin/plugin.json').version; if(v!=='0.4.2'){throw new Error('version='+v)}; console.log('plugin.json OK', v)"
grep -c "v0.4.2" README.md
```

Expected: prints `plugin.json OK 0.4.2`; README reports ≥ 1 match.

- [ ] **Step 4: Commit**

```bash
git add .claude-plugin/plugin.json README.md
git commit -m "chore: bump to v0.4.2 (/red-team hardening)"
```

---

### Task 9: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Run the whole red-team + war test suite (explicit files — directory discovery is unreliable here)**

Run:

```bash
node --test \
  skills/red-team/assets/red-team-gate.test.mjs \
  skills/red-team/assets/workflow-scaffold.test.mjs \
  skills/war/assets/war-config.test.mjs
```

Expected: all tests pass, 0 fail — the new gate coverage/anchor tests, the new scaffold harness/scope-lock/retry tests, and no regression in `war-config.test.mjs`.

- [ ] **Step 2: Re-run the scaffold AsyncFunction syntax check**

Run:

```bash
node -e "const s=require('fs').readFileSync('skills/red-team/assets/workflow-scaffold.js','utf8').replace(/^export const meta/m,'const meta');new (Object.getPrototypeOf(async function(){}).constructor)('agent','parallel','pipeline','log','phase','args','budget',s);console.log('scaffold syntax OK')"
```

Expected: prints `scaffold syntax OK`.

- [ ] **Step 3: Incident-replay acceptance (spec §7) — off-target + dropped never read as CLEARED**

Run (a foreign-target run: one on-target probe, one drifted to the wrong plan, one dropped):

```bash
echo '{"plan":"/repo/docs/plans/p.md","repo":"/repo","expected":3,"fingerprint":{"absPath":"/repo/docs/plans/p.md","titleLine":"# My Plan"},"probeResults":[
  {"probe":"claims-vs-reality","technique":"analyzed","status":"pass","read_anchor":{"resolved_path":"/repo/docs/plans/p.md","plan_title":"# My Plan"},"findings":[]},
  {"probe":"executable-proof","technique":"executed","status":"pass","read_anchor":{"resolved_path":"/other/omniemr/plan.md","plan_title":"# OmniEMR Section B"},"findings":[{"severity":"Major","claim":"x","reality":"y"}]},
  {"probe":"dependency-feasibility","dropped":true}
]}' | node skills/red-team/assets/red-team-gate.mjs --stdin
```

Expected: `"verdict": "INCOMPLETE"`; `summary.offTarget` contains `"executable-proof"`; `summary.dropped` contains `"dependency-feasibility"`; the off-target Major does **not** appear in `blockers` (off-target findings discarded).

- [ ] **Step 4: Confirm acceptance criteria (spec §7), via the passing tests above**

- A probe whose `read_anchor.plan_title` ≠ the fingerprint is off-target, findings discarded, verdict `INCOMPLETE` (Task 2 tests + Step 3).
- A dropped probe forces `INCOMPLETE`; the gate never returns `CLEARED` when `ran < expected` (Task 2 tests + Step 3).
- Full on-target coverage, no findings → `CLEARED` (Task 2 test).
- The scope-lock preamble is present on every emitted probe prompt (Task 4 test).
- The scaffold passes the AsyncFunction syntax check; all gate + scaffold tests green (Steps 1–2).
- Version is `0.4.2` across plugin.json / README (Task 8 verify).

- [ ] **Step 5: Final commit (if any verification-only notes were added)**

No code changes expected here. If Steps 1–4 surfaced a defect, fix it under the owning task's TDD loop (new failing test first), not ad hoc.

---

## Out of scope (follow-up plan)
- **Deterministic execution harness for `executed` probes** (spec §3 "optional deeper layer", §8 the user leaned toward it). Split the `executed` probe so the agent only *extracts* runnable artifacts into a manifest and the scaffold deterministically *runs* them — removing agent judgment from mechanical pass/fail. Independently shippable; write as `docs/plans/2026-06-20-red-team-exec-harness.md` after this lands.
- **Inline early-abort in the scaffold** (spec §8 decision 4) — intentionally not built; the gate is the canonical validator.
