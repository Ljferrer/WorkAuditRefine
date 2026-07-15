# Red-team report — 2026-07-15-campaign-state-anchor

- **Plan:** `docs/plans/2026-07-15-campaign-state-anchor.md`
- **Source spec:** `docs/specs/2026-07-15-campaign-state-anchor-design.md`
- **artifactKind:** `impl-plan` (per-task `Files:` under `## Build order`; not red-first)
- **Run:** 2026-07-16, campaign `2026-07-14-survey-debt` (plan 4 of 4), self-adjudicating under
  AFK. Plan authored in an operator-attended session (task_bd14d06a; `## Commander's Intent`,
  operator-form backstop heading).
- **Verdict:** **CLEARED** (round 2: 9/9 probes on-target, 0 blockers / 0 needsDecision /
  0 minors)

## Attack surface / executed proof

Two Workflow rounds (`wf_b5167fbf-fd0` BLOCKED → `wf_3f0afce8-2dd` CLEARED), model opus / effort
high, provision `[]`. Run against a dedicated worktree of the plan's own branch
(`rt-plan4-repo` @ `ba3dfda`) so probes saw the true base (v0.14.41 slots, materialized plan +
spec committed).

| Round | Probes | Executed / analyzed | Verdict | Outcome |
|---|---|---|---|---|
| 1 | 11 (6 spine + 5 bespoke) | 4 / 7 | BLOCKED — 1 blocker (Major, executed CONFIRMED), 3 minors | 3 plan patches (`6ac1fa4`) |
| 2 | 9 (6 spine + 3 re-verify) | 2 / 7 | **CLEARED** — 9 pass, 0 findings | — |

Coverage whole both rounds (onTarget == expected, no off-target, no dropped). `ff-topology`: not
triggered (token grep + hand-read — no merge-topology anchors). `unguarded-new-mirror`
(Lead-run): vacuous pass (no engine footprint). Escape guard: round-2 exit 0 (round-1 noise was
the campaign's own materialized files, since committed to the branch and removed from the Lead
checkout).

## Findings and resolutions applied

1. **BLOCKER (Major, executed proof, mechanics-proof):** the plan's mandated anchor guard
   `main=$(dirname "$(git -C "$root" rev-parse --path-format=absolute --git-common-dir
   2>/dev/null)")` + non-empty check **cannot deliver its own fail-open constraint** —
   `dirname` of a failed/empty command substitution returns `.`, never empty (proven on bash
   3.2.57), so in any non-git context the guard silently reassigns `root=.` and the hook scans
   relative to the process cwd. The spec §3 design table prescribes the same composed literal.
   **Patched:** Task 1 now mandates the two-step, failure-distinguishable form —
   `common=$(git -C "$root" rev-parse --path-format=absolute --git-common-dir 2>/dev/null) &&
   [ -n "$common" ] && root=$(dirname "$common")` — with the spec's composed one-liner
   explicitly rejected and the reason recorded in the slice. Round-2 re-verify proved the
   patched form correct in all five arms (worktree → main; main idempotent; non-git keeps a
   sentinel root; git-off-PATH keeps root; contrast proof: the old form still yields `.`).
2. **Three silent exits, not two** (anchor-check-hook + command-diff, two independent CONFIRMED
   Minors). The hook has a third pre-payload no-inject exit — empty-candidates (campaigns dir
   present but holding no `*/ledger.json`) — sitting between the plan's two named warning
   sites; a literal implementation would ship End state 3's warning with a coverage hole.
   **Patched:** the stranded-state probe is now ONE helper invoked at ALL THREE sites, plus a
   present-but-empty-campaigns-dir test arm that reds if the probe is wired into only the two
   original sites. Round-2 re-verify confirmed the three-site enumeration complete and the arm
   discriminating.
3. **Sentence-case drift-guard fragility** (executable-proof, CONFIRMED Minor). End state 6's
   new criterion used the case-sensitive `has` helper for the `main checkout` prose token — a
   benign re-casing false-negates it (the recorded
   `prompt-only-clause-grep-guard-must-tolerate-sentence-case` class; reproduced). **Patched:**
   `--git-common-dir` stays on the case-stable `has`; the prose rule asserts via a
   case-insensitive match; the existing survey+machine criterion's inherited fragility is noted
   as out-of-footprint (follow-up material, not silently fixed out of scope).

## Backstop-legitimacy (operator-form section)

Both entries legitimate (no AI-declared markers required — the heading is the plain
operator-ratified form):

- **Manual compaction smoke** — justified (an interactive session compaction is unexecutable by
  any task gate); runner + timing named (operator, first compaction of the next campaign-Lead
  session on the released plugin).
- **Operator cleanup of stranded/duplicated local state** — justified (uncommitted local machine
  state; no commit can land it); runner named (operator, immediately post-install). *Note: the
  enumerated cleanup list includes the symlink in `survey-corps-8cc638` — the workaround this
  very campaign installed; removing it is safe only after the released hook lands.*

## Adjudications

None — no operator volleys; no authoritative values changed. All three patches are AFK Lead
self-adjudications recorded above; the release phase stays directive-form (next free patch above
the live base — 0.14.41 at branch cut).

## Residual risk

- The spec's §3 composed-literal row still shows the rejected form — deliberately untouched
  (point-in-time design record; the plan's slice carries the correction and its reason, the same
  statement-of-drift posture as its Notes take for the 2026-07-03 spec).
- The existing survey+machine anchor criterion in `war-pipeline-structure.test.sh` carries the
  same case-sensitivity fragility the plan fixes for its new criterion — out of this plan's
  footprint; follow-up candidate.
- The plan's Notes consciously lock the cwd→main-checkout behavior flip with hook tests rather
  than an OLD-absent doc gate (sole old-contract surface is the 2026-07-03 spec, kept as
  historical record; the ADR 0016 amendment carries the supersession) — adjudicated adequate
  under ADR 0025.
