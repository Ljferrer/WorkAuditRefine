# Dispatched Gate-Run TMPDIR `.war-task`-free Pin Parity Implementation Plan (#184)

**Goal:** close one completeness/parity gap so the `.war-task`-free `TMPDIR` pin — ratified at
`agents/war-refiner.md:24` (the merge-task gate step) — is mirrored verbatim into the two **dispatched** gate-run
prompts emitted by `skills/war/assets/workflow-template.js` (merge-task and land-phase), and the gate
(`refinery-surface.test.sh` PRESENCE CHECK 4) is extended to assert the pin against `WORKFLOW_FILE` too, so the
two surfaces cannot re-drift silently. Prompt/doc + test only — **no production JS logic, control-flow, or schema**.
One TDD slice mirroring prior art `2026-06-26-guard-and-test-hermeticity.md` Task 3 (#95b), which introduced both
PRESENCE CHECK 4 and the `war-refiner.md:24` pin.

**Closes:**
- **#184** (Minor) — the two dispatched gate-run prompts in `workflow-template.js` re-state the gate-run mechanics
  without the `.war-task`-free `TMPDIR` pin that `war-refiner.md:24` carries, and PRESENCE CHECK 4 asserts the pin
  against `$REFINER_FILE` (`war-refiner.md`) only — never against `$WORKFLOW_FILE`. Root cause:
  `standing-instruction-vs-dispatched-prompt-coverage-split` (the standing `.md` and the dispatched template prompts
  are independent coverage surfaces; hardening one does NOT propagate to the other).

**Scope (v0.7.2 — dispatched-prompt parity + gate assertion; PROMPT/DOC + TEST only):** mirror an
already-ratified clause into two `agent(...)` prompt strings and extend one shell PRESENCE check. No production
logic, no control-flow, no schema, no new abstraction. Two files touched: `skills/war/assets/workflow-template.js`
(two disjoint prompt clauses) and `skills/war/assets/refinery-surface.test.sh` (PRESENCE CHECK 4, G2-only) — plus
the four canonical version slots. One-file-per-surface: the test surface (`refinery-surface.test.sh`) is G2-only;
the prompt surface (`workflow-template.js`) is **shared with G1** (see Dependency / ordering). **Severity is
genuinely Minor and partly cosmetic on the dev host:** BSD `mktemp` ignores `TMPDIR`, so the pin is a no-op on
macOS and only load-bearing on GNU-coreutils CI (memory `bsd-mktemp-ignores-tmpdir-gnu-only`) — kept as Linux-CI
defense-in-depth and drift-guard parity; the plan does not overstate runtime impact.

> **Baseline-drift note (2026-06-27):** every cited line was re-anchored by NAMED CONSTRUCT confirmed at HEAD.
> Merge-task clause = the `Run the gate (${plan.gate}) after the rebase in the task worktree;` sentence inside the
> `merge:${r.task.id}` `agent(...)` block (`:309-318`). Land-phase clause = the
> `  2. Merge: ... Run the gate (${plan.gate}). On gate failure return gate_failed.` sentence inside the
> `land:phase-${ph.id}` `agent(...)` block (`:394-408`). PRESENCE CHECK 4 = the `grep -qF 'TMPDIR=' "$REFINER_FILE"`
> block (`:182-197`); `WORKFLOW_FILE` is defined at `:68`. **`grep -cF 'TMPDIR='` on `workflow-template.js` == 0 at
> HEAD** (true RED), == 1 on `war-refiner.md` (the single `:24` example). **G2 lands ON TOP of the landed G1 tip,
> which shifts these line numbers — every task re-anchors by named construct, NEVER by a literal line number.**

**Operator decisions (2026-06-27, grill-with-docs):**
The grill resolved six decision points; **all ROUTINE** (localized prompt/test edits mirroring already-ratified
wording — no module boundary, contract, mechanism, or cross-cutting-policy change). Nothing escalated.

- **DP1 (pin BOTH dispatched fragments, not just merge-task)** → **pin BOTH** (spec D2). The land merge runs in
  `_refinery` (no own `.war-task`), but it runs the SAME self-discovering `*.test.sh` gate whose discovered
  meta-tests can `mktemp` scratch dirs colliding with ANY ancestor `.war-task` (`worktreeRoot` is shared). One
  mirrored clause in two places; pinning both is what makes `count >= 2` strictly stronger than `count >= 1` (a
  one-fragment partial fix fails RED). The clause is inert where unneeded (BSD no-op). *Routine:* choosing which
  existing prompt fragments receive an already-ratified clause — no mechanism added (the pin mechanism already
  lives at `war-refiner.md:24`), no contract/boundary change.
- **DP2 (assertion token + `>= 2` vs `== 2`)** → **`[ "$(grep -cF 'TMPDIR=' "$WORKFLOW_FILE")" -ge 2 ]`** (spec
  D4). `grep -F` (fixed-string), NOT BRE — under BRE the `$(` in `TMPDIR=$(cd / && mktemp -d)` is a regex anchor
  and would not match (the exact trap documented at `refinery-surface.test.sh:185-187` and guard-hermeticity Task 3
  Step 1). `-ge 2` not `-eq 2`: drift-resistant if a future edit adds a third `TMPDIR` mention, and a partial fix
  still fails. The canonical `war-refiner.md:24` wording contributes **exactly one** `TMPDIR=` literal per mirror
  (the prose `` `TMPDIR` `` in backticks has no `=`; only `TMPDIR=$(cd / && mktemp -d)` matches) — so two verbatim
  mirrors == exactly 2 hits. *Routine:* a test-assertion-token choice with an obvious correct default already
  proven in the sibling plan; `refinery-surface.test.sh` is an already-discovered `*.test.sh` runner (F12 lesson),
  no new harness, no wiring.
- **DP3 (re-anchor on line numbers vs named constructs)** → **NAMED CONSTRUCTS, never literal line numbers**
  (memory `plan-line-number-refs-stale-use-construct-locator`). G1's edit (c) amends the merge-task
  `populate gate_output` clause — the `+` fragment immediately AFTER G2's gate-run clause, inside the SAME
  `merge:${r.task.id}` `agent(...)` string-concat block — so after G1 lands the line numbers shift but the named
  sentence is stable. The land-phase site is in a DIFFERENT `agent(...)` call entirely, so no G1 contention there.
  *Routine:* tactical re-anchoring the spec already prescribes; the adjacency is a real merge-collision risk but the
  resolution (construct locator + verify no textual overlap on the landed G1 tip) is localized and well-precedented.
- **DP4 (does the clause regress any ABSENCE check?)** → **No regression — re-run to confirm, safe by
  construction.** The clause `TMPDIR=$(cd / && mktemp -d)` introduces no `from the Lead` token (ABSENCE CHECK 1
  untouched), no `checkout origin/` / `switch origin/` token (ABSENCE CHECKS 2/3 untouched), and no positive
  main-checkout instruction. *Routine:* a what-stays-green verification, not a design choice; lazy default (re-run
  the gate) is correct and already in the spec test-plan.
- **DP5 (war-refiner.md land-phase step + SKILL.md gate-contract — pull in or defer?)** → **DEFERRED-WITH-NOTE**
  (spec D5). `war-refiner.md`'s own land-phase step (the push-first CAS loop, `<run the gate>` placeholder) carries
  no `TMPDIR` pin — genuinely the same omission class — but it is OUT of #184's strict scope (#184 is the
  *dispatched-prompt* parity gap). Pulling it in is scope-creep on a Minor. Binding requirement: **the WAR run
  closing #184 MUST close it WITH a note that `war-refiner.md` land-phase + `SKILL.md` gate-contract remain
  unpinned** (do NOT imply full TMPDIR parity across all refiner surfaces) and track a follow-up. *Routine:*
  deferring an out-of-scope sub-item with a tracking note — fully reversible (a follow-up issue); pinning these
  later is additive text, not a new mechanism.
- **DP6 (where does v0.7.2 land in the four-slot bump, given G1 unlanded at HEAD?)** → **replace-in-place all four
  slots to `0.7.2`, but do NOT hardcode the from-version.** plugin.json / marketplace.json×2 / README `## Status`
  all read `0.7.0` at HEAD because G1 (v0.7.1) has not landed yet; the worker reads the **live** slot value at land
  time (expected `0.7.1` after G1) and bumps that → `0.7.2`. marketplace.json has TWO slots (`metadata.version` +
  `plugins[0].version`) — bump BOTH or the release is a silent no-op. No badge. *Routine:* release-slot bookkeeping
  with a known canonical recipe (memory `stacked-release-plan-version-literal-lags-operator-target`,
  `release-bump-slots-canonical-no-badge`).

**Architecture:** all three change sites are prose/string surfaces. The two prompt clauses live inside
`agent(...)` string-concat blocks in `workflow-template.js`: the merge-task `Run the gate (...)` sentence in the
`merge:${r.task.id}` block, and the land-phase `2. Merge: ... Run the gate (...)` sentence in the
`land:phase-${ph.id}` block. The gate assertion is the shell `grep -qF 'TMPDIR='` PRESENCE CHECK 4 in
`refinery-surface.test.sh`, which is itself an already-discovered `*.test.sh` runner — extending it needs **no new
wiring**, the self-discovering gate picks it up (F12 lesson). The test harness is the meta-grep over the live
surface files (`$WORKFLOW_FILE`, `$REFINER_FILE`) the suite already greps; there is no `*.test.mjs` change (no
behavioral `workflow-template.test.mjs` slice — the parity is asserted at the source-text level, exactly as #95b
asserted it for `war-refiner.md`).

**Dependency / ordering:** **G2 lands strictly AFTER G1** (`2026-06-27-gate-audit-execution-evidence-provenance-and-lens-doc.md`, v0.7.1).
- Both groups edit `skills/war/assets/workflow-template.js`. Per the G1 plan these are **adjacent fragments in one
  template literal — NOT disjoint regions** (the specs' "disjoint" wording was wrong): G1's edit (c) amends the
  merge-task `populate gate_output` clause (the `+` fragment at `:317`) — immediately after G2's merge-task gate-run
  clause (`:316`) inside the **same** `merge:${r.task.id}` concat block. G2's land-phase
  clause (`:400`) is in a **separate** `agent(...)` block (`land:phase-${ph.id}`) — no G1 contention there.
- **Serial landing G1 → G2 is mandatory** (shared file; G2's version builds on v0.7.1). If the WAR run attempts
  them concurrently the version slots and the `:316`/`:317` adjacency collide. The worker MUST re-anchor on the
  named sentence and verify **no textual overlap** when applying G2 on the landed G1 tip.
- `refinery-surface.test.sh` is G2-only — no contention.

**Tech stack:** ESM `workflow-template.js` (prose strings only — no logic touched); POSIX `sh`/bash 3.2 meta-test
`refinery-surface.test.sh`. Gate = the self-discovering multi-runner (`node --test 'skills/**/*.test.mjs'` + the
`find`-based `*.test.sh` loop). No `*.test.mjs` change.

**Source of truth:** [spec](../specs/2026-06-27-dispatched-gate-run-tmpdir-pin-parity.md). Prior art:
[guard-and-test-hermeticity](2026-06-26-guard-and-test-hermeticity.md) Task 3 (#95b) — reuse its exact PRESENCE
CHECK 4 assertion idiom (`grep -qF 'TMPDIR='`) and TDD red/green shape. Memory:
`standing-instruction-vs-dispatched-prompt-coverage-split` (root cause), `bsd-mktemp-ignores-tmpdir-gnu-only`
(severity cap), `plan-line-number-refs-stale-use-construct-locator` (DP3),
`stacked-release-plan-version-literal-lags-operator-target` + `release-bump-slots-canonical-no-badge` (DP6).

## Build order (for `/war`)

One TDD slice, then release. **Lands on G1's tip → v0.7.2.**
- **Phase 1 — dispatched-prompt TMPDIR parity:** Task 1 (#184 — mirror the clause into both dispatched prompts +
  extend PRESENCE CHECK 4).
- **Phase 2 — release:** Task 2 (v0.7.2).

---

## Phase 1 — Dispatched gate-run TMPDIR parity

### Task 1 — Mirror the `.war-task`-free `TMPDIR` pin into both dispatched gate-run prompts + extend PRESENCE CHECK 4 (#184)

**Files:**
- modify `skills/war/assets/refinery-surface.test.sh` — PRESENCE CHECK 4 (the `grep -qF 'TMPDIR=' "$REFINER_FILE"`
  block; add a sibling `$WORKFLOW_FILE` assertion). `$WORKFLOW_FILE` already defined (`:68`).
- modify `skills/war/assets/workflow-template.js` — the merge-task `Run the gate (${plan.gate}) after the rebase in
  the task worktree;` sentence (inside the `merge:${r.task.id}` `agent(...)` block) **and** the land-phase
  `2. Merge: ... Run the gate (${plan.gate}). On gate failure return gate_failed.` sentence (inside the
  `land:phase-${ph.id}` `agent(...)` block). **Re-anchor by these named sentences on the LANDED G1 TIP — the merge-task
  sentence sits immediately before G1's `populate gate_output` fragment; verify no textual overlap before editing.**

- [ ] **Step 1 — Write the failing test (source-text PRESENCE, mirroring #95b's idiom).**
  Extend PRESENCE CHECK 4 in `refinery-surface.test.sh` with a sibling assertion against `$WORKFLOW_FILE`:
  ```sh
  if [ "$(grep -cF 'TMPDIR=' "$WORKFLOW_FILE")" -ge 2 ]; then
    pass "PRESENCE CHECK 4 — both dispatched gate-run prompts in $WORKFLOW_FILE pin a .war-task-free TMPDIR= (merge-task + land-phase parity with war-refiner.md:24, #184)"
  else
    fail "PRESENCE CHECK 4 — $WORKFLOW_FILE has fewer than 2 'TMPDIR=' hits — mirror the .war-task-free TMPDIR pin into BOTH the merge-task and land-phase dispatched gate-run prompts (#184)"
  fi
  ```
  Use `grep -F` (fixed-string), NOT BRE — `$(` in `TMPDIR=$(cd / && mktemp -d)` is a regex anchor under BRE and
  would not match (trap documented at `:185-187`). Use `-ge 2`, NOT `-eq 2` (drift-resistant; a partial one-fragment
  fix still fails). Assert the literal token `TMPDIR=`, NOT the contiguous `war-task-free` substring (the backtick in
  `` `.war-task`-free `` splits it → false-RED).
- [ ] **Step 2 — Run gate → fail (three-point RED proof, not two).** `bash skills/war/assets/refinery-surface.test.sh`
  → RED. **Prove the assertion exercises the feature and cannot pass on pre-existing content:**
  1. **count == 0 at HEAD** (`grep -cF 'TMPDIR=' skills/war/assets/workflow-template.js` → `0`) → `>= 2` fails → RED.
  2. After mirroring **only** the merge-task fragment → **count == 1** → still `< 2` → still RED (this is the proof
     that `>= 2` is strictly stronger than `>= 1` and a partial fix fails).
  3. After mirroring **both** fragments → **count == 2** → GREEN.
  The invariant that makes this hold: the canonical `war-refiner.md:24` wording contributes **exactly one** `TMPDIR=`
  literal per mirror (verified: `grep -cF 'TMPDIR=' agents/war-refiner.md` == 1). A worker who phrases a clause with
  TWO `TMPDIR=` tokens in ONE fragment would make a one-fragment partial fix pass GREEN falsely — so each appended
  clause MUST carry exactly one `TMPDIR=` literal (the `TMPDIR=$(cd / && mktemp -d)` example), matching the verbatim
  mirror.
- [ ] **Step 3 — Implement (verbatim mirror of `war-refiner.md:24`, D1 — no re-author, no new abstraction).**
  Append to **each** of the two named sentences in `workflow-template.js` the clause (one `TMPDIR=` literal each):
  > `run the gate with TMPDIR set to a freshly-created, .war-task-free directory (created outside any worktree — e.g. TMPDIR=$(cd / && mktemp -d)), so any meta-test that materialises scratch dirs isolates from the worktree's .war-task marker; the gate's cwd stays the task worktree.`
  - **Merge-task site:** append it to the `Run the gate (${plan.gate}) after the rebase in the task worktree;`
    sentence in the `merge:${r.task.id}` `agent(...)` block. **On the landed G1 tip:** this sentence sits immediately
    before G1's amended `populate gate_output` fragment — re-anchor on the sentence text, confirm no textual overlap
    with the G1 fragment, then append within the same string fragment (keep the existing
    `on gate failure return gate_failed; on conflict return conflict; never force.` tail intact).
  - **Land-phase site:** mirror the same clause into the `2. Merge: ... Run the gate (${plan.gate}). On gate failure
    return gate_failed.` sentence in the `land:phase-${ph.id}` `agent(...)` block. Keep the existing detached-land
    tokens intact (`checkout --detach origin/`, `_refinery`, `merge --no-ff`, and the
    `Never merge or push from the Lead's main checkout` prohibition) — PRESENCE/ABSENCE checks key on them.
  Do NOT add any `from the Lead`, `checkout origin/`, or `switch origin/` (non-detached) token — keeps ABSENCE
  CHECKS 1/2/3 green (DP4). No production JS logic, control-flow, or schema change.
- [ ] **Step 4 — Run gate → pass.** `bash skills/war/assets/refinery-surface.test.sh` → PRESENCE CHECK 4 now passes
  (count == 2). Then run the **full** self-discovering gate (Test plan below) and confirm **zero ABSENCE-check
  regression**: ABSENCE CHECK 1 (`from the Lead` positive-instruction scan), ABSENCE CHECK 2 (`checkout origin/`
  without `--detach`), ABSENCE CHECK 3 (`switch origin/` without `--detach`), and the existing PRESENCE checks 1-3
  + the `$REFINER_FILE` half of PRESENCE CHECK 4 all stay green. No `*.test.mjs` behavior changed.
- [ ] **Step 5 — Commit** — `fix(war): pin a .war-task-free TMPDIR in both dispatched gate-run prompts + extend PRESENCE CHECK 4 to WORKFLOW_FILE (#184)`
- **Closes:** advances #184; the WAR run MUST close #184 **WITH the deferred-with-note** (DP5): `war-refiner.md`'s
  own land-phase step + `SKILL.md` gate-contract prose remain unpinned (same omission class, out of strict scope);
  do NOT imply full TMPDIR parity across all refiner surfaces; track as a follow-up.

---

## Phase 2 — Release

### Task 2 — Version bump v0.7.2 + full self-discovering gate green

**Files:** `.claude-plugin/plugin.json` (`version`), `.claude-plugin/marketplace.json` (`metadata.version` AND
`plugins[0].version` — both; stale second slot = silent no-op release), `README.md` `## Status` (REPLACE-in-place).

- [ ] **Step 1 — Bump all four slots to `0.7.2`.** **Do NOT hardcode the from-version** (memory
  `stacked-release-plan-version-literal-lags-operator-target`): G1 is unlanded at HEAD so every slot reads `0.7.0`
  now; read the **live** slot value at land time (expected `0.7.1` after G1 lands) and replace it with `0.7.2`.
  README `## Status` is replace-in-place (the slot currently holds the 0.7.0 manifest paragraph; G1 replaces it with
  a 0.7.1 paragraph; G2 replaces THAT with a 0.7.2 dispatched-gate-run-TMPDIR-parity paragraph, lineage
  "Builds on v0.7.1"). No badge (memory `release-bump-slots-canonical-no-badge`).
- [ ] **Step 2 — Run the full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.7.2 — dispatched gate-run TMPDIR .war-task-free pin parity (#184)`

---

## Test plan

**Gate** = the self-discovering multi-runner (quote the node glob; discover bash suites). Run at every Step 2/4;
final green required:
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

- **Task 1 — `skills/war/assets/refinery-surface.test.sh`:** PRESENCE CHECK 4's new sibling assertion
  (`grep -cF 'TMPDIR=' "$WORKFLOW_FILE" >= 2`) is RED at HEAD (count 0), RED after only the merge-task mirror
  (count 1), GREEN after both mirrors (count 2). The existing `$REFINER_FILE` half stays green. ABSENCE CHECKS 1/2/3
  and PRESENCE CHECKS 1-3 stay green (the appended clause carries no forbidden token).
- **Regression guard:** the whole meta-suite + every `*.test.mjs` stays green; no production JS logic / control-flow
  / schema change (the edit is prose inside two `agent(...)` strings).

Assert on the literal token `TMPDIR=` (D4); do NOT assert the contiguous `war-task-free` substring. Use `grep -F`
(fixed-string), never BRE (`$(` anchor trap).

## Coverage

| Issue | Coverage |
|---|---|
| #184 | full at the dispatched-prompt surface (both merge-task + land-phase gate-run prompts pin a `.war-task`-free `TMPDIR`; PRESENCE CHECK 4 extended to `WORKFLOW_FILE` with `count >= 2`). **Deferred-with-note** (DP5): `war-refiner.md` land-phase step + `SKILL.md` gate-contract prose remain unpinned (same omission class, out of strict scope) — close #184 WITH that note + a follow-up; do NOT imply full TMPDIR parity across all refiner surfaces. |

## Notes / conscious deviations (ratify in `/red-team`)

- **`>= 2` not `== 2`** — drift-resistant (a future third `TMPDIR` mention won't false-RED) and a one-fragment
  partial fix still fails. The exactly-one-`TMPDIR=`-per-fragment invariant (verbatim `war-refiner.md:24` mirror)
  is what makes `count == 2` the green target.
- **`grep -F` fixed-string, not BRE** — the `$(` in `TMPDIR=$(cd / && mktemp -d)` is a regex anchor under BRE and
  would silently never match (documented trap, `refinery-surface.test.sh:185-187` + guard-hermeticity Task 3).
- **Severity is Minor / partly cosmetic on macOS** — BSD `mktemp` ignores `TMPDIR`, so the pin is a no-op on the dev
  host and only load-bearing on GNU-coreutils CI (memory `bsd-mktemp-ignores-tmpdir-gnu-only`). Kept as Linux-CI
  defense-in-depth and drift-guard parity; this plan does not overstate runtime impact.
- **No behavioral `workflow-template.test.mjs` slice** — the parity is a source-text PRESENCE property (exactly as
  #95b asserted it for `war-refiner.md`); a `new AsyncFunction(...)` sandbox run would not observe a prose-only
  change. The grep-over-live-surface assertion in `refinery-surface.test.sh` is the right and only harness.

## Glossary (for CONTEXT.md, one line each)

- **dispatched prompt vs standing `.md`** — a refiner's STANDING instruction file (`war-refiner.md`, read on every
  spawn) and the DISPATCHED gate-run prompts emitted by `workflow-template.js` (the per-task `agent(...)` strings)
  are independent coverage surfaces; hardening one does NOT propagate to the other (memory
  `standing-instruction-vs-dispatched-prompt-coverage-split`).
- **`.war-task`-free `TMPDIR`** — written with a backtick splitting `.war-task` from `-free`, so the contiguous
  substring `war-task-free` never appears literally; the asserted token is `TMPDIR=` (not the prose phrase).

## Open decisions — RESOLVED (grill-with-docs, 2026-06-27)

All six DP1-DP6 are **ROUTINE** (see Operator decisions). Nothing escalated — no module boundary, contract,
mechanism, or cross-cutting-policy change. The TMPDIR-pin mechanism already exists (`war-refiner.md:24`); this plan
only mirrors its ratified wording into two dispatched prompts and extends one gate assertion. No ADR candidate.
