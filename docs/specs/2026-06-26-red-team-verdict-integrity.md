# Red-Team Verdict Integrity Implementation Plan (#49 · #50 · #85)

**Goal:** make `/red-team` reach a **CLEARED** verdict on a genuinely clean plan and survive the documented
launch path. Today `/red-team` is broken on the happy path by two independent, compounding bugs in
`skills/red-team/assets`: (1) the verification Workflow scaffold destructures `args` as a parsed object, but the
Workflow tool can deliver `args` as a **JSON string**, so the fingerprint guard throws before any probe runs
(launch failure); and (2) probe agents file **confirmations** ("the claim checks out") as `Critical`/`Major`
findings and the gate's `classify()` counts every `Critical`/`Major` finding as a blocker **without consulting the
parent probe's `status`** — so a clean run is reported as **BLOCKED** with dozens of false positives. A live
9-probe run against an actually-clean plan produced ~40 false-positive blockers, making the automated CLEARED
verdict effectively unreachable.

This is the **#85 umbrella fix** — a single coherent "verdict integrity" bundle that lands #49 and #50 together.
This plan **consolidates the already-written #85 solution/decision doc** (TDD commit cadence, decision record,
back-compat notes, out-of-scope boundaries) rather than re-deriving it.

**Closes:** #49 (JSON-string `args` launch failure), #50 (false BLOCKED from confirmation findings), #85 (umbrella).

**Scope (patch — `/red-team` behavior fix, no new public surface):**

- **#49 (MAJOR)** — normalize `args` before destructuring in `workflow-scaffold.js`: parse-if-string with a
  `try/catch`, leaving the unanchored-fingerprint guard message intact.
- **#50 (MAJOR) — defense-in-depth, three parts:**
  - *Probe side (root cause):* reword the `runProbe` instruction and the `FINDINGS` schema so a **finding means a
    DEFECT only**; a clean probe returns `status:'pass'` with `findings:[]`.
  - *Gate side (threading):* thread each finding's **parent probe `status`** through `allFindings()` in
    `red-team-gate.mjs`.
  - *Gate side (filtering):* `classify()` counts a `Critical`/`Major` finding as a **blocker only when the parent
    probe `status !== 'pass'`** (absent/unknown still blocks, for back-compat), while **always** honoring
    `needsDecision:true` regardless of status. The coverage-driven `INCOMPLETE` path is untouched.
- **Version** — patch bump `0.6.5 → 0.6.6` across the three versions-of-truth files (four slots).

**Why both halves ship as one run:** #49 and #50 share `workflow-scaffold.js` and the same skill surface; the
real-world failure is the *combination* (the documented launch path fails by default, and even when worked around
the CLEARED verdict is unreachable). One base branch avoids cross-task file conflicts on the shared scaffold.

**Architecture:** the verification Workflow scaffold (`workflow-scaffold.js`) runs the probes and emits
`probeResults`; the pure gate (`red-team-gate.mjs`) classifies findings and computes the verdict. The fix touches
the **scaffold** (args normalization + probe-side contract wording) and the **gate** (`allFindings` threading +
`classify` filtering). No change to the `INCOMPLETE` coverage layer, `isOnTarget`, `classifyCoverage`, `dedupe`,
or `verdict`'s coverage handling.

**Tech stack:** ESM Workflow scaffold + pure gate module, both with `node --test` over `*.test.mjs`. No bash hook
surface is touched by this plan.

**Gate (for `/war`):** the full self-discovering multi-runner (the node glob MUST be quoted — unquoted it
under-covers on bash 3.2):

```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

The two `*.test.mjs` suites changed here are `skills/red-team/assets/red-team-gate.test.mjs` and
`skills/red-team/assets/workflow-scaffold.test.mjs`; the `*.test.sh` runners are unaffected but must still pass.

**Source of truth / memory:** issue #85 body (full solution spec); inspection reports for #49/#50/#85.
Relevant memory: `redteam-claims-vs-reality-misfires-on-impl-plans`,
`red-team-env-gap-warn-is-agent-directive-not-code-enforced`.

---

## Problem statement (verified root causes + current anchors)

### #49 — Launch failure: `args` delivered as a JSON string

- **Root cause:** `workflow-scaffold.js:36` destructures the `args` global as if it is already a parsed object:
  `const { planFile, repo, sourceSpec = 'none', probes = [], fingerprint, provision = [] } = args`. The Workflow
  tool runtime can deliver `args` as a **JSON-encoded string**. When `args` is a string, every destructured field
  is `undefined`, so the fingerprint guard at **`workflow-scaffold.js:42`** (`if (!fingerprint ||
  !fingerprint.titleLine)`) throws `"…args.fingerprint.titleLine is required … refusing to run unanchored."`
  before any probe runs.
- **Evidence:** `skills/red-team/assets/workflow-scaffold.js:36` (direct destructuring, no `typeof`/parse) and
  `:42` (guard throws on the resulting `undefined`). No stringified-`args` test exists in
  `workflow-scaffold.test.mjs` today.

### #50 — False BLOCKED: confirmations filed and counted as blockers

Two independent compounding bugs:

- **Probe side (root cause):** `runProbe`'s instruction at **`workflow-scaffold.js:103`** says `"Prove any failure
  with reproduced evidence; never assert"` and `"Set needsDecision:true on … ambiguities"`, but never tells the
  agent to **omit a claim that checks out** or to return `findings:[]` on a clean pass. The `FINDINGS` schema at
  **`workflow-scaffold.js:19-28`** documents the `findings` item properties but has **no description clarifying
  that a finding means a defect** (not a confirmation). So agents file passing confirmations as
  `Critical`/`Major` findings.
- **Gate side (threading):** `allFindings(results)` at **`red-team-gate.mjs:9-12`** maps findings to
  `{ probe: r.probe, ...f }` — it threads the probe **name** but **not the probe's `status`** field onto each
  finding.
- **Gate side (filtering):** `classify(findings)` at **`red-team-gate.mjs:78-85`** filters blockers by **severity
  only**: `fs.filter(f => BLOCKER_SEVERITIES.includes(f.severity))`. It never consults the parent probe's
  `status`, so a `Critical` confirmation from a `status:'pass'` probe is indistinguishable from a real defect and
  is counted as a blocker.
- **Combined effect:** a clean 9-probe run yields ~40 false-positive blockers; the automated CLEARED verdict is
  unreachable on a sound plan.

### #85 — Umbrella

`#85` is the umbrella issue bundling #49 and #50 as one "verdict integrity" fix with a TDD commit cadence (failing
test → implementation, paired). Its sub-items map 1:1 to the tasks below; it adds the **patch version bump** and
the **docs sync** (SKILL.md + scaffold header) as explicit deliverables.

---

## Design / approach (chosen fix per item)

### A. #49 — parse-if-string normalization (scaffold launch)

Replace the direct destructure at `workflow-scaffold.js:36` with a normalize-if-string pass **before**
destructuring:

```js
let A
try { A = typeof args === 'string' ? JSON.parse(args) : (args ?? {}) }
catch { A = {} }
const { planFile, repo, sourceSpec = 'none', probes = [], fingerprint, provision = [] } = A
```

- **Rationale:** the destructure must operate on a parsed object regardless of whether the runtime hands us an
  object or a JSON string. `args ?? {}` handles `null`/`undefined`.
- **Guard intact:** the `try/catch` falling to `{}` is deliberate — on **malformed** JSON, `fingerprint` stays
  `undefined`, so the existing line `:42` guard still fires its *"refusing to run unanchored"* message rather than
  surfacing a raw `SyntaxError`. The guard message is **not changed**; it remains the single failure mode for "no
  usable fingerprint."
- **Rejected alternative:** parsing inside the guard, or pre-parsing `fingerprint` only — rejected because every
  field (`planFile`, `repo`, `probes`, `provision`) is equally affected; normalize the whole object once.

### B. #50 probe-side — tighten the FINDINGS contract (root cause)

Reword the `runProbe` instruction (`workflow-scaffold.js:103`) and add a clarifying description to the `FINDINGS`
`findings` array (`workflow-scaffold.js:19-28`) so a finding is a **DEFECT only**:

- Instruction adds (in substance): *"Only record a finding for an actual problem — a false claim, a gap, or an
  ambiguity (→ `needsDecision`). If a claim checks out, do NOT record it. A fully-clean probe returns
  `status:'pass'` with `findings:[]`."*
- Schema: add a `description` on the `findings` array (or its items) stating that an item is **a defect, not a
  confirmation**.
- **Rationale:** this is the root-cause fix — it stops confirmations from being filed at all. It is paired with
  the gate-side backstop (below) for defense-in-depth so that even a non-compliant agent cannot produce a false
  BLOCKED.

### C. #50 gate-side threading — `allFindings` carries parent `status`

In `allFindings()` (`red-team-gate.mjs:9-12`), tag each finding with its parent probe's `status`:

```js
r && Array.isArray(r.findings)
  ? r.findings.map(f => ({ probe: r.probe, probeStatus: r.status, ...f }))
  : []
```

- **Naming:** thread it as a distinct field (e.g. `probeStatus`) so it cannot collide with any finding-level
  `status` and so `classify()` can read it unambiguously. The `...f` spread stays **after** the threaded fields so
  a finding's own keys never silently override the probe identity/status.
- **Rationale:** `classify()` operates on the flattened finding list and otherwise has no access to the parent
  probe; threading is the minimal seam.

### D. #50 gate-side filtering — status-aware `classify()`

In `classify()` (`red-team-gate.mjs:78-85`), a `Critical`/`Major` finding is a blocker **only when its parent
probe `status !== 'pass'`**; `needsDecision:true` always blocks:

```js
blockers: fs.filter(f => BLOCKER_SEVERITIES.includes(f.severity) && f.probeStatus !== 'pass'),
needsDecision: fs.filter(f => f.needsDecision === true),
minors: fs.filter(f => f.severity === 'Minor' && f.needsDecision !== true),
```

- **Back-compat:** `f.probeStatus !== 'pass'` keeps blocking when the field is **absent or unknown** (`undefined
  !== 'pass'` is `true`). This preserves every existing test that passes bare findings (e.g. `verdict([F('Major')])
  → BLOCKED`) and means only an *explicitly* `status:'pass'` probe's Critical/Major findings are demoted.
- **`needsDecision` is status-independent:** an ambiguity that only the user can settle must surface even from a
  `pass` probe; the `needsDecision` bucket does **not** gate on `probeStatus`. `verdict()` already returns BLOCKED
  when `needsDecision.length`, so this is preserved automatically.
- **Coverage untouched:** `classifyCoverage`/`isIncomplete`/`isOnTarget` and the `INCOMPLETE` path are not changed
  — off-target/dropped/never-ran still force `INCOMPLETE`.
- **Rejected alternative (defense-in-depth note):** fixing only the probe-side wording (B) without the gate-side
  backstop (C/D) — rejected because a single non-compliant agent would still produce a false BLOCKED. Fixing only
  the gate-side without the probe wording — rejected because confirmations would still bloat reports and waste
  the adversarial-confirm stage. Both ship.

### E. Docs

- `skills/red-team/SKILL.md` and `skills/red-team/references/lenses.md` (severity rubric §46-50) state both
  contracts: **probe side** — a finding is a defect; a clean probe is `status:'pass'`/`findings:[]`; **gate side**
  — a Critical/Major finding from a `pass` probe is not a blocker, `needsDecision` always blocks.
- `workflow-scaffold.js` header comment (the block at `:7-17`) notes the args-normalization and the
  findings-are-defects contract.

---

## Decision record

1. **Scope boundary — patch, not redesign.** Only the four code seams (args normalize; probe wording; `allFindings`
   thread; `classify` filter) plus their tests, docs, and a patch version bump. No new public functions, no schema
   restructure beyond adding a `description`, no change to `verdict`, `classifyCoverage`, `isOnTarget`, `dedupe`,
   or the `INCOMPLETE` layer.
2. **Defense-in-depth is mandatory, not optional.** Both the probe-side root-cause fix (B) and the gate-side
   backstop (C+D) ship. Either alone leaves a path to a false BLOCKED or report bloat.
3. **Back-compat guarantee (gate).** A finding with **no** `probeStatus` (or any value other than the literal
   `'pass'`) still counts as a blocker. Existing tests that pass bare findings keep their current verdicts. Only an
   explicitly `status:'pass'` parent demotes its Critical/Major findings.
4. **Back-compat guarantee (scaffold).** When `args` is already an object, behavior is byte-for-byte identical
   (`args ?? {}`). A malformed JSON string degrades to the **existing** unanchored-fingerprint guard message, not
   a new error class.
5. **`needsDecision` is never demoted.** Regardless of parent `status`, a `needsDecision:true` finding blocks —
   the user must settle ambiguities even on otherwise-passing probes.
6. **Version cadence.** Patch bump `0.6.5 → 0.6.6` (current live version is **0.6.5**), across the three
   versions-of-truth files / four slots (`plugin.json` `version`; `marketplace.json` `metadata.version` **and**
   `plugins[0].version`; `README.md` `## Status`, replace-in-place).
7. **TDD cadence (strict).** Every task writes a failing test first, then the change, then green — mirroring #85's
   commit cadence.

---

## Phase → task decomposition

Single base branch (shared `workflow-scaffold.js`). Phases run in order; tasks within a phase are serial because
Phases 1 and 3 both touch the scaffold.

### Phase 1 — Launch fix (#49)

**Task 1.1 — parse-if-string normalization in `workflow-scaffold.js`**
- **Files:** modify `skills/red-team/assets/workflow-scaffold.js` (line 36 region); test
  `skills/red-team/assets/workflow-scaffold.test.mjs`.
- **Test first (RED):** add a behavioral case using the existing `runScaffold` harness that invokes the scaffold
  with `args` passed as a **JSON string** (`JSON.stringify(baseArgs())`). Assert it does **not** reject and that
  `out.fingerprint`/`out.repo`/`out.expected` are threaded correctly — mirroring the prior-art
  `'scaffold return threads the fingerprint + expected + repo to the gate'` test (`workflow-scaffold.test.mjs:97`).
  Note: `runScaffold`/`fakePipeline` pass `args` straight to the compiled body, so the test stringifies before the
  call. This fails today (string `args` → all fields `undefined` → fingerprint guard throws).
- **Then (GREEN):** implement the parse-if-string + `try/catch` normalization; destructure from the normalized
  object.
- **Preserve:** the existing `'scaffold aborts when no fingerprint is supplied'` test
  (`workflow-scaffold.test.mjs:106`) — a missing fingerprint (object form) and a malformed JSON string both still
  reject with `/fingerprint/i`. Add a malformed-string case asserting the **same** guard message fires.
- **Closes:** #49 sub-item (parse-if-string + try/catch, fingerprint guard intact); #85 sub-item 1.

### Phase 2 — Gate status-aware classification (#50 gate side)

**Task 2.1 — thread parent probe status in `allFindings()` + status-aware `classify()`**
- **Files:** modify `skills/red-team/assets/red-team-gate.mjs` (`allFindings` lines 9-12, `classify` lines 78-85);
  test `skills/red-team/assets/red-team-gate.test.mjs`.
- **Test first (RED):** add to `red-team-gate.test.mjs`:
  - **Threading:** `allFindings([{ probe:'x', status:'pass', findings:[F('Critical')] }])[0].probeStatus ===
    'pass'` (extends the prior-art `'allFindings flattens probe results and tags the probe'` test at
    `red-team-gate.test.mjs:45`).
  - **Critical from a passing probe is NOT a blocker:** build findings via `allFindings` over a
    `status:'pass'` probe carrying a `Critical`; assert `classify(...).blockers.length === 0` and, end-to-end,
    `verdict(...) === 'CLEARED'`.
  - **Critical from a failing probe IS a blocker:** same finding under a `status:'fail'` probe → `blockers.length
    === 1`, `verdict === 'BLOCKED'`.
  - **`needsDecision` always blocks:** a `needsDecision:true` finding from a `status:'pass'` probe →
    `classify(...).needsDecision.length === 1`, `verdict === 'BLOCKED'`.
  - **Back-compat:** preserve `verdict([F('Major')]) === 'BLOCKED'` and `classify([F('Critical'),F('Major'),…])`
    bucket counts (`red-team-gate.test.mjs:15,27`) — bare findings with no `probeStatus` still block.
  These fail today (severity-only filter blocks the passing-probe Critical).
- **Then (GREEN):** thread `probeStatus: r.status` in `allFindings`; add `&& f.probeStatus !== 'pass'` to the
  `blockers` filter in `classify`; leave `needsDecision`/`minors` untouched.
- **Closes:** #50 gate-side threading + filtering sub-items; #50 test sub-item (Critical-from-passing not a
  blocker, Critical-from-failing is, needsDecision always blocks); #85 sub-item 2.

### Phase 3 — Probe-side FINDINGS contract (#50 probe side)

**Task 3.1 — reword `runProbe` instruction + `FINDINGS` schema description**
- **Files:** modify `skills/red-team/assets/workflow-scaffold.js` (`FINDINGS` schema 19-28, `runProbe` instruction
  103); test `skills/red-team/assets/workflow-scaffold.test.mjs`.
- **Test first (RED):** add **structural** assertions (mirroring the existing structural tests at
  `workflow-scaffold.test.mjs:30-56` that scan `src` text):
  - The `runProbe` probe prompt text states that a claim that **checks out** is **not** recorded and a clean probe
    returns `status:'pass'` with empty `findings` (assert on a unique token such as `findings:[]` /
    `do NOT record` in the assembled probe prompt via the `runScaffold` harness, or on `src` for the literal
    instruction).
  - The `FINDINGS` schema carries a `description` clarifying a finding is a **defect, not a confirmation** (assert
    `probe.opts.schema.properties.findings.description` includes "defect" via the harness, mirroring the
    `'FINDINGS schema requires read_anchor'` test at `workflow-scaffold.test.mjs:146`).
  These fail today (no such wording / description).
- **Then (GREEN):** add the instruction sentence and the schema `description`.
- **Closes:** #50 probe-side sub-item + #50 structural-test sub-item; #85 sub-item 3.

### Phase 4 — Docs + version

**Task 4.1 — docs sync (SKILL.md, lenses.md, scaffold header)**
- **Files:** modify `skills/red-team/SKILL.md`, `skills/red-team/references/lenses.md` (§Severity & gate, lines
  46-50), `skills/red-team/assets/workflow-scaffold.js` header comment (lines 7-17).
- **Verify:** docs are prose; no test gate, but the changes must accurately describe both contracts (probe side: a
  finding is a defect, clean probe is `status:'pass'`/`findings:[]`; gate side: a Critical/Major from a `pass`
  probe is not a blocker, `needsDecision` always blocks). No false claim may be introduced (lint by re-reading).
- **Closes:** #50 docs sub-item; #85 docs sub-item.

**Task 4.2 — patch version bump 0.6.5 → 0.6.6**
- **Files:** `.claude-plugin/plugin.json` (`version`); `.claude-plugin/marketplace.json` (`metadata.version`
  **and** `plugins[0].version` — do not omit, stale = silent no-op release); `README.md` `## Status`
  (replace-in-place — the slot currently holds the 0.6.5 audit-fidelity paragraph; replace with a 0.6.6
  red-team-verdict-integrity paragraph, "Builds on v0.6.5" lineage ok).
- **Verify:** run the full self-discovering gate green (both `*.test.mjs` suites + all `*.test.sh` runners).
- **Closes:** #85 version sub-item.

---

## Test plan

**Gate command (run after every task; final green required):**

```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

**Suites and the specific assertions added/strengthened:**

- `skills/red-team/assets/workflow-scaffold.test.mjs`
  - **#49 (T1.1):** scaffold invoked with **stringified** `args` → does not reject; `out.fingerprint`/`repo`/
    `expected`/`plan` correct (prior-art: `:97`). Malformed-JSON-string `args` → rejects with `/fingerprint/i`,
    same guard message (prior-art: `:106`).
  - **#50 probe (T3.1):** structural assertion that the probe prompt instructs "do NOT record a claim that checks
    out" + clean probe is `status:'pass'`/`findings:[]`; `FINDINGS.properties.findings.description` includes
    "defect" (prior-art structural tests: `:30-56`, `:146`).
- `skills/red-team/assets/red-team-gate.test.mjs`
  - **#50 gate (T2.1):** `allFindings` threads `probeStatus` (prior-art: `:45`); `classify`/`verdict`:
    Critical-from-`pass` is NOT a blocker (CLEARED); Critical-from-`fail` IS a blocker (BLOCKED); `needsDecision`
    from a `pass` probe still BLOCKED; bare-finding back-compat `verdict([F('Major')]) === 'BLOCKED'` and bucket
    counts preserved (prior-art: `:15`, `:23`, `:27`).
- All `*.test.sh` runners (`hooks/*.test.sh`, `skills/war/assets/*.test.sh`) — unchanged, must stay green
  post-merge.

---

## Out of scope

- The deterministic execution harness for executed probes (lenses.md §"Optional, deferred") — not in this plan.
- Any change to `verdict`, `classifyCoverage`, `isOnTarget`, `dedupe`, or the `INCOMPLETE` coverage layer.
- The bash hook surface (`hooks/*`) and the auditor/refiner/worker agents — untouched.
- Re-architecting the `FINDINGS`/`CONFIRM` schemas beyond adding a description.

## Open questions

- Exact field name for the threaded parent status (`probeStatus` proposed) — must not collide with any
  finding-level `status` key; confirm no other gate consumer reads a `status` field off a flattened finding.
- Whether the probe-side `description` belongs on the `findings` **array** or its **items** object — pick whichever
  the structural test asserts; both are acceptable as long as the test anchors to it.
- Whether `status:'warn'` Critical/Major findings (e.g. an env-gap that an agent mis-tagged) should also be
  demoted; current design only demotes the literal `'pass'` (warn still blocks). Confirm this matches the desired
  provision env-gap behavior (provision failures are already directed to `warn` with `Minor` severity, so this is
  expected to be a no-op in practice).
