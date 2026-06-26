# Red-Team Verdict Integrity Implementation Plan (#49 · #50 · #85)

**Goal:** make `/red-team` survive its documented launch path and reach a **CLEARED** verdict on a genuinely clean
plan. Two independent, compounding bugs in `skills/red-team/assets` break the happy path today: (1) the verification
Workflow scaffold destructures `args` as a parsed object, but the Workflow tool can deliver `args` as a **JSON
string**, so the fingerprint guard throws before any probe runs (launch failure, #49); and (2) probe agents file
**confirmations** as `Critical`/`Major` findings and the gate's `classify()` counts every `Critical`/`Major` finding
as a blocker **without consulting the parent probe's `status`** — so a clean run reports **BLOCKED** with dozens of
false positives (#50). A live 9-probe run against a sound plan produced ~40 false-positive blockers, making the
automated CLEARED verdict effectively unreachable.

**Scope (v0.6.6 — `/red-team` behavior fix; PLAN 1 of the 5-plan [open-issue remediation stack](2026-06-26-open-issue-remediation-roadmap.md)):**
- **#49 (MAJOR)** — normalize `args` before destructuring in `workflow-scaffold.js` (parse-if-string with `try/catch`,
  unanchored-fingerprint guard message intact).
- **#50 (MAJOR), defense-in-depth (both halves ship):**
  - *Probe side (root cause):* reword the `runProbe` instruction + add a `FINDINGS.findings` description so a finding
    means a **DEFECT only**; a clean probe returns `status:'pass'` with `findings:[]`.
  - *Gate side (threading):* thread each finding's parent probe `status` through `allFindings()` as `probeStatus`.
  - *Gate side (filtering):* `classify()` counts a `Critical`/`Major` finding as a blocker **only when** the parent
    probe `probeStatus !== 'pass'`; `needsDecision:true` always blocks; the `INCOMPLETE` coverage path is untouched.
- **#85** is the umbrella that bundles #49+#50 with a TDD commit cadence — this plan **consolidates its
  already-written solution/decision doc** rather than re-deriving it.

**Operator decisions (2026-06-26, grill-with-docs):**
All three of the spec's open questions were resolved by reading the live gate/scaffold — none was architectural:
- **OQ1 — threaded field name → `probeStatus`** (verified collision-free). `red-team-gate.mjs` reads no `.status` off
  a flattened finding: `classify()` keys on `severity`/`needsDecision`, `dedupe()` on `planRef|severity|claim`. The
  `status` field lives only on the probe result (`r.status`, surfaced in `summarize` as `x.status`). Threading
  `probeStatus: r.status` with `...f` spread **after** the threaded keys cannot be overridden by a finding's own keys.
- **OQ2 — `description` on the `findings` ARRAY** (`FINDINGS.properties.findings.description`), matching the
  structural-test anchor (prior art: the `read_anchor`/schema structural assertions). The array currently has no
  `description`.
- **OQ3 — demote ONLY literal `status:'pass'`.** `warn`/`fail`/absent all still block (`probeStatus !== 'pass'` is
  `true` for them). Fail-safe: a `warn` probe could not fully verify, so its Critical/Major must still surface; and
  provision env-gaps are already directed to `warn` + `Minor`, so this is a practical no-op for that path.
- **#49 fix = parse-if-string normalize** (the spec's chosen seam), NOT "embed config into the scratch copy" (kept as
  a noted fallback only). The `args`-passing invocation stays the documented default.
- **Defense-in-depth is mandatory.** Probe-side wording removes the noise at the source; the gate-side `status`
  filter holds even if a single agent ignores the instruction. Either alone leaves a path to a false BLOCKED.

**Architecture:** the verification Workflow scaffold (`workflow-scaffold.js`) runs the probes and emits
`probeResults`; the pure gate (`red-team-gate.mjs`) classifies findings → verdict. The fix touches the **scaffold**
(args normalize + probe-side contract wording) and the **gate** (`allFindings` thread + `classify` filter). No change
to `verdict`, `classifyCoverage`, `isOnTarget`, `dedupe`, or the `INCOMPLETE` coverage layer.

**Dependency / ordering:** **first plan in the stack.** Isolated to `skills/red-team/assets/*` (+ its docs) — **no
file overlap with plans 2–5** except the four canonical version slots. Lands on the current **v0.6.5 → v0.6.6**. No
upstream dependency; ratify with `/red-team` before `/war`.

**Tech stack:** ESM Workflow scaffold + pure gate module, both with `node --test` over `*.test.mjs`. No bash hook
surface is touched by this plan.

**Gate (for `/war`):** the full self-discovering multi-runner (the F12 lesson — quote the node glob; unquoted it
under-covers on bash 3.2):
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```
The two `*.test.mjs` suites changed here are `skills/red-team/assets/red-team-gate.test.mjs` and
`skills/red-team/assets/workflow-scaffold.test.mjs`; the `*.test.sh` runners are unaffected but must stay green.

**Source of truth:** [spec](../specs/2026-06-26-red-team-verdict-integrity.md); issue #85 body (full solution).
Memory: `redteam-claims-vs-reality-misfires-on-impl-plans`, `red-team-env-gap-warn-is-agent-directive-not-code-enforced`.

## Build order (for `/war`)

- **Phase 1 — #49 launch fix:** T1.1 (parse-if-string normalize in the scaffold).
- **Phase 2 — #50 gate status-awareness:** T2.1 (`allFindings` threads `probeStatus`; `classify` status-filter).
- **Phase 3 — #50 probe FINDINGS contract:** T3.1 (reword `runProbe` + add schema description).
- **Phase 4 — docs + release:** T4.1 (docs sync) → T4.2 (version bump v0.6.6).

Tasks are serial within the run because **Phases 1 and 3 both edit `workflow-scaffold.js`** (single base branch
avoids cross-task conflicts on the shared scaffold).

---

## Phase 1 — Launch fix (#49)

### Task 1.1 — parse-if-string normalization in `workflow-scaffold.js`

**Files:** modify `skills/red-team/assets/workflow-scaffold.js` (the `const { … } = args` destructure, currently
:36); test `skills/red-team/assets/workflow-scaffold.test.mjs`.

- [ ] **Step 1 — Write failing test.** In `workflow-scaffold.test.mjs`, add a behavioral case using the existing
  `runScaffold`/`fakePipeline` harness that invokes the scaffold with `args` passed as a **JSON string**
  (`JSON.stringify(baseArgs())`). Assert the run does **not** reject and that `out.fingerprint`/`out.repo`/
  `out.expected` thread correctly — mirroring the prior-art `'scaffold return threads the fingerprint + expected +
  repo to the gate'` test. Add a second case: a **malformed** JSON string for `args` still rejects with
  `/fingerprint/i` (the guard fires unchanged).
- [ ] **Step 2 — Run gate → fail** (string `args` → all fields `undefined` → fingerprint guard throws).
- [ ] **Step 3 — Implement.** Replace the direct destructure with a normalize-if-string pass (find by construct — the
  `const { planFile, repo, … } = args` line):
  ```js
  let A
  try { A = typeof args === 'string' ? JSON.parse(args) : (args ?? {}) }
  catch { A = {} }
  const { planFile, repo, sourceSpec = 'none', probes = [], fingerprint, provision = [] } = A
  ```
  `args ?? {}` handles `null`/`undefined`; the `catch → {}` deliberately leaves `fingerprint` undefined on malformed
  JSON so the **existing** unanchored guard message (`:42-44`) is still the single failure mode (no raw `SyntaxError`).
- [ ] **Step 4 — Run gate → pass.** Confirm the prior-art `'scaffold aborts when no fingerprint is supplied'` test
  stays green (object-form missing fingerprint still rejects).
- [ ] **Step 5 — Commit** — `fix(red-team): normalize stringified args before destructuring in workflow-scaffold (#49)`
- **Closes:** #49; #85 sub-item 1.

---

## Phase 2 — Gate status-aware classification (#50 gate side)

### Task 2.1 — thread parent probe status in `allFindings()` + status-aware `classify()`

**Files:** modify `skills/red-team/assets/red-team-gate.mjs` (`allFindings` :9-12, `classify` :78-85); test
`skills/red-team/assets/red-team-gate.test.mjs`.

- [ ] **Step 1 — Write failing tests** in `red-team-gate.test.mjs`:
  - **Threading:** `allFindings([{ probe:'x', status:'pass', findings:[F('Critical')] }])[0].probeStatus === 'pass'`
    (extends the prior-art `'allFindings flattens probe results and tags the probe'` test).
  - **Critical from a passing probe is NOT a blocker:** findings built via `allFindings` over a `status:'pass'` probe
    carrying a `Critical` → `classify(...).blockers.length === 0`; end-to-end `verdict(...) === 'CLEARED'`.
  - **Critical from a failing probe IS a blocker:** same finding under `status:'fail'` → `blockers.length === 1`,
    `verdict === 'BLOCKED'`.
  - **`needsDecision` always blocks:** a `needsDecision:true` finding from a `status:'pass'` probe →
    `classify(...).needsDecision.length === 1`, `verdict === 'BLOCKED'`.
  - **Back-compat:** preserve `verdict([F('Major')]) === 'BLOCKED'` and the existing `classify` bucket-count test —
    bare findings with no `probeStatus` still block.
- [ ] **Step 2 — Run gate → fail** (severity-only filter blocks the passing-probe Critical today).
- [ ] **Step 3 — Implement.**
  - `allFindings`: thread the probe status — `r.findings.map(f => ({ probe: r.probe, probeStatus: r.status, ...f }))`
    (the `...f` spread stays last so a finding's keys never override `probe`/`probeStatus`).
  - `classify`: add `&& f.probeStatus !== 'pass'` to the `blockers` filter only; leave `needsDecision` and `minors`
    untouched. `undefined !== 'pass'` is `true`, so absent/`warn`/`fail` keep blocking (OQ3 + back-compat).
- [ ] **Step 4 — Run gate → pass.**
- [ ] **Step 5 — Commit** — `fix(red-team): gate counts a Critical/Major as a blocker only from a non-pass probe (#50)`
- **Closes:** #50 gate-side threading + filtering; #85 sub-item 2.

---

## Phase 3 — Probe-side FINDINGS contract (#50 probe side, root cause)

### Task 3.1 — reword `runProbe` instruction + add `FINDINGS.findings` description

**Files:** modify `skills/red-team/assets/workflow-scaffold.js` (`FINDINGS` schema :19-28, `runProbe` instruction
:102-103); test `skills/red-team/assets/workflow-scaffold.test.mjs`.

- [ ] **Step 1 — Write failing structural tests** (mirroring the existing `src`-scanning structural tests):
  - The assembled `runProbe` prompt instructs that a claim which **checks out** is **not** recorded and a clean probe
    returns `status:'pass'` with empty `findings` — assert on a unique token (e.g. `do NOT record` / `findings:[]`).
  - `FINDINGS.properties.findings.description` includes the word **"defect"** (assert via the harness'
    `probe.opts.schema.properties.findings.description`, mirroring the `'FINDINGS schema requires read_anchor'` test).
- [ ] **Step 2 — Run gate → fail** (no such wording / description today).
- [ ] **Step 3 — Implement.**
  - `runProbe` prompt: append (in substance) *"Only record a finding for an actual problem — a false claim, a gap,
    or an ambiguity (→ `needsDecision`). If a claim checks out, do NOT record it. A fully-clean probe returns
    `status:'pass'` with `findings:[]`."*
  - `FINDINGS.findings`: add `description: 'A DEFECT (false claim, gap, or needsDecision ambiguity) — NOT a
    confirmation. Omit claims that check out; a clean probe returns findings:[] with status:"pass".'`
- [ ] **Step 4 — Run gate → pass.**
- [ ] **Step 5 — Commit** — `fix(red-team): a FINDINGS finding means a defect, not a confirmation (#50 root cause)`
- **Closes:** #50 probe-side + structural-test sub-items; #85 sub-item 3.

---

## Phase 4 — Docs + release

### Task 4.1 — docs sync (SKILL.md, lenses.md, scaffold header)

**Files:** modify `skills/red-team/SKILL.md`, `skills/red-team/references/lenses.md` (Severity & gate, ~:46-50),
`skills/red-team/assets/workflow-scaffold.js` header comment (:7-17).

- [ ] **Step 1 — Implement (prose, no test gate).** State both contracts accurately: **probe side** — a finding is a
  defect; a clean probe is `status:'pass'`/`findings:[]`; **gate side** — a Critical/Major from a `pass` probe is not
  a blocker, `needsDecision` always blocks, `warn`/`fail` still block; **scaffold** — stringified `args` is normalized.
- [ ] **Step 2 — Verify** by re-reading: no false claim introduced.
- [ ] **Step 3 — Commit** — `docs(red-team): document args normalization + findings-are-defects + status-aware gate`
- **Closes:** #50 docs sub-item; #85 docs sub-item.

### Task 4.2 — version bump v0.6.5 → v0.6.6

**Files:** `.claude-plugin/plugin.json` (`version`); `.claude-plugin/marketplace.json` (`metadata.version` **and**
`plugins[0].version` — both; stale = silent no-op release); `README.md` `## Status` (REPLACE-in-place; the slot
holds the prior v0.6.5 audit-fidelity paragraph — replace with a v0.6.6 red-team-verdict-integrity paragraph,
"Builds on v0.6.5" lineage ok). README has no version *badge*.

- [ ] **Step 1 — Bump all four slots to `0.6.6`.** (Memory: `release-bump-slots-canonical-no-badge`,
  `release-status-is-replace-slot-not-empty-field`.) **Version is roadmap-assigned** — if a prior plan in the stack
  has already landed a higher patch, take the next free patch and update this line accordingly.
- [ ] **Step 2 — Run the full self-discovering gate → green** (both `*.test.mjs` suites + all `*.test.sh` runners).
- [ ] **Step 3 — Commit** — `chore(release): v0.6.6 — red-team verdict integrity (#49 #50 #85)`
- **Closes:** #85 version sub-item.

---

## Test plan

**Gate** = the full self-discovering multi-runner above; run after every task, final green required.

**Suites and the specific assertions added/strengthened:**
- `skills/red-team/assets/workflow-scaffold.test.mjs`
  - **#49 (T1.1):** stringified `args` → no reject, fields threaded; malformed-string `args` → rejects `/fingerprint/i`.
  - **#50 probe (T3.1):** structural — probe prompt says "do NOT record" a claim that checks out + clean probe is
    `status:'pass'`/`findings:[]`; `FINDINGS.properties.findings.description` includes "defect".
- `skills/red-team/assets/red-team-gate.test.mjs`
  - **#50 gate (T2.1):** `allFindings` threads `probeStatus`; Critical-from-`pass` is NOT a blocker (CLEARED);
    Critical-from-`fail` IS a blocker (BLOCKED); `needsDecision` from a `pass` probe still BLOCKED; bare-finding
    back-compat (`verdict([F('Major')]) === 'BLOCKED'`, bucket counts) preserved.
- All `*.test.sh` runners — unchanged, must stay green post-merge.

## Out of scope
- The deterministic execution harness for executed probes (lenses.md "Optional, deferred").
- Any change to `verdict`, `classifyCoverage`, `isOnTarget`, `dedupe`, or the `INCOMPLETE` coverage layer.
- The bash hook surface and the WAR auditor/refiner/worker agents — untouched.
- Re-architecting the `FINDINGS`/`CONFIRM` schemas beyond adding a `description`.

## Notes / conscious deviations (ratify in `/red-team`)
- The gate becomes partly **content-aware** of probe `status` (it already was, via coverage). No new public contract:
  `allFindings` gains an internal `probeStatus` tag; the documented JSON envelope for callers is unchanged.
- `warn` Critical/Major still blocks (only literal `'pass'` demotes) — intentional fail-safe (OQ3).

## Open decisions — RESOLVED (grill-with-docs, 2026-06-26)
1. **Threaded field name → `probeStatus`** (collision-free; verified against `red-team-gate.mjs`).
2. **`description` on the `findings` array** (test anchors to `properties.findings.description`).
3. **Only literal `status:'pass'` demotes** Critical/Major; `warn`/`fail`/absent still block.
4. **Version** is roadmap-assigned (v0.6.6 as plan 1); the Release task takes the next free patch if the stack order shifts.
