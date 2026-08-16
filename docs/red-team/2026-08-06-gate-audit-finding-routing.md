# Red-team report — docs/plans/2026-08-06-gate-audit-finding-routing.md

- **Verdict:** ADJUDICATED (gate-emitted; ADR 0043 — every blocker patched and adjudication-rowed, not probe-re-verified)
- **Rounds:** 1
- **Date:** 2026-08-15 · **Round limit:** 3 (config `run.redteamRoundLimit`) · **routeUpstream:** false
- **Base:** live tip `7a3eb2a` (plan Part 1 measured at `6fff2ee`; predecessor `done-when-floor-wiring` LANDED — witnesses `done_when_log_path`=10 ≥ 1, `strictly stronger`=0 verified at the live tip)
- **artifactKind:** impl-plan (merged arm — Part 1 is its own source of truth)
- **Escape guard:** pre-run snapshot exit 0 (336 refs) · post-run `--baseline` exit 0 — no probe residue, no ref deltas

## Attack surface / Executed proof

14/14 probes on target, 0 dropped, 0 off-target: 6 spine lenses + 8 bespoke
(`endstate-vacuity-census`, `default-flip-old-absent`, `base-drift-recheck`, `unguarded-new-mirror`,
`guard-split-deps-edge`, `snippet-fidelity-anchors`, `phase2-amendment-integrity`,
`backstop-legitimacy`). 4 executed (sandboxed via `git clone --no-hardlinks`), 10 analyzed.
Every Critical/Major adversarially confirmed by an independent seat before counting.
Gate accounting: 73 raw findings → 30 blockers (all Major), 9 needsDecision, 36 minors.
Coverage-harness note: the first gate pipe read INCOMPLETE because the Lead's adapted probe schema
returned `read_anchor` as a string; all 14 anchors byte-matched the fingerprint title, so the
working copy reshaped them to the gate's `{plan_title, resolved_path}` object (and stamped `claim`
from `title` so dedupe keyed per-finding). Harness-side only; no probe content changed.

## Findings and resolutions applied (all patched in place, stamped `adjudicated: true`)

The 30 blockers + 9 needsDecision collapse to 8 roots. Every patch was re-measured at the base by
the Lead (new tokens verified zero-hit; the ES8 evasion re-proved) but not probe-re-run — hence
ADJUDICATED, never a hand-written CLEARED.

1. **ES15 vacuous** (12 blocker rows; executed + analyzed, confirmed). `grep -c 'escalate_reason'`
   ≥ 1 already passes on both prose surfaces at base (the *optional* forms `escalate_reason?` are
   exactly what the task retires). **Patch:** OLD-absent `grep -Fc 'escalate_reason?'` = 0 in each
   (1 each at base) + NEW-present `grep -Fci 'required when'` ≥ 1 in each (0 each at base); Task
   2.1 mandates the exact phrase "required when `verdict` is `escalate`" so a hyphenated variant
   cannot false-red the `-F` pin.
2. **ES16 vacuous half** (11 blocker rows; confirmed). `by construction` pre-exists in
   `workflow-template.js` (unrelated line-237 comment) and twice in the plan's own Part-1 prose —
   the "zero-at-base" claim was false. **Patch:** pin token → `however severe` (0 on both surfaces
   at base); slice's anchor guidance rewritten to name rejected candidates.
3. **ES3 undetectable rescope** (1 blocker + 4 minors; confirmed). The count-1 grep is 1 before
   *and* after — a preservation pin only. **Patch:** added the landing pin
   `grep -Fc 'governed by the MAPPED TESTS block above'` ≥ 1 (0 at base); slice notes the clause
   spans three concatenated `pt` literals.
4. **ES7 vacuous `timeout` grep** (1 blocker + 3 minors; executed, confirmed). Bare `timeout` has 3
   pre-existing hits outside the target test. **Patch:** exact-literal `grep -Fc 'timeout: 60_000'`
   ≥ 1 (0 at base); `run.error` half kept (already 0 at base).
5. **ES8 case-evadable retirement grep** (1 blocker; executed, confirmed — sandbox proved a
   sentence-initial "Caught downstream" passes `-Fc` while still present). **Patch:** check → 
   `grep -Fci` (the recorded retirement-grep-case-insensitivity lesson); Task 1.3's repo-wide sweep
   step made case-insensitive to match; Note 8's posterity list corrected per-token (the
   conversion-time list conflated the two retired wordings' carriers and omitted the source spec).
6. **Task 2.1's three new both-surfaces directives had no drift guard, and the registry-growth
   constraint forbade the fix** (2 blockers + 1 nd; confirmed). **Patch:** Pivotal constraint scoped
   to Phase 1 with a sanctioned Phase-2 exception; Task 2.1 now adds **one new D3 registry row**
   binding all three directives across both auditor surfaces and updates the floor count + its
   enumerating message in the same task (guard travels with fact; "floor equals true row count"
   preserved by moving both together).
7. **Task 2.1(a)'s fallback arm under-specified** (1 blocker + 2 nd; confirmed). **Patch:** both
   arms fully specified — primary: the schema layer's conform-or-retry loop (re-prompts, never
   drops, no new hold path; new ledger row A8 records the retry assumption, its blast radius, and
   the probe as its check); fallback: a MUST sentence on both prompt surfaces + the intake-contract
   suite row re-pointed at it (the pinned sentence IS the Lead-side observable — no engine edit).
   End state 15 holds under either arm.
8. **ES13/ES14 judged-tag defects** (2 blockers + 2 nd + 2 minors; backstop-legitimacy +
   intent-vs-plan). ES13's `HARD at audit_sha` tag was unjudgeable at any task tip (the
   `<phase-base>..<tip>` range doesn't exist there — the recorded each-commit-cites-its-issue
   lesson) and its enumeration omitted Tasks 1.4/3.1. **Patch:** retagged to a mechanical
   phase-close floor (`git log --format=%s <phase-base>..<tip> | grep -vc '#[0-9]'` = 0) + Lead-judged
   per-issue mapping over the full range; enumeration completed. ES14's "next free patch" half named
   no judge. **Patch:** split — version-slots suite (lock-step + monotonic floor) is the whole
   mechanical condition; the next-*free*-patch choice is Lead-checked at land (a property of the
   remote at land time, not the diff).

### Remaining needsDecision rows, self-adjudicated under the standing AFK directive

- **A6's check column held the remedy, not a check** → row restructured; ratified here: no ADR 0013
  amendment now, recurrence files it.
- **"No new hold path" vs schema rejection semantics** (2 rows, one confirm-refuted) → settled by
  the A8 retry-not-drop specification (root 7).
- **Discard-arm Critical/Major "still drop"** (confirm-refuted) → Purpose made precise: Minor/Nit
  route by disposition; Critical/Major keep visibility via re-approval blocking + the newly-pinned
  `polish-rejected`/`polish-discarded` auditLog entries.
- **Backstop 4 named no runner/timing** → runner (Lead of the first phase hitting the scenario) and
  timing (first live recurrence) named.
- **Backstops 5/7 "commandable-but-judged"** → justified and narrowed: the mechanical halves (the
  idempotence trio / the guard suite's deny cases) are already gate members; only the language-aware
  diff-shape hand-read is deferred.

## Adjudications

| # | Finding root | Ruling | Provenance |
|---|---|---|---|
| 1 | ES15/ES16/ES3/ES7 vacuous pins | Replaced with the Context-11 zero-hit token set; amendment census added to Part 1 | AI-declared (Lead re-measured at `7a3eb2a`, 2026-08-15) |
| 2 | ES8 case evasion | `-Fc` → `-Fci`, sweep step matched | AI-declared (evasion re-proved in sandbox) |
| 3 | Registry-constraint conflict | Phase-2 exception: new row + floor count/message move together in Task 2.1 | AI-declared |
| 4 | Fallback arm | A8 retry semantics + concrete two-part fallback | AI-declared |
| 5 | ES13 retag | HARD-at-audit_sha → phase-close floor + Lead-judged mapping | AI-declared (per recorded lesson) |
| 6 | ES14 split | Mechanical = version-slots suite; judged = next-free-patch at land | AI-declared |
| 7 | A6 no-ADR | Ratified: no ADR change; recurrence files the amendment | AI-declared |
| 8 | Purpose precision (discard-arm severities) | Parenthetical added; D1 scope unchanged | AI-declared |

No authoritative version literals were changed (release resolves at land time, per the plan).

## Residual risk (minors, auto-noted)

- ES4's exact counts (`ABORTED` = 2 / 1) are line-count arithmetic — a faithful worker adding the
  token in a nearby comment false-reds the check; accepted as the cost of the zero-hit-census
  discipline (the worker owns keeping the token scoped; two confirm seats judged the DRY-variant
  concern refuted).
- The `node --test` halves of End states 1/2/6/12/15 are green at base by construction — their
  non-vacuity rides the named new-test titles/observables, not the suite exit code.
- CONTEXT.md drifted 1 byte since the plan's snapshot (114,448 vs 114,449) — no consequence to A7.
- 5 of the 9 gate needsDecision rows were confirm-refuted findings force-retained by the
  `needsDecision` flag; each was nonetheless dispositioned above.
- Phase-2 construct census (minor): Context 11 now records the `AUDIT_VERDICT`/deny-message base
  facts; the fuller construct-existence census remains Phase-1-scoped.

## Verification trail

- Rounds seed 0 (no prior report for this slug); this run = 1 full grill sweep → **Rounds: 1**.
- Workflow run `wf_9b9cbd8c-05b` (57 agents, 0 errors); persisted evidence at the task output file
  (never edited); adjudication stamps applied to a working copy only.
- Final gate: `verdict: ADJUDICATED`, 14/14 on target, 0 unstamped blockers/needsDecision,
  `routeUpstream: false`, rounds 1/3.
