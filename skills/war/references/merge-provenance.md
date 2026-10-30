# Merge provenance — evicted from `agents/war-refiner.md` (ADR 0042)

Read this file when merging a task (the card's `## merge-task` trigger pointer names it). Every task merge is one `--no-ff` merge commit made with the dispatched two-step form, `git -c core.hooksPath=/dev/null merge --no-ff --no-commit <task-branch>` then `git -c core.hooksPath=/dev/null commit --no-verify -m "<subject>" --trailer "WAR-Task: <task-branch>"`: the engine confirms it by its parents [snapshot base, rebased task tip], the rebased ancestry, tree equality with the task tip and the exact trailer (#2485 D8, D9, D10). The sentences below moved here byte-identical from `agents/war-refiner.md` at eviction time; each still speaks in the card's own voice, and its step numbers resolve against the card's `## merge-task` steps.

## Evicted merge-task sentences

Step 1 (the rebase):

The rebase is not idempotent in cost, only in effect, and this slot sits inside the integration lock.

Step 2 (the gate):

(The scope-hook meta-test is hermetic to this via Task 1 (#95a) — the worktree-scope case 11 fix — which eliminates the false-fail regardless of where scratch dirs land.)

a `gate_failed` is then classified (step 3) and returned as a **soft** escalation for `introduced`/absent — not a fix-worker loop at this site; an `environment` class earns ONE environment-proceed re-run and hard-escalates at the merge site when that retry is spent (step 3)

Step 4, exit 0 (the mapped tests):

(the post-merge gate-audit pass greps them against the captured gate log — D7, the mechanical "provably unrun mapped test" evidence; absence from the log is HARD only where the log enumerates test file paths, SOFT cannot-confirm elsewhere)

Step 4, exit 1 (the near-miss diagnostic):

It is fail-open advisory context — the Workflow threads it into the add-test fix prompt and the exhaustion escalation, and never routes on it.

Step 9 (the gate log artifact):

Use the exact `mktemp` prefix supplied in the dispatch (`<dispatch>` is engine-minted). Create `.war/` before allocating the directory. Return the actual absolute `gate_log_path` on incomplete results too; only a SEGMENTED continuation may reuse that returned path.

Step 5, exit 2 (the packaging floor's git error):

A transient bad-ref must never be misclassified as unpackaged and spin a pointless fix-worker — this exit-1-vs-2 distinction mirrors the step-4 discipline.

Step 6, exit 2 (the submodule floor's git error):

A transient bad-ref must never be misclassified as submodule-blocked — this exit-1-vs-2 distinction mirrors the step-4 discipline.

Step 8, exit 2 (the done-when floor's git/env error):

A transient git/env error must never be misclassified as done-unmet and spin a pointless fix-worker — this exit-1-vs-2 distinction mirrors the step-4 discipline.
