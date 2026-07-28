# Red-team report — 2026-07-26-standing-doc-and-remedy-truth-sweep

**Verdict: CLEARED** (after 13 blockers, 3 needsDecision and 14 minors were patched into the
plan, re-verified, and a second round of 6 patch-induced contradictions was found and fixed;
no residual open questions).

- **Plan:** `docs/plans/2026-07-26-standing-doc-and-remedy-truth-sweep.md`
- **Source spec:** `docs/specs/2026-07-26-standing-doc-and-remedy-truth-sweep-design.md`
- **Base:** `4afa174` (`dev/2026-07-26-auditor-guard-policy-and-mirror-truth` tip — plan 4
  stacks on plan 3 per ADR 0011)
- **artifactKind:** impl-plan · **Run:** Workflow `wf_126a3e4e-b79`, 21 agents, redteam opus/high
- **Sandbox:** detached worktree at the base; escape guard clean (exit 0); probe-ref sweep clean.

## Attack surface / Executed proof

12 probes, 12 on-target, 0 dropped, 0 off-target: 6 spine lenses + 6 bespoke (snippet-fidelity,
vacuous-reword-route, presence-lock-feasibility, comment-only-mechanical-form,
default-flip-old-absent, unguarded-new-mirror). 5 executed in throwaway sandboxes, 7 analyzed.
Gate: **0 pass / 8 fail / 4 warn** — this plan was materially staler than its campaign
siblings, because two sibling releases landed against its primary target between authoring and
dispatch. `ff-topology` not derived (zero merge-topology anchors — token grep plus hand-read).

## Findings and resolutions applied

**1. Major ×4 — the #1153 README anchor no longer exists.** The plan attested "every anchor
re-verified live" and targeted a `**0.14.63**` blurb with two overclaim sentences. At base the
blurb is `**0.14.66**` and both greps print 0: `## Status` is a replace-in-place slot and
0.14.64/0.14.65/0.14.66 superseded the paragraph — the last of those landed by *this campaign*
hours earlier. **Resolution:** preamble attestation rewritten to record the anchor as gone with
the measured evidence; End states 1–2 restated as already-satisfied-at-base with Task 1.1's
Vacuous-reword route promoted from contingency to **primary** route; End state 2's second
clause made conditional so it cannot be stranded; every `**0.14.63**` literal marked
non-authoritative.

**2. Major ×3 (needsDecision) — Task 1.3 mandated a *new* false comment.** End state 5 required
the reworded banner comment to state "file-global-monotonic numbering with the
lessons-learned-seed banner as the sole restart", and the task slice contradicted itself in the
same sentence ("this banner also restarts at (1)"). Walking the live file: six banners run
(1)…(21) monotonically, the seed banner (~L278) resumes at **(17)** — the source of the 17–21
collision the comment cites — and the banner being edited (~L399) starts a fresh **(1)** run, a
second, unmentioned collision. So both the original comment *and* the drafted replacement are
false. A truth sweep may not ship a fresh false generalization. **Resolution (self-adjudicated
under AFK on reproduced evidence, re-walked independently):** End state 5 and the task slice
both now mandate the measured convention — numbering continues across banners with **two**
sanctioned backward jumps, each named — with no terminal count literal pinned, and the worker
instructed to re-walk at its own base.

**3. Major — the three `requiresTest:false` tasks' grep floors are their only coverage and
false-negate.** Each is a case-sensitive, exact-string, line-oriented absence check that prints
its pass value on a copy where the false claim survives re-cased or reflowed across a line —
the recorded sentence-case false-negative class, reproduced against the real landing sites.
**Resolution:** End states 1, 2, 4, 5, 6 converted to case-insensitive (`grep -cin` / `grep
-in`), single-token where a multi-word phrase was reflow-fragile; Task 1.2's own inline floor
fixed to match.

**4. Major — End state 7's `grep -c 'mixed-source' ≥ 2` binds nothing about placement.**
`grep -c` counts matching *lines*, so a §2-only edit whose clause wraps the token onto two lines
satisfies the floor with §3 entirely un-migrated — reproduced in the sandbox. **Resolution:**
replaced with two placement-bound region greps (§2 bullet region contains `mixed-source` and
`every phase`; §3 region contains `mixed-source`), both case-insensitive; Task 1.5's slice
updated in both places that restated the retired count.

**5. Major (needsDecision) — Task 1.2 ships a new unguarded cross-ADR prose mirror.** Its "no
new lock needed — ADR text is not test-pinned" rationale is false: ADR 0040 §B already carries
the fact, so the new two-site clause is a mirror by construction and ADR 0025 binds.
**Resolution:** guard shipped — but assigned to **Task 1.6**, which already owns
`skill-doc-contracts.test.mjs`. Adding that file to Task 1.2 would have collided with 1.6 and
rebase-conflicted at the serial merge, and deps/waves may never dodge a same-file collision.
The two tasks are in the same phase and wave, so mirror and guard still land together. Recorded
in the plan as a deliberate, adjudicated deviation from "same task" to "same wave".

**6. Minors (14)** — including two count-word defects of the exact class this plan's own
authoring checklist bans: "three test assets" (four are in the Files lists) and a
"7-recurrence / 8th recurrence" family count that the live lesson records at ten instances, the
newest being this campaign's own 0.14.66 release. Both delinearized to non-literal phrasing.

## Second-round re-verification

A read-only re-verify pass over the patched plan confirmed all six resolution clusters and
caught **six contradictions introduced by the patches themselves** — two Notes/slice bullets
still asserting the retired "no new lock" rationale, two Task 1.5 restatements of the retired
`≥ 2` floor, one case-sensitive straggler, and two stale "corrected 0.14.63 blurb" claims plus
a line-wrapped "8th recurrence". All six fixed and re-swept to zero. It also independently
re-walked the banner numbering and confirmed the new description matches reality, and proved
the seven Phase-1 tasks remain **pairwise file-disjoint** across nine distinct paths after the
guard reassignment — the load-bearing check for the one-wave decomposition.

## Backstop-legitimacy check

Three entries, all PASS: checklist efficacy (semantic by design, no mechanical lint; runner =
Phase 2's Task 2.1 blurb + its `execution-evidence` gate-audit), #1136 crash-window residual
(engine-adjacent scope this zero-behavior-change sweep excludes; runner = `/aftermath` files a
residual follow-up at campaign close), #1107 rule exercise (single-sourced prose with no
mirrored fact to drift-guard; runner = the next `/war-review` over a mixed-envelope run). Each
names a concrete deferral reason plus runner and timing. Heading is the operator-ratified plain
form — no AI-declared marker applies.

## Drift-guard spine probes

- `unguarded-new-mirror`: **FOUND ONE** — finding 5 above; guard now ships in the same wave.
- `default-flip-old-absent`: **FOUND TWO** — findings 3 and 4 above (case-blind absence checks;
  placement-blind count). Both gates now check OLD-absent per surface.

## Residual risk

- The #1153 issue closes on the checklist + presence lock alone; its two original overclaim
  sentences were fixed by attrition rather than by this plan. The closure text says so.
- Comment rewords (#1146, #1152) remain undrift-guarded by design (spec §3) — accepted.
- Task 1.6 now carries two unrelated duties (its own D22 undo arm plus Task 1.2's mirror
  guard). Slightly heavier than drafted, but it is the only file-legal home.

## Adjudications

| # | Delta | Ruling | Route | Moment |
|---|-------|--------|-------|--------|
| 1 | #1153's README anchor gone at base (two sibling releases superseded the blurb; both overclaim greps print 0) | Vacuous-reword route promoted from contingency to PRIMARY; preamble attestation corrected; End states 1–2 restated as already-satisfied with End state 2's second clause made conditional; no `0.14.63` literal authoritative | Preamble · End states 1–2 · Task 1.1 · Notes closure text | red-team, 2026-07-27 |
| 2 | End state 5 mandated a replacement comment that is itself false ("file-global-monotonic", "sole restart") | Retired both claims; mandated the measured convention (numbering continues across banners; TWO sanctioned backward jumps — seed banner resumes at (17), edited banner restarts at (1)); no terminal count literal; worker re-walks at base | End state 5 · Task 1.3 slice | red-team, 2026-07-27 |
| 3 | The three `requiresTest:false` tasks' grep floors are case-sensitive and reflow-fragile — and are those tasks' only coverage | Converted End states 1/2/4/5/6 and Task 1.2's inline floor to case-insensitive, single-token where reflow-fragile | End states 1,2,4,5,6 · Task 1.2 slice | red-team, 2026-07-27 |
| 4 | End state 7's file-wide `grep -c 'mixed-source' ≥ 2` is placement-blind (a §2-only edit satisfies it) | Replaced with two placement-bound region greps, case-insensitive; Task 1.5's two restatements updated | End state 7 · Task 1.5 slice | red-team, 2026-07-27 |
| 5 | Task 1.2's new ADR 0019 ↔ ADR 0040 §B two-site clause is an unguarded prose mirror ("no new lock" rationale false) | Guard REQUIRED (ADR 0025) and assigned to **Task 1.6**, the owner of `skill-doc-contracts.test.mjs` — file-disjointness is the stronger constraint and forbids Task 1.2 touching it; same wave, so mirror and guard land together. Deliberate, recorded deviation from "same task" to "same wave" | End state 4 · Task 1.2 slice · Task 1.6 slice · Notes | red-team, 2026-07-27 |

## Execution outcome (2026-07-27)

Appended after the run, never edited in place — the rows above record what was adjudicated at
red-team time and stand as written. This section records what execution then proved.

**Adjudication 5's "same wave" reasoning was insufficient, and it cost the run an escalation.**
The ruling assigned Task 1.2's new ADR 0019 ↔ ADR 0040 §B mirror guard to Task 1.6 (correctly —
file-disjointness forbids Task 1.2 touching `skill-doc-contracts.test.mjs`) and justified the split
on the grounds that both tasks sit in the same wave, "so mirror and guard land together." They do
land together. They do not *build* together: every task worktree in a phase is cut from one frozen
phase base at the Provision barrier, and waves order only *when* workers run, never *what base they
see*. Task 1.6's guard therefore asserted a clause that did not yet exist in its own base, and was
red there by construction — 992 tests, 991 pass, 1 fail. Task 1.6's worker ran the self-confound
gate, reproduced the failure, proved the remedy, and returned `PLAN-DEFECT`.

**No `deps` edge was ever applied.** All eight tasks landed with `deps: []` (verified at `5c46597`),
and the plan's Build order line still reads "one wave, no deps". The Lead resolved the escalation a
different way: the war-refiner rebased Task 1.6 onto the integration tip after Task 1.2 merged, at
which point the gate went green including the D25 row and the land CAS succeeded on the first
attempt. No rework, no plan amendment — which is precisely why the plan text still carries the
reasoning this section corrects.

**The correct remedy for the general case is a real `deps` wave edge** from the guard task to the
task authoring the fact it guards. That is the decomposition rule's own answer for a content
dependency, and it is *not* the forbidden "deps to dodge a same-file collision" — the two tasks here
are genuinely file-disjoint. A rebase is a valid one-off recovery, not a substitute for the edge.

**Provenance note.** The Lead's servitor dispatch prompt for this phase asserted that a
`deps: ["1.2"]` fix had been applied during execution. It had not. The servitor checked the landed
plan and this report, found `deps: []` on every task and the "same wave" text still in place,
refused to record the unverifiable specific claim, recorded only the architecture-verified general
rule, stamped the lesson `agent-unverified`, and flagged the discrepancy in the lesson body. That
stamp and flag are correct and are deliberately left as written.
