# Red-team — 2026-07-24-drift-guard-and-floor-diagnostic-hardening

**Verdict: CLEARED-WITH-NOTES** (round 4). Plan: `docs/plans/2026-07-24-drift-guard-and-floor-diagnostic-hardening.md`
· Source spec: `docs/specs/2026-07-24-drift-guard-and-floor-diagnostic-hardening-design.md`
· `artifactKind`: `impl-plan` · repo: dedicated worktree `_redteam-plan4` @ `b463695`
· Campaign plan 4 of 6 (`2026-07-24-standing-record-and-guard-hardening`).

## Attack surface

Four rounds, 58 agents, 0 errors. Every round 100% on-target (no off-target, no dropped probes).

| round | run | probes | verdict | blockers / nd / minors |
|-------|-----|--------|---------|------------------------|
| 1 | `wf_6a34d77e-bf2` | 16 (6 spine + 10 bespoke) | BLOCKED | 8 / 0 / 17 |
| 2 | `wf_f918fa65-012` | 11 (6 spine + 5 bespoke) | BLOCKED | 3 / 1 / 10 |
| 3 | `wf_d8cd0eb8-be5` | 9 (6 spine + 3 bespoke) | BLOCKED | 1 (×4 views) / 0 / — |
| 4 | `wf_0ddbc9b9-c2b` | 9 (6 spine + 3 bespoke) | **CLEARED-WITH-NOTES** | **0 / 0 / 5** |

`ff-topology` was included in round 1 despite the token floor finding no `--first-parent`/`^1`/three-dot
anchor: End state 5's "the phase diff shows no edit to X" and "the diff is exactly the one `printf`
line" are per-task diff claims, so the mandatory probe rode the prose match. It found no
topology dependency — End state 5 is checkable from the phase-level diff.

Escape guard (`assert-no-repo-escape.sh`) run after every round. Rounds 2–4 returned rc 1 whose
**only** stray was the plan file itself — the one file `/red-team` may write — verified by hand each
time. No probe escaped its sandbox.

## Executed proof

The central mechanisms were proven, not asserted:

- **FLOOR_SITE_RE re-anchor** — the plan's literal replacement regex was compiled and run against
  the live `workflow-template.js`: base `discovered=4 raw=4`; SIM A (inline head sharing a template's
  closing backtick) `4/5` RED; the well-formed-5th-site success mode `5/5` GREEN (not a red case);
  the fail-closed inline-backtick residual reds loudly via the per-site arms.
- **End state 3's row-scoping floor** — a case built to the floor was verified to go RED when *each*
  of `node_modules/`, `.git/`, `.claude/` is individually deleted from the advisory (round 3,
  `endstate3-floor-discrimination-r3`, 0 findings).
- **The re-scoped backstop** — verified end-to-end on both the plan's own replacement advisory and a
  plan-faithful rewording that drops the phrase entirely (round 4).

## Findings and resolutions applied

### Round 1 — four roots, every one reproduced by the Lead before patching

1. **SIM B's pinned position did not red the check it was pinned to exercise (Major).** The plan
   pinned SIM B as "a bare 5th head appended after the final template's closing backtick" and
   claimed the count cross-check reds. Measured with the plan's own proposed regex: that placement
   yields `discovered=5 raw=5` — **GREEN**. The re-anchored regex has no notion of enclosure; it
   scans to the next backtick *anywhere*, and **402 backticks follow the last floor site** (which
   ends at offset 143489 of 217006). Only at EOF does it read `4/5` RED.
   **Resolved:** SIM B re-pinned to "past every remaining backtick (end of source)" at all three
   sites (End state 2, Task 1.2 red proof, Notes). The mid-file behaviour became a **new third
   residual** the header comment must now enumerate: an unenclosed head followed by any later
   backtick is spuriously *discovered* with a junk capture, so the cross-check stays green and the
   red arrives via the per-site token arms — fail-closed and loud, never silent.
2. **A backstop that fails on correct work (Major).** The deferred sweep expected **zero**
   `pattern is wrong` hits, but the plan's own replacement advisory retains that phrase. See the
   Adjudications row — this bullet took three passes to settle.
3. **End state 3(ii) was partly vacuous (Major)** — the same guard-masking class this plan exists to
   fix. The fixture is `node_modules/x/foo.test.sh` and the near-miss listing prints each path
   verbatim, so a whole-stderr `grep -qF 'node_modules/'` passes regardless of the advisory:
   deleting that prefix from the advisory left the case fully GREEN. (Recorded
   `marker-completeness-check-needs-row-scoped-grep-not-whole-file-grep-c` class.)
   **Resolved:** assertions (ii)/(iii) are row-scoped to the extracted advisory row; (i) keeps
   whole-stderr scope.
4. **"The four presence anchors above the loop are untouched" was false (Major)** — there are
   exactly **two** (`environment-proceed`, `fully green`); the four are the loop's own entries this
   task replaces, making the instruction self-contradictory. **Resolved.**

Round-1 Minors folded in: the guard-contract row is **D5** *inside* the **D3** registry (D3 names
the registry, D5 the row — ambiguous rather than false, so both are now named); plan 2 landed
**three** locks (D19/D20/D21), not two; and D21 is a **second** `for (const [` presence loop, so the
survey's "only multi-token loop" claim was corrected with D21's disposition (arm-naming, no pairing
invariant, no correction needed).

### Rounds 2–3 — defects introduced by the round-1 patch itself

Round 2 confirmed every original root resolved (`advisory-rowscope-reverify` PASS/0;
`backstop-sweep-reverify` "ROUND-1 ROOT 2 IS RESOLVED"; three spine lenses PASS/0) and then caught
three incomplete propagations, all Lead-caused:

- **A stale phrase hid across a line break.** `two new locks` wrapped as `two\n  new locks`, so a
  single-line verification grep reported clean — the recorded
  `misattribution-pairing-spanning-two-lines-defeats-line-based-repo-grep` class. All subsequent
  sweeps used multi-line matching with a control proving non-vacuity.
- **End state 6 and End state 3 were never patched.** The task slices were fixed but the End states
  — which are what gate-audit actually checks — still carried the falsified absolute and the
  vacuous whole-stderr floor. Both now corrected.
- Two further patch-introduced Minors: Task 1.2 read "BOTH residuals" then enumerated three; and the
  round-1 backstop repair over-corrected by pinning `pattern is wrong`, a phrase End state 3
  explicitly frees as worker latitude.

Round 3's targeted probes both passed (`patch-completeness-r3`, `endstate3-floor-discrimination-r3`),
leaving one Major seen four ways — see Adjudications — plus three new Minors: the D18 header
comment's "all six presence anchors" count is falsified by Task 1.1's own edit and was not in its
mandated comment-edit list; the round-1 D3→D5 rename created a **namespace collision** with the
unrelated `D5-ratified` near-miss set from the *test-floor-target-repo* spec; and the fenced
replacement advisory contained `the gate's discovery` — an apostrophe inside a bash single-quoted
`printf` format string, which breaks the script (`bash -n` fails). All three resolved.

### Round 4 — CLEARED-WITH-NOTES, 5 Minors auto-fixed

1. **The retirement grep was case-sensitive** — reproduced by injecting a re-cased, re-positioned
   copy of the retired clause: the plan's grep returned **0** (false clean) while `-i` caught it.
   Every other retirement guard in the plan was already case-insensitive; this was the outlier.
   Now `grep -rin 'pattern is wrong for this repo' skills/war/assets/assert-test-in-diff.sh`.
2. **`grep -qF '--pattern'` is not runnable** — grep parses the leading `--` as an option terminator
   and exits 2, so assertion (iii) would red spuriously on correct work. The suite carries no
   file-local precedent to copy, so the `grep -qF -- '--pattern'` form is now spelled out.
3. **The contention table dropped a real edge** — spec §5 names two contention edges for
   `workflow-template.test.mjs`; the plan captured the downstream
   `gate-evidence-and-release-integrity` edge for `agents/war-auditor.md` but not for the test file.
   Added.
4. **A count word inside the rule warning about count words** — the new no-apostrophe rule justified
   itself with "taking 9 suite checks with it", a number matching no countable set in the live
   suite, two tasks after the plan's own "restate count-free" doctrine. Now count-free.
5. **Roadmap-side, not plan-side** — roadmap row 4 says plan 2 landed "two new locks"; the live tree
   and the plan both say three. Recorded as campaign bookkeeping; the plan's count is the accurate
   one and needs no edit.

## Adjudications

- **Deferred-validation advisory sweep — scope beats anchor.** The `Integrated-tip sweep re-check`
  bullet is authoritative in its round-4 form: the advisory sweep is **scoped to the single emitting
  file `skills/war/assets/assert-test-in-diff.sh`** and anchored there on the stable lead-in
  `if those ARE the mapped tests`, expecting exactly one such row *in that file*; the retirement
  check is `grep -rin 'pattern is wrong for this repo'` over the same file, expecting zero. This
  supersedes three earlier formulations, each of which failed on correctly-completed work: (a)
  "expect zero `pattern is wrong` hits" — the plan's own replacement advisory retains the phrase;
  (b) "expect exactly one `pattern is wrong` hit" — over-couples to bytes End state 3 explicitly
  frees as worker latitude, so a faithful rewording yields a spurious zero; (c) "expect exactly one
  `if those ARE the mapped tests` hit tree-wide over `skills/` + `hooks/`" — Task 1.3's own mandated
  row-extractor writes that literal into the test file, so correct work yields two (measured: 1 at
  base, 2 after Task 1.3). **The generalisable ruling: when a backstop counts occurrences of a
  literal, scope it to the single file that emits the construct — choosing a "better" literal does
  not close the class, and this bullet proved that twice.** An auditor must not re-litigate the
  scoped form against the superseded wordings — Lead-adjudicated 2026-07-25 (red-team rounds 1–4,
  each formulation reproduced before replacement).
- **SIM B placement is EOF, not "after the final template's closing backtick."** End state 2, Task
  1.2's red proof, and the Notes bullet are authoritative; the source spec §4.2's replay wording and
  the grill-Q6 "unenclosed" framing are superseded. "Enclosed in no template" does not imply "not
  discovered" — the re-anchored regex has no notion of enclosure. A worker must place SIM B past
  every remaining backtick, and must record the mid-file case as the third residual rather than
  treating it as a failed replay — Lead-adjudicated 2026-07-25 (round 1, measured: 5/5 GREEN
  mid-file vs 4/5 RED at EOF).
- **`D5` spans two namespaces in this plan.** The **D5 drift-guard registry row** (the read-only git
  guard contract, a row *inside* the D3 both-surfaces directive registry in
  `workflow-template.test.mjs`) is distinct from **row D5 of the *test-floor-target-repo* spec** (the
  ratified exclusion-free `near_miss()` set). Both designators are correct in their own namespace and
  every plan reference now names which. An auditor must not flag either as drift from the other —
  Lead-adjudicated 2026-07-25 (round 3).

## Residual risk

- **The deferred-validation bullet took four formulations to settle.** Its blast radius is bounded —
  it is a Lead-executed check at Phase-1 land, not a gate or a task deliverable — but the Lead
  should re-read and re-derive it at Phase-1 land rather than running it on trust.
- **Verification greps on this plan were fooled by line-wraps three times.** Use multi-line-aware
  matching for any sweep of this file, and pair it with a control that proves the matcher fires.
- Task 1.2's `deps: [1.4]` edge was probed (`deps-edge-feasibility`) and the wave-2 rebase-onto-
  integration-tip mechanism carries 1.4's merged output to 1.2's gate; the absence lock is born green
  there and would be born RED on the frozen phase base, as the plan states.
- The plan's fenced advisory and row-extraction idioms are reference shapes; exact bytes remain
  worker latitude within End state 3's checkable floors. The no-apostrophe rule and the `--`
  terminator are the two hard constraints on that latitude.
