# Gate-audit finding routing — route the sweep's own findings, reconcile the D7 HARD clauses, defuse the truncated-log false HARD, pin the banner premise

Converted by `/war-machine` from [docs/specs/2026-08-06-gate-audit-finding-routing-design.md](../specs/2026-08-06-gate-audit-finding-routing-design.md)
(Part 1 is its decision digest; every spec assumption is carried into the ledger or retired with a stated
reason). Issues addressed: #1377, #1372, #1343, and — folded 2026-08-15 by operator direction
(campaign-era auditor-behavior findings from run `2026-08-12-handwritten-date-flagging`, squarely this
plan's `war-auditor.md`/`workflow-template.js` family) — #1410 and #1412. Issue → task mapping: #1377 → Task 1.1 item (a) (sweep-close
routing, both arms); #1372 → Task 1.1 items (b)/(c) + Task 1.2 (the resolveGate coupling note); #1343
finding 1 → Task 1.3, finding 2 → Task 1.1 item (b), finding 3 → Task 1.1 item (c) + Task 1.2, findings
4 and 6 → Task 1.1 item (g), finding 5 → Task 1.2 (producer pin) + Task 1.1 item (h) (consumer coupling);
#1410 fixes 1+2 → Task 2.1 (escalate_reason-required contract + the `request_changes`-by-construction
discriminator, both surfaces; fix 3 deferred — Non-goals); #1412 fix 3 → Task 2.1 (the standing
search-tooling sentence), fix 1 → Task 2.2 (the metacharacter denial diagnostics; fix 2 deferred —
Non-goals). `/war` files its own epic + task issues regardless (war-execution-must-file-issues); closing
the five source issues is Lead checkpoint work at phase close (war-checkpoint-must-close-task-issues) —
#1343's per-finding close conditions require each correcting commit to cite the issue (End state 13).

## Context — the gap / problem

One lens, one cluster of residuals: the `execution-evidence` gate-audit family — the phase-close sweep's
re-audit, the per-task and integrated-tip seat prompts, and the gate log those prompts read. Source spec:
`docs/specs/2026-08-06-gate-audit-finding-routing-design.md`. Snapshot base for every measured claim: the
repo tip at `6fff2ee` (2026-08-06); the session worktree's spec-batch and checkpoint commits are docs-only
and touch none of these surfaces. **This plan stacks directly on the committed sibling plan
`docs/plans/2026-08-06-done-when-floor-wiring.md` (plan 3)** (verified: the spec's § Open risks ordering
declaration + plan 3's committed Note 6, both read at conversion, 2026-08-06), which rewrites regions of
`skills/war/assets/workflow-template.js` and `skills/war/assets/workflow-template.test.mjs` — every
measured claim below in those two files is tagged measured-at-base + expected-post-predecessor, and the
construct-level collision census is Note 1.

1. **The phase-close sweep drops its own re-audit findings** (verified: issue #1377 (2026-08-06);
   confirmed live at `6fff2ee`). In `skills/war/assets/workflow-template.js`, the sweep's full-panel
   re-audit (`auditRound(polishTask, …)`, seats `pSeats`) pushes its findings only into `auditLog`
   (verdict `approve` / `polish-rejected`). On the merged arm (`sweepApproved && pmr.status === 'merged'`)
   only the pre-existing `phaseCloseQueue` is spliced into `aced`; on the discard arm
   (`polish-discarded`) and the skipped/held arms the demotion ladder drains only that queue. Findings
   the panel raises against the polish commit itself never pass through `dispositionOf` / `demote` /
   `minorsFiled` — and because Minor/absorb never blocks unanimous approval, they land unfixed and
   unfiled (the recorded instance dropped two Minor/absorb findings). The sweep is the phase's terminal
   fix mechanism: an absorb finding raised there has no later round to drain it. Mechanical detail
   (confirmed at `6fff2ee`): `pSeats` is block-scoped inside the `if (!sweepWhy)` re-audit block, out of
   scope at both terminal arms — the routing needs a hoisted capture. The sweep-close region is outside
   every region predecessor plan 3 edits (Note 1) — expected unchanged at the post-plan-3 base.
2. **Contradictory seat-prompt clause on the only live HARD path** (verified: issue #1372 (2026-08-06);
   verified: issue #1343 finding 2 (2026-08-06); confirmed live at `6fff2ee`). In the per-task gate-audit
   `agent()` prompt, `mappedTestsLine` (round-3 enumeration-conditional: absence is HARD only where the
   captured log ENUMERATES per-file test paths) coexists — three lines apart — with the unchanged older
   conjunctive clause "record a HARD gate-evidence finding ONLY when the mapped test is genuinely absent
   AT THE CONFIRMED INTEGRATION TIP and the captured artifact confirms it did not run". A
   present-but-unrun `.test.sh` satisfies the new rule and fails the old clause: contradictory
   instruction exactly where HARD can still fire. Direction is fail-open (under-trigger) — the
   mechanical trigger is effectively unreachable while both stand.
   `grep -c "genuinely absent AT THE CONFIRMED INTEGRATION TIP" skills/war/assets/workflow-template.js`
   = 1 at `6fff2ee` (expected unchanged post-plan-3 — plan 3 adds no such phrase). The rescope is
   single-surface: the integrated-tip seat prompt carries no twin, and `agents/war-auditor.md`'s only
   "genuinely absent" occurrence is the unrelated dangling-cross-slice-ref calibration rule (confirmed
   at `6fff2ee`).
3. **resolveGate early-abort log truncation can mint a false HARD** (verified: issue #1372 (2026-08-06);
   verified: issue #1343 finding 3 (2026-08-06); confirmed live at `6fff2ee`). `resolveGate` in
   `skills/war/assets/war-config.mjs` composes the bash gate half as a discovery for-loop with
   `bash "$f" || exit 1` — the first red suite aborts the whole loop, so on a baseline-proceed merge
   every alphabetically-later `.test.sh` never prints its `== gate(bash): <path> ==` header. The
   captured log then enumerates paths (the earlier headers) yet is incomplete: the
   enumeration-conditional's premise is satisfied and a later mapped bash path reads absent ⇒ HARD
   land-hold caused by the abort, not an unrun test. `debtLine` defuses only a gate-output FAILURE
   matching classified baseline debt, never an ABSENCE caused by the abort. The fail-fast composition is
   documented deliberate ("any non-zero exit aborts immediately") — the fix is evidence-interpretation
   side (A2).
4. **setup.md's `--afk` sanity-floor backstop claim is stale** (verified: issue #1343 finding 1
   (2026-08-06); confirmed live at `6fff2ee`). The § `--afk` sanity floor block in
   `skills/war/references/setup.md` still asserts the residual (an over-wide but file-matching pattern
   admitting a test the gate ignores) is "caught downstream" by the `execution-evidence` HARD pass — but
   that residual is by construction a non-`.test.sh` path, which after the narrowing falls on the
   non-enumerating half where the zero-hit grep is SOFT cannot-confirm: the named catch does not fire
   for the exact case the sentence backstops. The file header asserts the evicted blocks are
   byte-identical to their pre-eviction `skills/war/SKILL.md` text — an in-place correction must amend
   that caveat in the same commit (ADR 0042). **Pin-census correction to the spec** (survey-derived,
   conversion census at `6fff2ee`): the spec's claim "no `*.test.*` references `setup.md`" is false as
   stated — `skills/war/assets/skill-doc-contracts.test.mjs` (the D13 `node …*.sh` invocation-shape
   UNION sweep; a comment naming setup.md's `remove-publication-worktree` token),
   `skills/war/assets/war-config.test.mjs` (three enumerated OLD-absent UNION sweeps: the retired
   scope-hook-glob clause, `docs/learnings/*`, `_polish`), and `skills/_shared/doc-cli-consistency.test.mjs`
   (a corpus file list) all reference it. The spec's claim is true in substance: **none pins the
   § `--afk` block's bytes or the header caveat** — the Task 1.3 reword is safe iff it introduces none
   of the swept tokens/shapes (trivial; stated in the slice).
5. **The reporter-format premise test has diagnostic and hardening gaps** (verified: issue #1343
   findings 4 and 6 (2026-08-06); confirmed live at `6fff2ee`). The 'reporter-format premise (D7,
   round-3)' test in `skills/war/assets/workflow-template.test.mjs` asserts `run.status === 0` with a
   custom message but never inspects `run.error` (a spawn failure reads as "the premise changed"); its
   `spawnSync` passes no `timeout`; and the custom message suppresses node:assert's generated
   actual/expected delta (recorded repo lesson) — a non-zero child exit reports prose only.
6. **The sole HARD-trigger premise — the bash banner — is unpinned** (verified: issue #1343 finding 5
   (2026-08-06); confirmed live at `6fff2ee`). After the narrowing, HARD fires only against an
   enumerating log, and this repo's only enumerating producer is `resolveGate`'s
   `printf '\n== gate(bash): %s ==\n' "$f"` banner. The producer-side test 'resolveGate: includes printf
   banner for each suite' in `skills/war/assets/war-config.test.mjs` asserts only the substrings
   `printf` and `gate(bash)` (construct-anchored; ~line 1107, a dated snapshot at `6fff2ee`) — dropping
   the `%s`/`"$f"` path interpolation keeps it green while silently emptying the HARD arm — and nothing
   couples the seat-facing literal `` `== gate(bash): <path> ==` `` (both dispatched prompts +
   `agents/war-auditor.md`) to what `resolveGate` actually emits.
7. **Zero-hit anchor census** (conversion measurement at `6fff2ee`; each expected unchanged
   post-plan-3 — plan 3's committed text introduces none of these tokens): `ABORTED` has 0 hits in
   `skills/war/assets/workflow-template.js` and `agents/war-auditor.md`; `truncated` has 0 hits on both
   (the only near-miss is an unrelated "no truncation" roster comment in `workflow-template.js`,
   not a prompt literal) — so the D4 clause's tokens mechanically pin the new sentence and cannot pass
   on pre-existing prose (the plan-3 D13 zero-hit-token pattern, applied forward). Predecessor
   witnesses: `done_when_log_path` = 0 hits in `workflow-template.js` at `6fff2ee`, ≥ 1 after plan 3
   (its End state 4); `strictly stronger` = 1 hit in `workflow-template.test.mjs` at `6fff2ee`, 0 after
   plan 3 (its End state 9) — both non-vacuous witnesses.
8. **Predecessor/sibling footprint census** (verified: the five committed 2026-08-06 plans' `- Files:`
   lines, read at conversion): `skills/war/assets/war-config.mjs` is touched by **no** predecessor or
   sibling plan — this plan's comment-only note is the file's only edit in the batch.
   `skills/war/assets/war-config.test.mjs` is touched by sibling plan 5 (`verdict-adjudication-integrity`
   Task 1.1 — the `_polish`/retired-token `sweptSurfaces` enumerated lists) — a **different construct**
   from the banner test this plan edits; same-file cross-plan contention, no dependency either way
   (Note 6). `CONTEXT.md` is touched by plan 5 Task 1.1 (glossary rewrite + cold-home eviction with a
   byte target) — this plan's Task 1.4 adds two short additive rows; contention + budget interplay in
   Note 6. `CONTEXT.md` measured 114,449 B at `6fff2ee`; `prompt-surface-budgets.test.mjs` semantics:
   size > hard (126,976 B) is red, above advisory (111,616 B) is a logged warning, never a failure.
9. **Downstream spine** (verified: sibling spec texts at `6fff2ee`):
   `docs/specs/2026-08-06-handoff-schemas-contract-design.md` § Open risks — "this group lands after the
   `gate-audit-finding-routing` sibling group — both edit `skills/war/assets/workflow-template.js`";
   `docs/specs/2026-08-06-structural-pin-extractors-design.md` § Pivotal — "Ordering (binding): this
   group lands **after** the sibling groups `done-when-floor-wiring` and `gate-audit-finding-routing`".
   Both edges belong on the roadmap's dependency spine (Note 7).
10. Companion lessons already recorded and both resolved by this plan (verified: present in the live
    tree at `6fff2ee`):
    `docs/learnings/archive/phase-close-polish-tasks-own-absorb-findings-have-no-further-round-to-land.md`
    (#1377's defect) and
    `docs/learnings/archive/hard-trigger-narrowing-leaves-contradictory-clause-and-early-abort-truncation-residual.md`
    (#1372's defects). Both stamped RESOLVED in the fixing task (the batch's fold-into-fixing-task
    precedent; D12).

11. **Amendment base census** (*amendment 2026-08-15*; measured at the live campaign base `7a3eb2a`,
    the tip after this campaign's plans 1–4 landed — the amendment's own Part-1 authorization for
    Phase 2, and the zero-hit-token discipline of Context 7 applied to the amendment's pins).
    Defect facts: `agents/war-auditor.md` line 145's `## Return` shape and
    `skills/war/references/schemas.md` line 59 both still declare **`escalate_reason?`** — the
    optional form (1 hit each); `metacharacter` is 0 in `agents/war-auditor.md` and 0 in
    `skills/war/assets/workflow-template.js`, while `hooks/validate-auditor-git.sh` carries it
    **twice — in the file header comment only, never in the deny message** (the line-85
    `forbidden character(s)` denial names `&&`/`;` chains and the Read/Grep/Glob remedy, exactly
    #1412's complaint). Pin-token census (all measured 0, therefore mechanical by construction):
    `required when` (both prose surfaces), `however severe` (both auditor surfaces),
    `governed by the MAPPED TESTS block above` and `timeout: 60_000` and `run.error`
    (`workflow-template.js` / its suite). **Rejected pin candidates** (pre-existing, so vacuous —
    the trap Context 7 exists to avoid): `escalate_reason` alone scores 1 on **all three** surfaces;
    `by construction` scores 1 in `workflow-template.js` (an unrelated drift-guard comment at line
    237) and twice in this plan's own Part-1 prose; a bare `timeout` scores 3 in
    `workflow-template.test.mjs`, none inside the target test. Every amendment End state (15–17) and
    the sharpened End states 3/7/8 are keyed to the zero-hit column, never the pre-existing one.

## Pivotal constraints

- **Stacking (binding)**: predecessor plan `2026-08-06-done-when-floor-wiring` lands first — it rewrites
  `workflow-template.js` + `workflow-template.test.mjs` regions (construct-disjoint from this plan's,
  Note 1, but the same files). Task 1.1 is authored against the **post-plan-3** shapes and runs
  predecessor witnesses as its first post-rebase act (D10); a missed witness ⇒ **halt and report the
  missing predecessor, never improvise** — the standalone fallback is halt-on-missing-witness, not a
  downshift.
- **Split prompt surfaces change together.** Standing instructions in `agents/war-auditor.md`;
  dispatched prompts string-built in `workflow-template.js` — any seat-behavior change lands on both in
  the same commit, drift-guarded by the D3 both-surfaces directive registry in
  `workflow-template.test.mjs` (its 'mechanical mapped-tests grep' row already anchors the
  enumeration-conditional on both surfaces).
- **The demotion ladder's promise is total.** `demote` log()s every demotion; ADR 0013's contract is
  "never drop silently" — the #1377 fix routes sweep-raised findings through the existing
  `dispositionOf`/`demote` constructs, never a parallel channel.
- **Fail-open direction discipline.** No fix here may create a new hold path: the contradiction rescope
  and the truncation clause both move evidence interpretation toward SOFT-unless-proven; the
  sweep-routing fix files findings, it never blocks a land, never alters unanimity or the
  `isHardGateEvidence` lanes.
- **`resolveGate` semantics are frozen.** The `|| exit 1` fail-fast composition is documented deliberate
  and mirrored inline in `workflow-template.js` with a D2 mirror-registry row plus idempotence tests
  keyed to its exact output — this plan changes **no `resolveGate` output byte** (A2 carries the
  fallback).
- **Registry growth discipline.** The D3 registry grows by row/anchor with an exact floor count ("floor
  equals the true row count, no slack") — **Phase 1** extends **existing** rows' anchor arrays only,
  leaving the floor-count assertion message untouched (the census trap). **Phase 2's Task 2.1 is the
  sanctioned exception** (*amendment 2026-08-15*): it introduces three genuinely new both-surfaces
  directives (the required-when-escalate contract, the by-construction discriminator, the
  search-tooling sentence), so it **adds one new registry row binding them across the standing card
  and the dispatched prompt, and updates the floor count and its enumerating message in the same
  task** — guard travels with fact, and "floor equals the true row count" is preserved by moving
  both together, never by leaving a new row uncounted. The #931 template-literal census: any
  new template literal in `workflow-template.js` is `pt`-tagged or registered; the truncation clause
  lengthens two already-`pt`-tagged literals (keep the tags), and the routing code introduces no new
  untagged literal.
- **ADR 0042 eviction semantics.** `skills/war/references/setup.md` is a byte-identical eviction target;
  editing a moved block in place requires amending the file-header caveat in the same commit. The Task
  1.3 reword must introduce none of the tokens/shapes the four UNION OLD-absent sweeps police (Context
  4's census).
- **Platform law**: every committed check whose pattern carries `$`, `"`, backslashes, or `%` runs
  `grep -F` — BSD grep treats a mid-pattern `$` as an anchor (the red-team-executed false-red class from
  plan 3's End state 1).
- **Sweep-region invariants**: nothing routed at sweep close may ride `--ace` (`aceable` is populated
  solely at the per-task approve branch; the #805-exempt annotation documents the region); the
  `polish-rejected`/`polish-discarded` `auditLog` entries and every existing sweep log line stay
  byte-unchanged (the criterion-5 discard test asserts the `polish-discarded` entry today; the
  `polish-rejected` entry has **zero** pre-existing asserts — a conversion-verified gap Task 1.1's new
  discard-arm test closes by pinning it); `demote`'s log line reads
  `f.severity`/`f.title`/`f.task` — stamp `task: polishTask.id` before routing or it prints `undefined`.
- **Anchor by named construct, never line number** — the issues' line refs (~1819, ~1107, ~4527) are
  dated snapshots; every edit here anchors by construct (`mappedTestsLine`, `authMappedLine`, the
  per-task gate-audit `agent()` prompt, the `sweepApproved`/`polish-discarded` arms, `resolveGate`, the
  'reporter-format premise' test).
- **Release discipline**: the version bump is its own trailing phase; version literals in this plan and
  the source spec are non-authoritative.

## Resolved design tree

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| D1 | Where do sweep-raised findings go at sweep close? | Route every Minor/Nit finding the re-audit panel returns (hoisted `minorsOf(pSeats)` capture, stamped `task: polishTask.id`) through the existing disposition routing at both terminal arms: `follow-up` → `minorsFiled`, `note` → `notes`, `absorb` (incl. fileless) → `demote(f, 'follow-up', …)` with a reason naming the sweep as the terminal round. Never ace-eligible, never `phaseCloseQueue` (there is no later sweep). Critical/Major keep today's behavior (they block re-approval, visible in `auditLog`). | spec §3 D1; (verified: issue #1377 (2026-08-06)) |
| D2 | Does the discard/rejected arm route them too? | Yes [assumed: symmetry with the task-level non-approve demotion arm — if wrong: sweep-raised findings on a discarded sweep keep dropping, the same #1377 defect one arm over]. Demotion reason records that the polish branch never merged. On the `sweepWhy`-blocked, skipped, and held arms the panel never convened — no sweep-raised findings exist and the promise extends vacuously (stated in the routing comment). | spec §3 D2 (carried [assumed] row) |
| D3 | Fix the clause contradiction by deletion or rescope? | Rescope: the older conjunctive clause narrows to the case it was written for — a MISSING mapped test (green-by-deletion) — with an explicit deferral: "the present-but-unrun path is governed by the MAPPED TESTS block above". `mappedTestsLine` stays the sole owner of the present-but-unrun HARD path. Single-surface (Context 2). | spec §3 D3; (verified: issue #1343 finding 2 (2026-08-06)) |
| D4 | Truncation false-HARD | One truncation clause appended to `mappedTestsLine`, `authMappedLine`, and the `agents/war-auditor.md` D7 checklist bullet: a captured log whose bash half ABORTED (the discovery loop exits on the first red suite — a red suite's header with no later headers after it) is truncated; a mapped path after the abort point is SOFT cannot-confirm, never HARD. The `ABORTED`/`truncated` tokens are zero-hit on both surfaces at the base (Context 7) — mechanical pins by construction. | spec §3 D4; (verified: issue #1343 finding 3 (2026-08-06)) |
| D5 | Guard vehicle for D4 | Extend the anchors of the **existing** D3 registry row 'mechanical mapped-tests grep' (surfaces: `war-auditor.md` + the mappedTests-bearing per-task prompt fixture) with the truncation-clause regexes; extend the existing 'authMappedLine twin' test for the integrated-tip seat; extend the 'mappedTests grep (End state 7, D7)' per-task threading test. No new registry row — the exact floor-count message untouched. | spec §3 D5 |
| D6 | Banner coupling | Producer side: strengthen 'resolveGate: includes printf banner for each suite' in `war-config.test.mjs` to assert `== gate(bash): ` plus the `%s` interpolation (and the `"$f"` argument). Consumer side: in the per-task D7 threading test in `workflow-template.test.mjs` (resolveGate already imported), assert the live `resolveGate` output carries `== gate(bash): ` and `%s`, and that the seat prompt and `agents/war-auditor.md` carry the matching `== gate(bash): ` literal. | spec §3 D6; (verified: issue #1343 finding 5 (2026-08-06)) |
| D7 | Premise-test hardening | Add `timeout: 60_000` to the `spawnSync` options; assert `!run.error` (naming a spawn/env failure, not a premise change) before the status assert; interpolate `run.status` plus a stderr tail into the status assert's message (the custom-message-suppresses-diff lesson). | spec §3 D7; (verified: issue #1343 findings 4/6 (2026-08-06)) |
| D8 | setup.md backstop sentence | Reword to the narrowed reality: the downstream `execution-evidence` HARD catch holds only where the captured gate log enumerates test file paths (the `.test.sh` half); for a pattern admitting a non-`.test.sh` file the gate ignores, the mapped-path grep is SOFT cannot-confirm — the ≥1-file sanity floor plus the floor ⊆ gate discipline is the operative guard. The reword retires the phrase `caught downstream` entirely (D13 — a mechanical OLD-absent check; conscious tightening of the spec's "= 0 or qualified" disjunction). Amend the file-header byte-identical caveat in the same commit. | spec §3 D8; (verified: issue #1343 finding 1 (2026-08-06)) |
| D9 | `war-config.mjs` footprint | Comment-only: a coupling note at the `resolveGate` construct recording that the `\|\| exit 1` abort truncates enumeration and that the seat prompts' truncation clause depends on this shape. No output-byte change. [assumed: the note avoids quoting any swept grep pattern or exact-count banner verbatim, per the coupling-comment self-match lesson — if wrong: a future census grep double-counts the comment.] | spec §3 D9 (carried [assumed] row) |
| D10 | Predecessor witness protocol | Task 1.1's worker, first act after the standard rebase: `grep -c 'done_when_log_path' skills/war/assets/workflow-template.js` ≥ 1 (plan 3 End state 4) AND `grep -c 'strictly stronger' skills/war/assets/workflow-template.test.mjs` = 0 (plan 3 End state 9; measured 1 at `6fff2ee`, so the witness cannot pass at the un-landed base). Task 1.2's witness: `grep -Fc 'ABORTED' skills/war/assets/workflow-template.js` ≥ 1 (proves Task 1.1 merged — its wave edge's content). Any miss ⇒ halt and report, never improvise. | conversion judgment (plan 5's A5 witness shape), logged for /red-team |
| D11 | Task decomposition | Four file-disjoint tasks in Phase 1 — Task 1.1 the engine cluster (`workflow-template.js` + its suite + `agents/war-auditor.md` + the two lesson stamps; forced by the same-file rule, the both-surfaces law, and guard-travels-with-fact); Task 1.2 the resolveGate pair (`war-config.mjs` comment + `war-config.test.mjs` banner pin) with `deps: [1.1]` (a content edge — the D9 note names the truncation clause 1.1 authors; plan 3's Note-1 precedent); Task 1.3 `setup.md`; Task 1.4 `CONTEXT.md` — plus the standard trailing release phase. | conversion judgment, logged for /red-team; war-strategy §3 |
| D12 | Lesson stamps | Both companion lessons (Context 10) are stamped in Task 1.1: prefix each `description` with `RESOLVED (gate-audit-finding-routing, #1377/#1372, <land date>)`, body/keywords otherwise untouched (the repo's lesson-stamp convention; the stamped body legitimately keeps present-tense defect prose). The redaction lint gates the edits (a discovered gate member). | conversion judgment (batch fold-into-fixing-task precedent), logged for /red-team |
| D13 | Check sharpening | End state 4 pins the truncation clause via the zero-hit `ABORTED` token (grep -F), not the spec's `grep -l "truncated"` (kept as a secondary floor); End state 8 mandates full retirement of `caught downstream` (= 0), dropping the spec's "or qualified" arm. Both are conscious tightenings (Note 4). | conversion judgment, logged for /red-team |
| D14 | CONTEXT.md glossary rows | Both spec §6 terms land as short additive `CONTEXT.md` entries — **sweep-raised finding** (near the existing **Phase-close coherence sweep** entry) and **truncated gate log** (same neighborhood, cross-referencing the D7 mapped-tests rules) — ≤ ~450 B combined. [assumed: each earns its glossary row (the routing fix and its tests keep the two populations apart; the truncation rule is now load-bearing seat doctrine) — if wrong: drop the row(s); the plan prose still defines them locally.] Budget interplay with plan 5 in Note 6. | spec §6 (carried [assumed] rows) |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Routing sweep-raised findings on the discard/rejected arm too (D2) is the wanted symmetry | spec §3 D2 (carried [assumed] row); the task-level non-approve demotion arm is the precedent | sweep-raised findings on a discarded sweep keep dropping — the same #1377 defect one arm over | End state 2's test; ratify in /red-team |
| A2 | The false-HARD fix belongs on the evidence-interpretation side; `resolveGate`'s fail-fast output stays byte-frozen | spec §2/§3 (carried [assumed] row); the `\|\| exit 1` composition is documented deliberate, D2-mirror-registered, and idempotence-keyed — a continue-on-red aggregate gate is a much larger redesign | the gate's fail-fast contract and the mirror/idempotence guard set must be redesigned as their own plan | End state 11 (idempotence trio + D2 mirror row green untouched); ratify in /red-team |
| A3 | The D9 coupling note can be written without self-matching any swept census grep | spec §3 D9 (carried [assumed] row); the coupling-comment-restating-grep-pattern lesson | a future exactly-N-surfaces census double-counts the comment | Task 1.2's worker states in the done report which census patterns were checked against the note's text |
| A4 | The two glossary terms earn CONTEXT.md rows | spec §6 (carried [assumed] rows); both name distinctions this plan's code and tests keep apart | drop the row(s) — plan prose defines them locally; `CONTEXT.md` leaves the footprint | operator veto at /red-team; End state 9 |
| A5 | Predecessor plan 3 has LANDED before any Task 1.1 dispatch | the spec's § Open risks ordering declaration + plan 3's Note 6 (this plan named as its downstream); the survey manifest's machine hint is not present in this worktree — the two committed artifacts are the source; the roadmap sequences plan 3 ahead (ADR 0011) | Task 1.1 edits collide with plan 3's rewrites or land against stale shapes | D10 witnesses at the rebased base; miss ⇒ halt-and-report (backstop row) |
| A6 | No ADR change — the ladder's existing "never drop silently" prose plus the code fix suffices | spec §7 (carried [assumed] row) | a future reader reads ADR 0013's contract as not covering sweep-raised findings and re-opens #1377's question | RATIFIED at this plan's /red-team (2026-08-15): no ADR change now; a recurrence files the one-paragraph clarifying amendment to `docs/adr/0013-…` (amendment rule: pre-existing body byte-unchanged apart from the Status currency line) |
| A7 | The CONTEXT.md additions stay a warning-only budget event | Context 8: 114,449 B at `6fff2ee` (already above the 111,616 B advisory; hard 126,976 B is not approachable at ≤ ~450 B); advisory = logged warning, never a failure (the budget suite's stated semantics); Note 6's roadmap hint (this plan before plan 5) keeps the rows inside plan 5's re-measured shrink base | tighten the rows' wording, or A4's drop fallback | End state 9's budget-suite run |
| A8 | *(amendment 2026-08-15)* The `agent()` schema layer re-prompts on a non-conforming return rather than dropping the dispatch — so the required-when-escalate conditional enforces by retry, never by a dropped seat or a new hold path | the layer's documented conform-or-retry contract; consistent with every existing schema-bearing dispatch in `workflow-template.js` | an escalate-without-reason verdict nulls its seat → the wave-loop's bounded re-dispatch (never an unbounded hold); if observed, that IS the layer-ignores/drops state and Task 2.1(a)'s fallback arm lands instead | Task 2.1's enforcement probe (backstop row) records the observed behavior and which arm landed |

## Non-goals / deferred

- **No change to `resolveGate`'s composed gate string or its fail-fast `|| exit 1` semantics** (A2); a
  continue-on-red aggregate-failure gate is out of scope.
- **No change to unanimity, severity gating, or the HARD escalation lanes** (`isHardGateEvidence`,
  `escalated`, `HARD_ESCALATION_REASONS`); the Phase-1 fixes are routing and evidence-interpretation
  only, and Phase 2 (*amendment 2026-08-15*) additionally tightens the verdict *intake contract* and
  seat doctrine — never the lanes.
- **No widening of the HARD trigger to the node (non-enumerating) half** — the reporter-format premise
  test's revisit comment remains the tripwire.
- *(amendment 2026-08-15)* **#1410 fix 3 (Lead-side auto-routing of remedied escalations into a fix
  round) deferred** — it changes the hold path itself; #1410's own text calls fixes 1+2 "the real
  fix". Revisit only if escalate-with-remedies recurs after the contract lands.
- *(amendment 2026-08-15)* **#1412 fix 2 (admitting `git grep`/`grep -rn` search shapes) deferred** —
  a capability widening of the fail-closed allowlist (ADR 0002), needing its own adjudication; the
  verb set stays byte-unchanged (the `-C` peel precedent: diagnostics improved, allowlist unwidened).
- **No new sweep round or fix budget for sweep-raised findings** — they file as follow-up, never fixed
  in-run.
- **No `phaseCloseQueue` semantics change** — the queue's arms (aced-on-merge, demote-on-everything-else)
  are byte-untouched; the routing is additive beside them.
- **The `truncated gate log` rule stays seat doctrine** — no mechanical log-truncation detector in the
  engine; the seat judges the artifact (a detector is future work if the false-HARD recurs).

## New domain terms · Recommended ADRs

Two CONTEXT.md rows (D14/A4): **sweep-raised finding** — a finding the phase-close re-audit panel raises
against the polish commit itself, as distinct from the *queued* findings (`phaseCloseQueue`) the sweep
was dispatched to drain; **truncated gate log** — a captured gate log whose bash half aborted at the
first red suite, so it enumerates some per-file headers but not all discovered suites;
enumeration-conditional evidence rules treat post-abort paths as SOFT cannot-confirm. No new ADR (A6
carries the fallback).

## Commander's Intent

- **Purpose:** nothing the phase-close sweep's own re-audit raises can drop silently — the demotion
  ladder's "never drop silently" promise extends to sweep-raised findings on every arm (Minor/Nit
  route by disposition through the ladder; Critical/Major keep today's visibility — they block
  re-approval on the merged arm and ride the `polish-rejected`/`polish-discarded` `auditLog` entries
  on the terminal arms, which this plan's discard-arm test newly pins); the gate-audit
  seat has exactly one governing instruction on the one path where HARD can fire, and every seat
  surface instructs that a truncated (early-aborted) gate log must not mint a false HARD land-hold —
  an instruction-side guard (seat doctrine, not a mechanical detector), its residual recurrence
  backstopped (the deferred-validations row); the sole premise the HARD arm rests
  on — resolveGate's per-file banner — is pinned producer-side and consumer-side; the premise probe
  fails loudly on env trouble instead of impersonating a premise change; the Lead-facing `--afk`
  backstop sentence tells the narrowed truth; and the two recorded lessons are stamped resolved.
- **Method:** route `minorsOf(pSeats)` (hoisted, task-stamped) through the existing
  `dispositionOf`/`demote`/`minorsFiled` ladder at both terminal sweep arms — filing, never holding;
  rescope the conjunctive clause to the missing-test case with an explicit deferral to the MAPPED TESTS
  block; append one truncation clause to `mappedTestsLine`, `authMappedLine`, and the war-auditor.md D7
  bullet (both-surfaces law, same commit), pinned by zero-hit-at-base tokens through the existing D3
  registry row's grown anchors; strengthen the banner test and add the consumer-side coupling assert;
  harden the premise test (timeout, `!run.error`, interpolated delta); reword the setup.md sentence and
  its header caveat under ADR 0042; comment-couple `resolveGate` without changing an output byte; author
  Task 1.1 against the post-plan-3 constructs with halt-on-miss predecessor witnesses. Fail-open
  throughout: no new hold path anywhere.
- **End state:**
  1. When the phase-close sweep merges and its re-audit panel returned a Minor/Nit finding, that
     finding routes by disposition — follow-up → `minorsFiled`, note → `notes`, absorb →
     `demote(…, 'follow-up', …)` with a reason naming the sweep as the terminal round — and nothing
     sweep-raised rides `aced` or `phaseCloseQueue` ·
     check: `node --test skills/war/assets/workflow-template.test.mjs` — a test whose title names
     sweep-raised finding routing asserts the demotion log line, the `minorsFiled` observable, and the
     aced-is-queue-only invariant; `grep -n "Disposition demotion" skills/war/assets/workflow-template.js`
     shows the ladder is the vehicle.
  2. When the sweep is rejected or its merge fails (the discard arm), sweep-raised Minor/Nit findings
     route through the same ladder with a reason naming the unmerged polish branch; the
     `polish-rejected`/`polish-discarded` `auditLog` entries are byte-unchanged ·
     check: `node --test skills/war/assets/workflow-template.test.mjs` (the same test file asserts the
     discard arm; the `polish-discarded` entry is asserted today and the `polish-rejected` entry is
     newly pinned by this plan's discard-arm test — zero pre-existing asserts at the base).
  3. The per-task gate-audit prompt carries exactly one governing instruction for the
     present-but-unrun path: the conjunctive clause is scoped to the MISSING-test case and defers by
     name to the MAPPED TESTS block ·
     check: `grep -c "genuinely absent AT THE CONFIRMED INTEGRATION TIP" skills/war/assets/workflow-template.js`
     returns 1 (the preservation pin — unchanged by design) AND
     `grep -Fc 'governed by the MAPPED TESTS block above' skills/war/assets/workflow-template.js`
     ≥ 1 (the landing pin — 0 at the base, Context 11: the count-1 grep alone cannot distinguish the
     rescoped clause from the unrescoped one), and the enclosing sentence names the deferral
     (hand-verified placement). **Mandatory
     manual same-scope survey (grep is a floor):** hand-scan the gate-audit prompt region of
     `workflow-template.js`, the D7/attestation test titles and comments in
     `workflow-template.test.mjs`, and the `agents/war-auditor.md` checklist for prose restating the
     old conjunctive rule; list each straggler as a survey-derived correction.
  4. The truncation clause is live on all three seat surfaces — `mappedTestsLine`, `authMappedLine`,
     and the `agents/war-auditor.md` D7 bullet — and mechanically pinned: the D3 registry row's grown
     anchors red on removal ·
     check: `grep -Fc 'ABORTED' skills/war/assets/workflow-template.js` returns 2 and
     `grep -Fc 'ABORTED' agents/war-auditor.md` returns 1 (zero-hit tokens at the base — Context 7);
     secondary floor: `grep -l "truncated" skills/war/assets/workflow-template.js agents/war-auditor.md`
     lists both files; `node --test skills/war/assets/workflow-template.test.mjs` (the extended row +
     twin + threading tests).
  5. Dropping resolveGate's per-file path interpolation reds producer-side ·
     check: `grep -Fn '== gate(bash): ' skills/war/assets/war-config.test.mjs` and
     `grep -Fn '%s' skills/war/assets/war-config.test.mjs` hit inside the banner test (grep -F —
     platform law).
  6. The seat-facing banner literal cannot drift from resolveGate's live output: the per-task D7
     threading test calls `resolveGate` and asserts the shared `== gate(bash): ` literal on the live
     output, the seat prompt, and the standing card ·
     check: `node --test skills/war/assets/workflow-template.test.mjs`.
  7. A premise probe that fails to spawn or wedges fails loudly, bounded, with the delta in the
     message ·
     check: `grep -c 'run.error' skills/war/assets/workflow-template.test.mjs` ≥ 1 (0 at the base)
     and `grep -Fc 'timeout: 60_000' skills/war/assets/workflow-template.test.mjs` ≥ 1 (the exact
     option literal — 0 at the base, Context 11; a bare `timeout` grep has 3 pre-existing hits
     elsewhere in the file and proves nothing), both hits inside the 'reporter-format premise' test
     (hand-verified placement); the suite is green.
  8. The § `--afk` sanity floor block states the narrowed reality and the operative guard, and the
     file header carries the in-place-amendment caveat ·
     check: `grep -Fci 'caught downstream' skills/war/references/setup.md` returns 0 (D13
     tightening; **case-insensitive** — a case-sensitive retirement grep false-passes on a
     sentence-initial "Caught downstream", the recorded
     retirement-grep-must-be-case-insensitive lesson, evasion re-proved at this plan's red-team);
     header grep shows the amended caveat. **Mandatory manual same-scope survey:** hand-scan
     `skills/war/SKILL.md`'s Setup steps and `setup.md`'s sibling blocks for prose restating the
     retired unqualified backstop; list each straggler as a survey-derived correction.
  9. The two glossary rows are live and the budget suite stays green ·
     check: `grep -c 'sweep-raised finding' CONTEXT.md` ≥ 1, `grep -c 'truncated gate log' CONTEXT.md`
     ≥ 1, and `node --test skills/war/assets/prompt-surface-budgets.test.mjs` (advisory-crossing is a
     warning by the suite's stated semantics — A7).
  10. Both companion lessons are stamped RESOLVED with this plan's slug and issues, bodies otherwise
      untouched ·
      check: `grep -l 'RESOLVED (gate-audit-finding-routing'
      docs/learnings/archive/phase-close-polish-tasks-own-absorb-findings-have-no-further-round-to-land.md
      docs/learnings/archive/hard-trigger-narrowing-leaves-contradictory-clause-and-early-abort-truncation-residual.md`
      lists both files.
  11. The full gates are green at the integrated tip with `resolveGate`'s output bytes unchanged — the
      idempotence trio and the D2 mirror-registry row pass untouched ·
      gate: the self-discovery gate (`resolveGate` in `war-config.mjs`) — `node --test
      'skills/**/*.test.mjs'` and the documented hooks/skills shell-test loop both exit 0.
  12. The redaction lint stays green over the lesson stamps ·
      gate: the self-discovery gate (the war-memory lint wrapper is a discovered member).
  13. Each landing commit cites its issue(s) — #1377 for Task 1.1's routing items, #1372 + #1343 for
      Task 1.1's seat-prompt/suite items and Task 1.2, #1343 for Task 1.3, #1377 + #1372 for Task
      1.4, #1410 + #1412 for Task 2.1, #1412 for Task 2.2, and the release commit (Task 3.1) cites
      the plan (the per-finding close conditions require the citation) ·
      check (mechanical floor, phase close): `git log --format=%s <phase-base>..<tip> | grep -vc
      '#[0-9]'` = 0 — every landing commit cites some issue; judge: the Lead at phase close maps
      each commit to its correct issue over the full `<phase-base>..<tip>` range (per the recorded
      each-commit-cites-its-issue lesson this condition is judged over the phase range, never gated
      per-commit at a task's audit_sha — the range does not exist at any single task's branch tip,
      and per-issue mapping is judgment no command decides).
  14. Release: all four version slots move lock-step to the next free patch above the live integration
      base at land time ·
      check: `node --test skills/war/assets/version-slots.test.mjs` (lock-step across all four slots
      + the monotonic floor — this is the *whole* mechanical condition: the floor proves the bump is
      ≥ the live base, and lock-step proves no slot lagged); judge: the "next **free** patch" half
      (i.e. exactly one above, not a skip) is Lead-checked at land against `git ls-remote --tags` /
      the landed slots — no committed command can decide it, because the free patch is a property of
      the remote at land time, not of the diff.
  15. *(amendment 2026-08-15, #1410)* An `escalate` verdict without a non-empty `escalate_reason` is
      rejected at intake (schema conditional, or the recorded fallback arm), and the
      required-when-escalate contract is stated on all three prose surfaces — the war-auditor.md
      verdict list + Return shape, the dispatched auditor prompt, and the schemas.md AuditVerdict
      row ·
      check: `node --test skills/war/assets/workflow-template.test.mjs` (the intake-contract row —
      it pins whichever enforcement arm landed, per the backstop probe); OLD-absent:
      `grep -Fc 'escalate_reason?' agents/war-auditor.md skills/war/references/schemas.md` = 0 in
      each (the optional-marker form is retired — 1 in each at the amendment base, Context 11);
      NEW-present: `grep -Fci 'required when' agents/war-auditor.md skills/war/references/schemas.md`
      ≥ 1 in each (0 in each at the amendment base — non-vacuous by construction).
  16. *(amendment 2026-08-15, #1410)* The by-construction discriminator — a blocking finding with a
      concrete in-file `suggested_fix` needing no new plan decision is `request_changes`, however
      severe — is live on both auditor surfaces (standing card + dispatched prompt), same commit ·
      check: `grep -Fc 'however severe' agents/war-auditor.md` ≥ 1 and
      `grep -Fc 'however severe' skills/war/assets/workflow-template.js` ≥ 1 (0 on both surfaces at
      the amendment base, Context 11 — the earlier `by construction` candidate token pre-exists in
      an unrelated `workflow-template.js` comment and is not a pin; suite pin rides End state 15's
      test file).
  17. *(amendment 2026-08-15, #1412)* A metacharacter-refused search denial names the rule that fired
      (glob/alternation metacharacters, with the Grep-tool remedy), the guard's allowlist and deny
      decisions are byte-unchanged, and the search-tooling sentence is live on both auditor prose
      surfaces (the standing card, Task 2.1(c); the dispatched prompt, same task — the guard-message
      half is Task 2.2's) ·
      check: `bash hooks/validate-auditor-git.test.sh` (the new message-content case);
      `grep -ci 'metacharacter' agents/war-auditor.md` ≥ 1 and
      `grep -ci 'metacharacter' skills/war/assets/workflow-template.js` ≥ 1 (both 0 at the
      amendment base, Context 11).

## Build order (for /war)

Phase 1 (wave 1 = Tasks 1.1, 1.3, 1.4; wave 2 = Task 1.2 `deps: [1.1]`) → Phase 2 (amendment
2026-08-15 — auditor verdict-boundary + guard diagnostics; wave 1 = Tasks 2.1, 2.2, file-disjoint) →
Phase 3 (release). Phase 2 is a phase, not more Phase-1 tasks, because Task 2.1 edits three files
Task 1.1 owns — a phase edge, never a same-file deps dodge.

The 1.2 → 1.1 wave edge is a content edge, never a collision dodge (the file sets are disjoint): Task
1.2's D9 coupling note names the seat prompts' truncation clause, which Task 1.1 authors — at the frozen
phase base that note would be a dangling forward reference to its auditor; the edge (plan 3's Note-1
precedent) makes it true at Task 1.2's rebased base, witnessed by D10's `ABORTED` grep. Tasks 1.3 and
1.4 are file-disjoint from everything and dependency-free (the constructs they edit exist at the frozen
base and are untouched by predecessor plan 3).

## Phase 1 — Sweep routing, clause reconciliation, truncation rule, banner pins, doc truth

### Task 1.1: Engine cluster — sweep-close routing, seat-prompt reconciliation, suite guards, card twin, lesson stamps

- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-auditor.md`, `docs/learnings/archive/phase-close-polish-tasks-own-absorb-findings-have-no-further-round-to-land.md`, `docs/learnings/archive/hard-trigger-narrowing-leaves-contradictory-clause-and-early-abort-truncation-residual.md`
- Plan slice: **Witness first (D10/A5)** — after the standard rebase onto the integration tip, verify
  `grep -c 'done_when_log_path' skills/war/assets/workflow-template.js` ≥ 1 AND
  `grep -c 'strictly stronger' skills/war/assets/workflow-template.test.mjs` = 0 (predecessor plan 3's
  End-state-4/9 shapes; the second is 1 at `6fff2ee`, so it cannot pass vacuously). A miss means
  `2026-08-06-done-when-floor-wiring` has not landed: **halt and report, never improvise.**
  **Engine (`workflow-template.js`)** — (a) sweep-close routing (D1/D2, #1377): hoist the re-audit
  panel's Minor/Nit findings at the `auditRound(polishTask, …)` site into a variable visible at both
  terminal arms (`pSeats` is block-scoped inside `if (!sweepWhy)` today), stamped
  `{ task: polishTask.id, ...f }`; at the merged arm (`sweepApproved && pmr.status === 'merged'`) and
  the discard arm (`polish-discarded`), route each by `dispositionOf`: `follow-up` →
  `minorsFiled.push`, `note` → `notes.push`, `absorb` (incl. fileless) → `demote(f, 'follow-up', …)` —
  merged-arm reason: the sweep is the phase's terminal fix round, absorb has no later round;
  discard-arm reason: the polish branch never merged. A routing comment states the vacuous arms (blocked
  /skipped/held — no panel convened, no sweep-raised findings exist). Invariants: nothing sweep-raised
  enters `aced`, `aceable`, or `phaseCloseQueue`; the queue's own arms, every existing sweep log line,
  and the `polish-rejected`/`polish-discarded` `auditLog` entries are byte-unchanged; no new hold path;
  no new untagged template literal (#931 census — string args to `demote` are fine). (b) conjunctive
  rescope (D3, #1372/#1343-2): in the per-task gate-audit `agent()` prompt, the clause following
  `mappedTestsLine`/`guardLine` narrows to "…record a HARD gate-evidence finding for a MISSING mapped
  test ONLY when it is genuinely absent AT THE CONFIRMED INTEGRATION TIP and the captured artifact
  confirms it did not run (the present-but-unrun path is governed by the MAPPED TESTS block above)" —
  the live clause spans **three concatenated `pt` literals** (the quoted sentence is their rendered
  concatenation — edit within the literals, keep the tags); keep the phrase
  `genuinely absent AT THE CONFIRMED INTEGRATION TIP` (End state 3's count stays 1; the deferral
  parenthetical is End state 3's zero-at-base landing pin, Context 11),
  and add the one clarifying word keeping the missing+non-enumerating quadrant SOFT: the
  artifact-confirms leg is satisfiable only on an **enumerating** half (a missing `.mjs` mapped path's
  absence is still SOFT cannot-confirm — the #1343 finding-2 brush).
  (c) truncation clause (D4, #1343-3): append to `mappedTestsLine` AND `authMappedLine` (both stay
  `pt`-tagged): "a captured log whose bash half ABORTED (the discovery loop exits on the first red
  suite — a red suite's header with no later headers after it) is truncated: a mapped path after the
  abort point is SOFT cannot-confirm, never HARD." (d) straggler sweep: grep
  `genuinely absent AT THE CONFIRMED INTEGRATION TIP` repo-wide and handle every live-surface match —
  then run End state 3's mandatory manual survey (grep is a floor). **Standing card
  (`agents/war-auditor.md`)** — (e) append the same truncation clause to the D7
  grep-the-threaded-mappedTests checklist bullet (both-surfaces law — same commit as (c); the card
  carries no conjunctive-clause twin, Context 2, so (b) is single-surface). **Engine suite
  (`workflow-template.test.mjs`)** — (f) new test beside the existing phase-close sweep tests: a
  would-land phase whose sweep merges while the re-audit panel returns a Minor/absorb finding → assert
  the `Disposition demotion` log line, the finding in `minorsFiled` (and the handoff `followUps`
  observable), and that `aced` carries only the queued findings; companion assertions drive the discard
  arm (panel returns the finding, re-approval fails → same routing with the unmerged-branch reason) and
  a `disposition: 'follow-up'` finding → `minorsFiled` without demotion; the discard-arm test also pins
  the `polish-rejected` `auditLog` entry's shape (verdict + findings payload — zero pre-existing
  asserts at the base, the P2 conversion-verified gap). Delete-the-feature check: with
  the routing removed the assertions must fail (record the trace in the test banner). (g) premise-test
  hardening (D7, #1343-4/6): `timeout: 60_000` in the `spawnSync` options; `assert.ok(!run.error, …)`
  naming a spawn/env failure before the status assert; interpolate `run.status` + a stderr tail into
  the status assert's message. (h) consumer-side banner coupling (D6, #1343-5): in the
  'mappedTests grep (End state 7, D7)' threading test (resolveGate already imported), assert
  `resolveGate('node --test x')` includes `== gate(bash): ` and `%s`, and that the seat prompt and the
  read `agents/war-auditor.md` text carry the matching `== gate(bash): ` literal. (i) D5 guard
  extensions: the D3 registry row 'mechanical mapped-tests grep' gains truncation anchors
  (`/ABORTED/`, `/truncated/i`, `/after the abort point/i` — all zero-hit on both anchored surfaces at
  the base, Context 7) — **no new row; the exact floor-count assertion message untouched**; the
  'authMappedLine twin' test and the per-task threading test gain the same truncation-clause regex.
  **Lesson stamps (D12)** — (j) prefix both companion lessons' `description` with
  `RESOLVED (gate-audit-finding-routing, #1377/#1372, <land date>)`, bodies/keywords otherwise
  untouched. Commits cite #1377 (routing) and #1372 + #1343 (seat-prompt/suite items) — End state 13.
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: resolveGate banner pin + coupling note (producer side)

- Files: `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`
- Plan slice: **Witness first (D10)** — after the standard rebase, verify
  `grep -Fc 'ABORTED' skills/war/assets/workflow-template.js` ≥ 1 (Task 1.1's truncation clause is
  merged; the wave edge's content). A miss ⇒ halt and report. **Comment (`war-config.mjs`, D9,
  #1372/#1343-3)** — a coupling note at the `resolveGate` construct: the `|| exit 1` abort truncates
  enumeration (later suites print no header), and the gate-audit seat prompts' truncation clause
  (`mappedTestsLine`/`authMappedLine` in `workflow-template.js` + the war-auditor.md D7 bullet) depends
  on this fail-fast shape — change one, revisit the other. Comment-only: **no output byte changes**;
  the idempotence trio and the D2 mirror-registry row must pass untouched (A2); the note quotes no
  swept census pattern verbatim (A3 — check the note's text against the repo's exactly-N-surfaces
  census greps and record the check in the done report). **Producer pin (`war-config.test.mjs`, D6,
  #1343-5)** — strengthen 'resolveGate: includes printf banner for each suite' (anchor by test title,
  not line): assert the composed string includes `== gate(bash): ` and `%s` and `"$f"` (the per-file
  path interpolation), so `printf`/`gate(bash)` substring survival can no longer mask an emptied HARD
  arm. Pin safety: sibling plan 5 edits this file's enumerated `sweptSurfaces` lists — a different
  construct; do not touch them. Commits cite #1372 and #1343.
- Done when: `node --test skills/war/assets/war-config.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

### Task 1.3: setup.md backstop truth + header caveat (#1343 finding 1)

- Files: `skills/war/references/setup.md`
- Plan slice: in the § `--afk` sanity floor block, reword the residual sentence per D8: the downstream
  `execution-evidence` HARD catch holds only where the captured gate log enumerates test file paths
  (the `.test.sh` half); for a pattern admitting a non-`.test.sh` file the gate ignores, the
  mapped-path grep is SOFT cannot-confirm, so the ≥1-file sanity floor plus the floor ⊆ gate discipline
  is the operative guard. Retire the phrase `caught downstream` entirely (D13). Amend the file-header
  byte-identical claim in the same commit (ADR 0042 — e.g. "byte-identical … except where a block
  carries a noted in-place amendment", naming this block). Pin safety (Context 4's corrected census):
  the four UNION OLD-absent sweeps and the doc-cli corpus list reference this file — introduce no
  `node …*.sh` invocation shape, no retired scope-hook-glob clause, no `docs/learnings/*` literal, no
  `docs/learnings/phase-<N>.md` aggregate-file shape (the same sweep's second key), no `_polish` token
  (trivially satisfied; state it in the done report). Sweep step: grep
  `caught downstream` repo-wide **case-insensitively** (`grep -ri`, matching End state 8's `-Fci`
  check) and handle every live-surface match — then run End state 8's mandatory
  manual survey and record the outcome even when zero stragglers. Commit cites #1343 (finding 1's close
  condition).
- Done when: None — prose-only reference-doc edit; the mechanical pins are End state 8's greps (the
  file has no content-locking test on this block — Context 4).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.4: CONTEXT.md glossary rows (D14)

- Files: `CONTEXT.md`
- Plan slice: add two short additive entries (≤ ~450 B combined, A7): **sweep-raised finding** —
  adjacent to the existing **Phase-close coherence sweep** entry — a finding the phase-close re-audit
  panel raises against the polish commit itself, distinct from the queued findings
  (`phaseCloseQueue`) the sweep drains; routed by disposition at sweep close, never aced, never
  re-queued. **truncated gate log** — same neighborhood — a captured gate log whose bash half aborted
  at the first red suite (enumerates some per-file headers, not all discovered suites); the D7
  enumeration-conditional treats post-abort mapped paths as SOFT cannot-confirm, never HARD. Additive
  only — no existing entry's bytes move (sibling plan 5 rewrites/evicts other entries in this file;
  any-order safe, Note 6). Budget: the suite's advisory line is warning-only (A7); keep the rows tight
  and re-measure `wc -c CONTEXT.md` at the rebased base, recording it in the done report. Commit cites
  #1377 and #1372.
- Done when: None — glossary-only edit; the mechanical pins are End state 9's greps plus the budget
  suite (`prompt-surface-budgets.test.mjs`, a discovered gate member).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Auditor verdict-boundary + guard diagnostics (amendment 2026-08-15: #1410, #1412)

A separate phase, not new Phase-1 tasks, because Task 2.1 edits three files Task 1.1 owns
(`agents/war-auditor.md`, `workflow-template.js` + suite) — same-file work lands in a later phase,
never as a deps-edge dodge (code-boundary rule 1). Task 2.2's hook pair is file-disjoint from
everything but rides the same amendment phase. Phase base: the tip after Phase 1 lands.

### Task 2.1: Escalate-boundary contract — required reason, the by-construction discriminator, search-tooling sentence (#1410 fixes 1+2, #1412 fix 3)

- Files: `agents/war-auditor.md`, `skills/war/assets/workflow-template.js`,
  `skills/war/assets/workflow-template.test.mjs`, `skills/war/references/schemas.md`
- Plan slice: **(a) `escalate_reason` required when `verdict == "escalate"`** (#1410 fix 1 — the
  smallest change with the most leverage): extend the `AUDIT_VERDICT` schema const in
  `workflow-template.js` (locate by construct — the `const AUDIT_VERDICT = { type: 'object', … }`
  declaration; `escalate_reason` is an optional `{ type: 'string' }` property today) with a JSON-Schema
  conditional making a non-empty `escalate_reason` required exactly when `verdict` is `escalate`
  (`if`/`then` or an equivalent `anyOf` — whatever the schema-validation layer the `agent()` `schema:`
  option uses actually enforces; the worker verifies enforcement empirically and records which arm
  landed). **Enforcement semantics, both arms fully specified:** the intended enforcement point is
  the schema layer's own conform-or-retry loop — a non-conforming return re-prompts the seat until
  it supplies the reason; it never drops a seat and never holds a land, so no new hold path (A8). If
  the probe shows the layer *ignores* the conditional (or drops rather than re-prompts), the
  **fallback arm** is exactly: (1) a MUST sentence on both prompt surfaces — the dispatched auditor
  prompt and the war-auditor.md verdict list — "an `escalate` verdict MUST carry a non-empty
  `escalate_reason` naming the missing plan decision"; plus (2) the suite's intake-contract row
  re-pointed at that sentence (the pinned MUST text on both surfaces *is* the Lead-side observable —
  no engine edit). End state 15 holds under either arm: its OLD-absent/NEW-present greps pin the
  prose surfaces, which land under both arms, and its suite row pins whichever enforcement
  observable the probe recorded. Mirror the contract into the three prose surfaces in the same diff
  (both-surfaces law):
  the `agents/war-auditor.md` verdict list and `## Return` shape line (`escalate_reason?` →
  required-when-escalate — the surfaces retire the `escalate_reason?` optional marker and state the
  contract with the exact phrase "required when `verdict` is `escalate`", the literal End state 15's
  NEW-present grep pins; a hyphenated "required-when-escalate" alone does not satisfy the `-F`
  space-separated pin), the dispatched auditor prompt in `workflow-template.js`, and the
  `schemas.md` AuditVerdict row. **(b) the discriminator** (#1410 fix 2): at the war-auditor.md
  verdict list's `escalate` bullet (the "**only** when the work reveals the PLAN itself is wrong or
  underspecified…" sentence), append the by-construction test: *a blocking finding whose
  `suggested_fix` is a concrete in-file edit needing no new plan decision is `request_changes` by
  construction, however severe — if you cannot name the missing plan decision in `escalate_reason`,
  you are looking at a fixable bug.* Mirror the sentence into the dispatched auditor prompt (same
  commit). **(c) search-tooling sentence** (#1412 fix 3): in war-auditor.md's Bash/tooling guidance,
  state plainly: *search with the Grep/Glob tools, never shell `grep`/`git grep` — the git guard
  refuses glob/alternation metacharacters (`*`, `\|`), not just command chains*; mirror into the
  dispatched prompt. **Tests:** (i) the intake-contract suite row (an escalate verdict without
  `escalate_reason` is rejected by the validation layer, or the recorded fallback observable —
  whichever arm the probe recorded); (ii) **one new D3 registry row** binding the three new
  directives (required-when-escalate, the discriminator, the search-tooling sentence) across both
  auditor surfaces, with the floor count and its enumerating message updated in this same task (the
  Pivotal constraint's sanctioned Phase-2 exception — ad-hoc presence pins are not drift guards);
  anchor regexes use the Context-11 zero-hit tokens (`required when`, `however severe`,
  `metacharacter`), never `by construction` (pre-existing in an unrelated comment at base,
  Context 11) or bare `escalate_reason` (1 hit on all three surfaces at base); (iii) the
  search-tooling sentence pinned on both surfaces via the same row.
  **No engine behavior change**: unanimity, severity gating, and the HARD escalation lanes
  (`HARD_ESCALATION_REASONS`) are byte-untouched — this task changes the verdict *intake contract*
  and seat doctrine only (the Phase-1 Non-goal stands). Commits cite #1410 (a, b) and #1412 (c).
- Done when: `node --test skills/war/assets/workflow-template.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.2: Auditor git-guard denial diagnostics name the rule that fired (#1412 fix 1)

- Files: `hooks/validate-auditor-git.sh`, `hooks/validate-auditor-git.test.sh`
- Plan slice: the forbidden-character denial (locate by construct: the
  `[ -n "$residue" ] && deny "command contains forbidden character(s): …"` line) frames its remedy
  as "split && / ; chains…", which does not describe what seats actually type (`--include=*.py`,
  `git grep 'a\|b'` — 191 denials in one run, #1412). Extend the message so the rule that fired is
  named: keep the offending-character echo, the one-bare-git-command sentence, **and the existing
  Read/Grep/Glob remedy clause the message already carries** (Context 11 — the live message ends
  "…filter and search output with the Read/Grep/Glob tools"; the gap is that no clause names the
  *metacharacter rule* as what fired), and add the metacharacter clause — *glob/alternation/expansion
  metacharacters are refused outright; search with
  the Grep tool (`glob:`/`type:` filters) instead of shell `grep`/`git grep`*. **The allowlist and
  every deny decision are byte-unchanged** — exit codes, verb set, and which commands deny are
  untouched (ADR 0002 capability-first confinement; #1412 fix 2's verb widening is deliberately not
  taken — Non-goals); this is message text only. Test: a new case asserting a representative denied
  search (`git grep` with `\|`) still exits 2 AND the denial message names the metacharacter rule
  (message-content assert, not just exit code — the guard-specificity lesson); existing cases green.
  Note (cross-plan): plan 14's Task 1.5 also edits `hooks/validate-auditor-git.test.sh`
  (comment-truth only) and lands after this plan by spine order — additive case, no collision at
  this plan's base. Commit cites #1412.
- Done when: `bash hooks/validate-auditor-git.test.sh`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 3 — Release

### Task 3.1: Version slots, lock-step

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump all four slots together — `plugin.json` `version`, `marketplace.json`
  `metadata.version` and `plugins[0].version`, the `README.md` `## Status` blurb (replace-in-place,
  never an empty field, no badge) — to the **next free patch above the live integration base at land
  time**; never a resolved version literal (any version literal in this plan or the campaign roadmap is
  non-authoritative). Expected integration base: the tip after `2026-08-06-done-when-floor-wiring`
  (this plan's declared upstream) and whichever other 2026-08-06 campaign predecessors the roadmap
  sequences ahead of this plan (ADR 0011 stack-and-plow). Standalone fallback: this plan does not run
  before plan 3 — the D10 witnesses halt-and-report a missing predecessor (never a downshift); on a
  witnessed plain-`/war` run, resolve the next free patch from the four slots themselves. The Status
  blurb names: sweep-raised findings now routed through the disposition ladder (never dropped), the
  reconciled D7 HARD instruction, the truncated-gate-log SOFT rule, the pinned
  `== gate(bash): ` banner premise, the escalate_reason-required verdict contract, and the
  metacharacter-naming guard denial diagnostics — quoting only identifiers that exist in the landed diff
  (release-blurb lessons: count words match the enumeration; quoted literals byte-match landed
  identifiers; guard semantics stated no wider than the implementation — the truncation rule is seat
  doctrine, not an engine detector).
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- The manual same-scope survey halves of End states 3 and 8 · why deferred: a hand-scan cannot be a
  mechanical gate member; done-report-only evidence, which gate-audit reads as SOFT and never a hold ·
  runner: the owning task's worker (1.1 for End state 3, 1.3 for End state 8) records each outcome —
  mandatory statement even when "zero stragglers"; the Lead re-runs both greps at phase close.
- The predecessor witnesses (D10/A5) on a standalone run · why deferred: a campaign run discharges them
  by spine order; only a plain-`/war` run can encounter the missing-predecessor state · runner: Task
  1.1 (two greps) and Task 1.2 (the `ABORTED` grep) run them as their first post-rebase act and
  halt-and-report on a miss — the standalone fallback is halt, never improvisation.
- The sweep-routing test's pre-fix demonstrated red (delete the routing → the assertions fail) · why
  deferred: a delete-and-trace mutation run is uncommittable by design — the committed test with its
  `minorsFiled`/demotion-log observables is the standing non-vacuity guard · runner: Task 1.1's worker
  runs it locally and records the red in the done report; gate-audit reads it SOFT.
- The truncated-log false-HARD scenario end-to-end (a live baseline-proceed merge with an
  alphabetically-early red suite, then a gate-audit seat reading the truncated artifact) · why
  deferred: requires a real red-gate baseline-proceed run — uncommittable as a unit test of the seat's
  judgment; the clause on three surfaces, the D3 anchors, and the banner pins are the standing guards ·
  runner: the Lead of the first future `/war` phase whose gate log shows a baseline-proceed with an
  early red suite — on observing a gate-audit seat mint (or correctly withhold) HARD against that
  truncated artifact, the Lead records the outcome and, on a false HARD, files a war-followup issue
  citing #1372 · timing: first live recurrence of the scenario.
- The `war-config.mjs` diff-is-comment-only proof · why deferred: the property that matters — zero
  output-byte change — IS proven mechanically by the untouched idempotence trio + D2 mirror row
  (gate members, End state 11); the residual hand-read covers only the *shape* of the diff
  (comment-only classification is language-aware — no committed one-liner decides "this changed line
  is a comment" without parsing), so no cheaper pre-merge proxy is being skipped · runner: Task 1.2's
  worker states it in the done report; the refiner eyeballs the diff at merge; gate-audit reads it
  SOFT.
- *(amendment 2026-08-15)* Task 2.1(a)'s schema-conditional enforcement probe — whether the `agent()`
  schema-validation layer actually enforces the required-when-escalate conditional, or the recorded
  prompt-side fallback arm landed instead · why deferred: the layer's behavior is empirical, outside
  this repo's code · runner: Task 2.1's worker runs the probe and records which arm landed in the
  done report; the suite row pins whichever observable landed; gate-audit reads the probe SOFT.
- *(amendment 2026-08-15)* End state 17's allowlist-byte-unchanged half (deny decisions unmoved,
  message text only) · why deferred: the deny-*decision* half is already commanded — the existing
  guard suite's deny cases (exit codes + which commands deny) are the mechanical floor and run as a
  gate member via `bash hooks/validate-auditor-git.test.sh`; the residual hand-read covers only the
  message-text-only *shape* of the diff (same language-aware classification as the `war-config.mjs`
  bullet above — no cheaper pre-merge proxy is being skipped) · runner: Task 2.2's worker states it
  in the done report; the refiner eyeballs the diff at merge.

## Notes / conscious deviations

1. **Construct-level collision census vs predecessor plan 3** (the stacking honesty). Plan 3's
   committed Task 1.1 slice edits, in `workflow-template.js`: the `doneWhenFloorClause` delimited
   span, the `MERGE_RESULT` schema block, the `MAKE_DONE_PASS` fix prompt, and the done-unmet
   exhaustion tail (`exhaustedDiag`); and in `workflow-template.test.mjs`: the "Done when threading —
   absent ⇒ '' (set-minus)" residue guard, the 'done-when floor threading (Task 2.3)' test (gate-anchor
   presence assert), the D3 registry's **done-when floor row** anchors (D13 tokens), and new
   baseline-proceed/capture fixtures. This plan edits, in the same files: the sweep-close arms, the
   per-task gate-audit `agent()` prompt (`mappedTestsLine` + the conjunctive clause), `authMappedLine`;
   and the 'mappedTests grep' / 'reporter-format premise' / 'authMappedLine twin' tests, the D3
   registry's **mechanical mapped-tests grep row** anchors, plus one new sweep-routing test. **Every
   pair is construct-disjoint.** The one shared construct is the D3 registry array itself: plan 3 grows
   the done-when row's anchors, this plan grows the mapped-tests row's anchors — different rows ~20
   lines apart, both leaving the exact floor-count assertion message untouched, so the serial rebase is
   clean and the merge order (plan 3 first) is enforced by the D10 witnesses, not by luck.
2. **Task 1.1's three-file + two-lesson footprint is forced, not preferred.** The same-file rule folds
   every `workflow-template.js` edit (routing + rescope + truncation) and every
   `workflow-template.test.mjs` edit (new test + extensions + registry anchors + premise hardening +
   consumer coupling) into one task each — and they are the same task because the D5 guards must travel
   with the prompt text they pin (drift-guard rule) and the both-surfaces law binds
   `agents/war-auditor.md` into the same commit as the dispatched-prompt change. The lesson stamps are
   file-disjoint riders on the task that lands their fixes (D12).
3. **The 1.2 → 1.1 deps edge is a content edge, not rule 7's guard-split case** — no mechanical guard
   is split across tasks (the banner pin's fact, resolveGate's composed string, exists at the frozen
   base). The edge exists because the D9 coupling note names the truncation clause Task 1.1 authors: at
   the frozen phase base the note would dangle. Plan 3's Note-1 precedent (edge over a
   defined-but-not-yet-emitted annotation); logged for /red-team ratification.
4. **Check sharpenings vs the spec (D13)** — knowing deviations, both tightenings: (a) End state 4
   pins the truncation clause primarily via the zero-hit `grep -F 'ABORTED'` token (the spec's
   `grep -l "truncated"` kept as a secondary floor) because a zero-hit-at-base token is a mechanical
   pin the spec's word-adjacent near-miss ("no truncation" in an unrelated roster comment) cannot
   fuzz; (b) End state 8 retires `caught downstream` outright (= 0) instead of the spec's "= 0 or
   qualified" disjunction — a mechanical OLD-absent check beats a hand-judged qualification.
5. **Part 1 corrects one spec claim** (survey-derived, Context 4): the spec's "no `*.test.*`
   references `setup.md` at the base" is false as stated — four OLD-absent/invocation-shape sweeps and
   a corpus list reference the file. True in substance (none pins the § `--afk` block or the header),
   which is what Task 1.3 relies on; the slice carries the introduce-no-swept-token duty.
6. **Contention honesty — same-file overlaps with non-predecessor siblings.** Sibling plan 5
   (`verdict-adjudication-integrity`) touches `war-config.test.mjs` (the enumerated `sweptSurfaces`
   lists — disjoint from the banner test this plan's Task 1.2 edits) and `CONTEXT.md` (entry rewrites +
   cold-home eviction with a `wc -c` target measured at its own land time — disjoint from this plan's
   two additive rows). No dependency either way; the roadmap serializes the plans (ADR 0011) and
   carries `## Shared-file contention` rows for both files. Budget interplay: this plan's ≤ ~450 B
   lands either side of plan 5's shrink — before it, plan 5's re-measure absorbs the delta; after it,
   CONTEXT.md may re-cross the warning-only advisory line by that margin (A7; plan 5's `wc -c` Done
   when is a one-shot merge check at its own land, not a standing test). **Roadmap-ordering hint
   (grill-ratified; a preference, never a hard edge):** sequence this plan BEFORE plan 5, so the
   glossary rows sit inside plan 5's re-measured shrink base and the batch does not immediately re-arm
   the advisory shrink signal plan 5 pays to clear. The trailing release-slot
   overlap with every sibling plan is the sanctioned stacked-release pattern, not contention.
7. **Downstream spine (verified quotes, Context 9).** `handoff-schemas-contract` declares it lands
   after THIS group; `structural-pin-extractors` declares a **binding** lands-after on
   `done-when-floor-wiring` AND this group. The roadmap must carry plan 3 → this plan →
   `handoff-schemas-contract`, and {plan 3, this plan} → `structural-pin-extractors` as
   dependency-spine edges, not merely contention rows.
8. **Posterity survivors.** Historical artifacts keep the retired wordings and are never retro-edited
   (ADR 0046 posture). Corrected per-token census (re-measured at the amendment base, replacing the
   conversion-time conflated list): "caught downstream" survives in
   `docs/plans/2026-07-07-target-repo-agnostic-execution.md`, this plan's own source spec
   `docs/specs/2026-08-06-gate-audit-finding-routing-design.md` (three hits), and this plan's own
   quotations; the old conjunctive clause survives in the
   `hard-trigger-narrowing-…` lesson body (present-tense defect prose survives the RESOLVED stamp
   by the repo's stamp convention), `docs/plans/2026-06-27-gate-audit-execution-evidence-…`, the
   source spec, and this plan; issues #1372/#1343 keep their verbatim finding quotes. Every OLD-absent check here is scoped to the single live surface its
   End state names — the engine prompt (End state 3), `setup.md` (End state 8).
9. **Intent provenance.** Part 1 and the intent block are distilled from the ratified source spec —
   itself synthesized from the code-verified lesson issues #1377/#1372 and the war-followup issue
   #1343; the spec's flagged [assumed] rows are carried as A1–A4/A6 with their fallbacks intact;
   conversion-time judgments (D10–D14, Notes 1–7) are logged for /red-team ratification.
10. **Amendment (2026-08-15, operator-directed): #1410 and #1412 folded as Phase 2.** Both are
    campaign-era auditor-behavior findings from run `2026-08-12-handwritten-date-flagging` (plugin
    0.17.0) landing squarely in this plan's family — `agents/war-auditor.md` verdict doctrine and
    the dispatched auditor prompt. A new phase (not new Phase-1 tasks) because Task 2.1's file set
    intersects Task 1.1's; a phase edge is the sanctioned same-file serialization. Deliberately
    deferred halves recorded in Non-goals (#1410 fix 3, #1412 fix 2). Amendment surfaces: header
    issue map, **Part 1 (Context 11's base census + the A8 ledger row + the registry-discipline
    Phase-2 exception — added at this plan's red-team, 2026-08-15)**, Phase 2 (Tasks 2.1/2.2), End
    states 13/15–17, build order, release blurb list,
    Non-goals. Cross-plan: Task 2.1 adds one row to `skills/war/references/schemas.md`, which plan 9
    (spine-later) rewrites — plan 9's workers rebase onto this landed row (stack-and-plow, roadmap
    contention table updated in the same amendment commit). Logged for this plan's /red-team pass.

## Open decisions

None. The spec's design tree is fully resolved; the spec-flagged veto points (A1 discard-arm symmetry,
A2 evidence-side fix, A4 glossary rows, A6 no-ADR) and every conversion-time judgment are logged above
for /red-team.
