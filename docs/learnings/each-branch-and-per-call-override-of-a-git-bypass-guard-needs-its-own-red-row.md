---
name: each-branch-and-per-call-override-of-a-git-bypass-guard-needs-its-own-red-row
description: A row suite for a git bypass guard stays green under a narrowed tag class or a dropped override unless each branch has its own fixture
metadata:
  node_type: memory
  type: project
  keywords:
    - git bypass guard
    - assume-unchanged
    - skip-worktree
    - ls-files -v tag
    - both flags s tag
    - C-quoted path
    - ls-files -z
    - fsmonitor oracle
    - per-call oracle
    - shim failure arm
    - mutation survivor
    - vacuous row
  provenance: agent-unverified
  slug: each-branch-and-per-call-override-of-a-git-bypass-guard-needs-its-own-red-row
  phase: 2026-10-26-fingerprint-hook-followups/phase-1 task 1.1
  tags:
    - war
    - hooks
    - testing
    - git
    - fingerprint
  created: 2026-10-27
  originSessionId: a0630eb5-4cbe-4285-9e36-47dec6a15717
  modified: 2026-10-27T07:19:13.071Z
---

# Give each branch and each per-call override of a git bypass guard its own red row

**Rule.** When you add a guard against a git change-detection bypass, list every way to narrow the guard. Check that one row goes red for each. Audit seats found four narrowings that the first row set left green.

**Note on provenance.** The audit finding was resolved in a fix round before land, so this is recorded as a pattern, not a live instance. The seats traced each gap by deleting the construct in their heads. They did not run the mutations. The closing rows do exist at landed tip 06ef13c17545 on `dev/2026-10-26-fingerprint-hook-followups`, read through the run-scoped `_refinery` worktree (its HEAD equaled the tip).

**The four survivors (task 1.1, all closed before land):**

1. **Tag class.** The hook flags a path when `git ls-files -v -z` tags it with a lowercase letter or `S`. A path with both `--assume-unchanged` and `--skip-worktree` gets the tag `s`. The first rows covered the `h` tag and the `S` tag only. Narrowing the case arm to `h\ *` would have stayed green. The row "a both-flags (assume-unchanged and skip-worktree) edit escalates" now covers `s`. An oracle row before it proves that `ls-files -v` prints `s bo`.
2. **Output encoding.** Plain `ls-files -v` C-quotes a name that holds a double quote, so it prints `h "q\"z"`. The hook reads the `-z` form, which carries the name raw. The first fixtures used plain names, so a switch to newline output would have stayed green. The row "an edit to a flagged path whose name needs C-quoting escalates" now covers it, behind an oracle that greps the quoted plain output.
3. **Error exit.** `fingerprint` returns 1 when the `ls-files` call exits non-zero and is not a timeout. The test shim's `ls-files` arm first handled `SHIM_SLOW` only. Dropping the exit check would read an `ls-files` error as an empty flagged set, which reopens the hole the guard closes. The arm now honors `SHIM_FAIL`, and the row "a failing git ls-files call is a git error, never an empty flagged set" pins it.
4. **One oracle for two guarded calls.** The fsmonitor row says a configured `core.fsmonitor` command never runs. Its first oracle ran a plain `git status` only. Nothing showed that a plain `git ls-files` runs the hook, so the row could not go red when the `ls-files` override was missing. The oracle now also runs a plain `ls-files` after it resets the sentinel. `ls-files` writes no index, so the later rows see the same state. The first run against the old hook showed six FAIL rows, but the old hook made no `ls-files` call, so that run covered the status half only.

**How to apply.**
- Write one fixture per arm of a case filter, and one the other arms cannot satisfy.
- Pick one name that only one output encoding handles.
- Give the shim a failure arm for every new git call, not only a slow arm.
- Write an oracle for each guarded call, before the behavior row, independent of the hook. The oracle must show that the plain, unguarded form of that call does the bad thing.

**Locate-cue (verify still present before acting).** In `hooks/audit-tree-fingerprint.test.sh`, the section headed "git's own change detection off; flagged paths hashed" holds the oracle rows and the four closing rows. The shim's `ls-files` arm honors `SHIM_FAIL`. Found at landed tip 06ef13c17545.

Related: [[weak-test-assertion-passes-without-feature-being-exercised]], [[git-status-in-a-live-sibling-worktree-needs-optional-locks-off]], [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]], [[bash-per-call-watchdog-under-command-substitution-needs-detached-stdio-and-an-expired-gate-on-sigterm]].
