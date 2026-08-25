---
name: merge-task-dispatch-forced-early-return-mid-gate-is-incomplete-not-gate-failed
description: "A merge-task dispatch forced to return before its spawned gate (node --test + the *.test.sh discovery loop) finishes is INCOMPLETE, not gate_failed/introduced — the rebase it already completed is idempotent and safe to leave alone; re-dispatch the same branch to let the gate run to completion, never treat the partial run as a real classification"
metadata:
  promoted: dev/2026-08-06-gate-audit-finding-routing@phase-1
  type: project
  provenance: agent-unverified
  slug: merge-task-dispatch-forced-early-return-mid-gate-is-incomplete-not-gate-failed
  phase: 2026-08-06-gate-audit-finding-routing/phase-1 task 1.4 merge-task escalation (dev/2026-08-06-gate-audit-finding-routing)
  keywords:
    - merge-task
    - forced early return
    - gate still in progress
    - background process
    - INCOMPLETE
    - not gate_failed
    - rebase idempotent
    - re-dispatch
    - refiner escalation
    - land-decision classification
    - shell-test discovery loop
    - full gate over 10 minutes
    - node --test skills/**/*.test.mjs
    - GATE_EXIT marker
    - run_in_background
    - backgrounded gate dispatch
    - land dispatch tool timeout
    - self-misclassifying error MergeResult
    - verify merge commit parents not re-merge
  tags:
    - refine
    - land
    - escalation
    - gate
  created: 2026-08-15
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-25T08:17:39.476Z
---

# A merge-task dispatch cut off mid-gate is INCOMPLETE, not a real gate_failed/introduced verdict

**What happened (agent-unverified — the refiner's own escalation report, task 1.4,
`2026-08-06-gate-audit-finding-routing` phase 1; the named gate-discovery construct is
code-verified present at the landed tip, see Locate cue):** a `merge-task` dispatch for
`war/2026-08-06-gate-audit-finding-routing/p1-1.4` completed hygiene re-attach, the
submodule-mutation check, and a clean `git rebase` onto the integration tip with **no
conflicts**. It then dispatched the composed gate (`node --test 'skills/**/*.test.mjs' && for f in
$(find . -type f -name '*.test.sh' ... | sort); do bash "$f" || exit 1; done`) — the node half
passed, and the shell-test discovery loop was mid-run (last observed:
`hooks/validate-worktree-scope.test.sh`, ~1405 lines of PASS output, zero failures seen) when the
dispatch was **forced to return before the gate finished** — the background gate process (a real
PID) was still running. No merge or push had been attempted; `_refinery` was untouched at the
integration tip; the rebased task branch sat rebased-but-unmerged in the task worktree.

**The rule:** a forced-early-return escalation of this shape — clean rebase already completed,
gate dispatched and observed passing so far but not yet exited — carries **no real gate_failed or
introduced classification**. Nothing failed; the run simply did not finish before the dispatch's
own return deadline. The correct handling is: (1) do **not** score this as a gate failure or a
regression the task introduced; (2) a follow-up `merge-task` dispatch for the same branch should
**re-run the gate to completion** rather than trust the truncated partial output; (3) the
already-succeeded rebase does **not** need to be repeated — re-running `git rebase` on an
already-rebased, conflict-free branch is a safe no-op (nothing to replay), so the follow-up
dispatch can skip straight to (re-)running the gate and, if green, proceeding to the merge.

**Why it matters:** a Lead or automated retry logic that pattern-matches on "escalation reason:
error" without reading the escalation `detail` payload risks either (a) wrongly demoting the task's
gate status to failed/introduced when nothing actually failed, or (b) wastefully re-running the
rebase step when it already succeeded and rebasing an up-to-date branch is a guaranteed no-op. The
escalation payload's own prose ("NO merge or push has been performed... nothing here should be
treated as a real gate_failed/introduced classification: this is an incomplete run, not a
failure") is the authoritative signal to trust over any downstream status inference.

## Locate cue

The gate's shell-test discovery loop (`for f in $(find . -type f -name '*.test.sh' ...) ... do
bash "$f" || exit 1; done`) is code-verified present in `skills/war/assets/war-config.mjs`
(`resolveGate`'s bash half) at the landed tip `20816fd0412788ba11412356f5471f6b1447d682`
(gitdir physical path containing this plan's slug:
`<repo-root>/.claude/war-worktrees/2026-08-06-gate-audit-finding-routing-2026-08-15/_refinery/`).
`hooks/validate-worktree-scope.test.sh` also exists at that tip.

## Recurrence 1 (2026-08-17, plan `2026-08-06-war-strategy-mirror-guards`, phase 1, task 1.2
merge-task escalation, `agent-unverified` — the refiner's own escalation `detail` payload)

Same shape, same repo, a different task/branch (`war/2026-08-06-war-strategy-mirror-guards/p1-1.2`):
hygiene re-attach, submodule-mutation check, and a clean single-commit rebase onto the integration
tip all completed with no conflicts; `requiresTest:false`/`requiresPackaging:false` floors were
correctly skipped; the gate (`node --test 'skills/**/*.test.mjs' && for f in $(find ... -name
'*.test.sh' ...) do bash "$f" || exit 1; done`) was then launched in the task worktree with a fresh
outside-worktree `TMPDIR` and ran **over 10 minutes** without reaching a `GATE_EXIT` marker — this
repo's full gate is now 1000+ Node subtests plus ~150 shell suites, so a >10-minute wall time before
completion is an expected size, not evidence of a hang. All observed `node --test` output up to the
forced return was passing (zero red assertions seen), but no exit code was captured, so no
`gate_failure_class` could be assigned and nothing was merged or pushed. The escalation's own
recommendation matches the original rule exactly: re-dispatch the same branch — the rebase state can
be re-verified (or harmlessly re-run as a no-op) and the gate re-run with a longer time budget before
attempting the merge.

**Reinforces the rule with a sizing data point:** as this repo's gate suite grows, a single
merge-task dispatch's time budget will increasingly be shorter than one full gate run — this is now
observed on two independent tasks across two plans, three weeks apart, so a forced-early-return
`error` escalation with a clean-rebase + gate-still-running `detail` payload should be treated as the
**expected**, not exceptional, outcome for a merge-task dispatch late in this repo's life, and
handled purely by re-dispatch — never by demoting to a real `gate_failed`/`introduced` verdict or by
re-running the (already-idempotent) rebase step.

## Recurrence 2 (2026-08-20, plan `2026-08-19-realized-absorb-rate`, phase 2, merge-task
escalation, `code-verified` — landed tip `7cacd59` on `dev/2026-08-19-realized-absorb-rate`):
**confirms the rule via a clean recovery.** A merge-task dispatch self-reported the documented
INCOMPLETE case — the full gate outlived its turn budget after 1600+ observed green lines, no
`GATE_EXIT` marker reached. The Lead re-dispatched the *same* merge-task per this lesson, this time
with explicit instruction to background the gate (`run_in_background`) and end the dispatch's own
turn rather than block on it live, letting the harness re-invoke and read the backgrounded result.
That re-dispatch merged clean on the next pass — no gate failure, no repeated rebase, exactly the
predicted outcome. **Effective remedy for future recurrences:** when re-dispatching a merge-task
after this exact INCOMPLETE shape, instruct it to launch the gate in the background and return
immediately (rather than waiting synchronously inside one turn), so the harness's own re-invocation
cadence — not the single dispatch's turn budget — is what has to outlast the full-suite runtime.

## Recurrence 3 (2026-08-24, plan `authoring-side-verification`, phase 3, LAND-side twin —
`code-verified` the routing mechanism at landed tip `783bd136ea6a9d8da9b73b5dcbf01d1d475a0cef`,
`agent-unverified` the incident narrative itself — the Lead's own recovery account, no separate
audit-log record of the dead dispatch):

Same shape one stage later in the pipeline — a **land** dispatch (not `merge-task`) hit the same
tool-timeout wall. Its foreground gate exceeded the ~2-minute dispatch tool timeout, so it
backgrounded the gate and was forced to emit `StructuredOutput` before any `GATE_EXIT`/exit-code
line existed. Because a land dispatch's schema has no "still running" verdict, it emitted
`MergeResult` `status: "error"` carrying a **self-describing narrative** ("incomplete/interrupted,
not a genuine error") — the engine's routing has no narrative-parsing step, so the bare `status`
value alone drove it to `held:land-failed`.

**New sub-lesson this recurrence adds (the LAND-side twin of the original merge-task rule):** (a) a
land-stage gate that outlives the dispatch's own tool timeout produces a **self-misclassifying**
`error` `MergeResult` — the `status` field is not trustworthy in isolation; the narrative text in
the same payload is the actual signal, and a Lead (or automated router) must read `gate_output`/the
escalation detail before treating `status: "error"` as a real failure. (b) The **merge commit a dead
land dispatch leaves behind in `_refinery` can be exactly correct and reusable** — the dispatch had
already created the merge commit before being cut off. Recovery is [[resume-and-recovery.md]]'s
already-landed-probe idiom applied one level in: verify the existing merge commit's **parents**
(origin tip + integration tip) match expectation, **re-run the already-resolved gate green** in
`_refinery`, then do **one** `land-advance` + follower sync — never re-run `--no-ff merge` on top of
a dead dispatch's commit, which would mint a phantom duplicate merge (same failure shape as
re-merging after a `held:land-failed` probe holds, see
[[never-follow-resumefromrunid-hint-after-a-land-failure]]).

**Locate cue:** the already-landed-probe idiom (`git merge-base --is-ancestor <merge_sha>
<integration_branch>`) is code-verified present in `skills/war/references/resume-and-recovery.md`
(row A, "ledger ahead") at the same landed tip. The land dispatch's own tool-timeout/backgrounding
shape is not itself a named code construct — it is a harness/tool-runtime behavior, not a
repo-owned mechanism, so this half stays `agent-unverified` (the Lead's recovery narrative).

## Related

[[never-follow-resumefromrunid-hint-after-a-land-failure]] — same family of "gate recovery choice
must be driven by the specific failure/incompleteness reason, not a generic status label"; this
phase (2026-08-24) is also a confirming recurrence of that lesson via the same incident.
[[wave-loop-thunk-catch-prevents-null-result-infinite-redispatch]] — a related dispatch-robustness
concern in the same Refine/merge machinery.

> archived 2026-08-17: resolved — moved to archive (still recurring and confirming as of 2026-08-20
> and 2026-08-24 (land-side twin); left in archive since war-memory temperature moves are its own
> job, not the servitor's)
