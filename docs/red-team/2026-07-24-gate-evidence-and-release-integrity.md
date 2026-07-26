# Red-team — 2026-07-24-gate-evidence-and-release-integrity

**Verdict: BLOCKED** (after 2 rounds). Terminal for this pass — the Lead has **stopped patching**
and is escalating the residual open questions below to the operator, per the ≤2-rounds-per-blocker
rule. Plan: `docs/plans/2026-07-24-gate-evidence-and-release-integrity.md` · Source spec:
`docs/specs/2026-07-24-gate-evidence-and-release-integrity-design.md` · `artifactKind`: `impl-plan`
· repo: dedicated worktree `_redteam-plan5` @ `93b1c2d` · Campaign plan 5 of 6.

## Why this stopped rather than continuing

Round 1 found 4 blockers over 3 roots. The Lead reproduced each, patched, and re-ran. Round 2 came
back with **5** blockers — and the majority were defects **the round-1 patch itself introduced**:

- a measurement the Lead got wrong (wrote "6 version values from 6 commits"; the real full-window
  figure is **49 from 50** — a `-n 6` sample mis-recorded as the window);
- a **causal claim that was simply false** — the Lead wrote that the *path filter* is what makes the
  `rev-list` mechanic return non-merge commits. Three independent probes measured otherwise, and the
  Lead then confirmed it directly: `git rev-list --first-parent -n 50 HEAD -- <slot path>` returns 50
  commits **all with 2 parents**, the same command without `--first-parent` returns 50 **all with 1
  parent**. **`--first-parent` is the discriminator, not the path filter.** The Lead's original
  sample simply omitted `--first-parent` and the effect was credited to the wrong cause;
- a **floor contradiction** introduced by ratifying an alternative that cannot satisfy the "ONE
  bounded git invocation" floor stated in the same paragraph;
- an **overstated citation** (`workflow-template.test.mjs:6692` was cited as pinning a plan-less
  phase that *claims End-state conditions*; that test carries no `endState` key, so it does not
  exercise the path described).

Two wrong Lead explanations in a row on one paragraph is the signal the rule exists for. Continuing
to self-patch would accumulate Lead errors into the plan rather than shed them. **The wrong text has
been withdrawn** (not replaced with a third theory) and the paragraph now carries the measured facts
plus an explicit "do not implement from this paragraph" marker.

## Attack surface

| round | run | probes | verdict | blockers / nd / minors |
|-------|-----|--------|---------|------------------------|
| 1 | `wf_7cfa48ca-b5b` | 15 (6 spine + 9 bespoke) | BLOCKED | 4 / 0 / 19 |
| 2 | `wf_a481e297-4c9` | 9 (6 spine + 3 bespoke) | **BLOCKED** | **5 / 1 / 11** |

33 agents, 0 errors, every round 100% on-target (no off-target, no dropped probes). Escape guard run
after both rounds; the only stray was the plan file itself — the one file `/red-team` may write.

## Resolved in round 1 (verified)

**`${plan.file}` in `endStateBlock` was a phase-level crash (Major → resolved).** The plan mandated
interpolating the plan path into the gate-audit prompt on the reasoning that "`endStateBlock` has
`plan` in scope". True but insufficient: `plan` is destructured with **no default** and is **never
entry-validated** (`workflow-template.js:231`) — which is exactly why `:484` reads
`if (plan) plan.gate = …` — and `endStateBlock` is built at **top-level, unconditionally** (`:1497`),
unlike the two existing `${plan.file}` reads that sit inside the work thunk where a throw degrades to
one task's `held:escalation`. `pt` throws on an undefined interpolated value by contract (`:191`).
So the bare form would take a plan-less zero-task phase from a clean route to `held:workflow-error`
**phase-wide**. Patched to the guarded `${(plan && plan.file) ?? '<unset>'}` at all three mandate
sites (prompt text, Task 1.2, the Notes grill-Q4 bullet — that last one found only by the Lead's own
propagation sweep, the same stale-copy pattern that cost the sibling plan three rounds), plus a
mandated regression test. Round 2 confirmed the substance; two Minors remain (below).

**The `--diff-merges` display-default hazard (Major → resolved).** All 50 slot-touching first-parent
commits on a campaign branch are merges, so the primary mechanic's entire signal rides git's
*implied* `--diff-merges=first-parent`. Suppress the implication and the same command yields **zero**
versions. Since `version-slots.test.mjs` runs in **every** refiner-dispatched gate, a zero-parse
would have bricked the gate campaign-wide. The flag is now pinned explicitly.

## Residual open questions — for the operator

1. **The `rev-list` + `git show` alternative: keep, fix, or drop?** Its correct form is
   `rev-list` **without** `--first-parent` (path filter is irrelevant to merge-ness), which
   contradicts the paragraph's own framing, and it cannot satisfy the "ONE bounded git invocation /
   never spawn per-commit" floor stated in the same sentence. Options: (a) drop it and mandate the
   single `git log --first-parent --diff-merges=first-parent` form; (b) keep it and restate the
   floor as "at most two bounded git invocations, never one spawn per commit". The Lead recommends
   **(a)** — the primary form is proven and one mechanic is one thing to get wrong.
2. **The four §4.4 sweeps still false-negate on a semantics-preserving line reflow.** Round 1 made
   them case-insensitive; round 2 reproduced reflow false-negatives against the **real landing
   sites** (e.g. reflowing `the only automated check` across a line makes sweep 1.1 report
   `memory-audit.yml` clean while the retired claim is still there verbatim). The anchors are
   multi-word clauses and hyphenated compounds; the Method rule the Lead added says "prefer the
   shortest stable mid-sentence token" but the four shipped commands were not shortened to comply.
   Needs each sweep re-anchored on a single short stable token, with a control proving the matcher
   fires.
3. **One of the spec's six §4.4 dispositions is owned by no task.** Only five of the numbered
   survey items map to a task slice; End state 9 nonetheless asserts all six are re-confirmed.
4. **needsDecision — the `agents/war-auditor.md` both-surfaces registry row (grill Q9).** Whether a
   D3-style byte-shared registry row is the right instrument for two deliberately different-format
   surfaces is unsettled in the plan's own Notes.
5. **Minor precision items:** End states 3 and 4 do not enumerate the new plan-less guarded-form
   regression case that Task 1.2 mandates; and the `workflow-template.test.mjs:6692` citation
   overstates what that test covers (no `endState` key ⇒ it does not exercise the End-state-claiming
   path).

## Adjudications

- **`${plan.file}` in `endStateBlock` MUST be the guarded form `${(plan && plan.file) ?? '<unset>'}`.**
  `plan` is never entry-validated and `endStateBlock` is top-level, so the bare form crashes a
  plan-less zero-task phase phase-wide via `pt`'s throw-on-undefined contract. The two existing bare
  `${plan.file}` reads at the worker dispatch sites are NOT precedent — they sit inside the work
  thunk where a throw is task-scoped. An auditor must not flag the guarded form as inconsistent with
  those sites — Lead-adjudicated 2026-07-25 (round 1, reproduced in source).
- **`--diff-merges=first-parent` is pinned explicitly on the primary monotonic mechanic.** Every
  slot-touching first-parent commit on a campaign branch is a merge (measured 50/50), so the mechanic
  depends entirely on that flag; git's implication of it is a display default the plan may not
  inherit silently — Lead-adjudicated 2026-07-25 (round 1, measured; `--diff-merges=off` yields 0).
- **`--first-parent`, not the path filter, determines merge-ness in a `rev-list` walk.** Measured at
  `93b1c2d`: with `--first-parent`, 50/50 commits have 2 parents; without it, 50/50 have 1 parent.
  Two earlier Lead statements to the contrary are withdrawn. Any surface still attributing this to
  the path filter is stale — Lead-adjudicated 2026-07-25 (round 2, Lead-verified after three probes
  independently corrected the Lead).

## Residual risk

- The plan is **not cleared**. `/war` must not execute it until the open questions above are ruled.
- The Lead's own verification greps and measurements were wrong three times across this plan and its
  sibling (a `-n 6` sample read as a window; a causal attribution; a line-wrap-blind sweep). Any
  re-verification of this plan should use multi-line-aware matching **and** a control that proves the
  matcher fires, and should re-measure rather than trust numbers recorded in the plan text.
