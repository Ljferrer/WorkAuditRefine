---
name: a-for-loop-over-command-substitution-hides-the-commands-failure
description: "for m in $(cmd) ignores a failed cmd, so capture it first with ms=$(cmd) &&"
metadata:
  node_type: memory
  type: project
  keywords:
    - for loop command substitution
    - swallowed exit status
    - rev-list --first-parent --merges
    - bounded merge walk
    - tip..integration
    - PATH git wrapper
    - absorbChargesClause
    - plausible 0
  provenance: code-verified
  slug: a-for-loop-over-command-substitution-hides-the-commands-failure
  phase: 2026-10-28-blocked-ace-and-merge-provenance/phase-3 (task 3.1)
  tags:
    - shell
    - git
    - tests
    - war-engine
  created: 2026-10-30
  originSessionId: 3f00b529-667c-446f-a615-e0d3485ae35a
  modified: 2026-10-30T07:47:44.107Z
---

# A for loop over command substitution hides the command's failure

**The shell fact.** In `for m in $(cmd); do ...; done`, bash ignores the exit status of `cmd`.
If `cmd` fails, the loop runs zero times and the line exits 0.
A read that then falls back to a default (here, an empty range) reports a plausible value, not an error.

**The fix.** Capture first and chain: `ms=$(cmd) && for m in $ms; do ...; done`.
A failed `cmd` now fails the whole command.

**Instance.** `absorbChargesClause` in `skills/war/assets/workflow-template.js` walks merge commits to find the task's merge commit M.
The first spelling used `for m in $(git rev-list ...)`, so a failed walk seeded an absorb charge of 0.

**Bound the merge walk.** To find a merge M whose second parent is the task tip, walk `rev-list --first-parent --merges "$tip..<integration>"`.
M can never be an ancestor of the tip, so the bound never loses it.
An unbounded walk made one `rev-parse` spawn per first-parent merge in history (about 280 per task in this repo).
A branch already at the integration tip gets an empty walk.

**Testing a single git failure.** An ace commit body claimed no test can isolate the failed-walk arm, and an audit seat proved that false.
Put a node `git` wrapper first on `PATH` that exits 128 only for the exact call (for example `rev-list` plus `--first-parent` plus `--merges`).
Delegate every other call to the real git.
Then run the prompt's own command text through `bash -c` and assert a non-zero status.
Prove it red by rewriting the capture back to the `for m in $(...)` form and asserting exit 0.

Related: [[a-shell-command-inside-a-prompt-string-needs-a-test-that-runs-the-exact-prompt-spelling-through-bash]], [[reclaim-empty-orphan-proof-swallows-git-log-error-as-empty]].

Locate-cue: verify still present before acting. At landed tip 8c1a7a51, `absorbChargesClause` holds `ms=$(git -C "$W" rev-list --first-parent --merges "$tip..<integration>") && for m in $ms`.
The test `2485/ES17 a failed merge walk fails the absorb-charge read and never seeds a plausible 0` in `skills/war/assets/workflow-template.test.mjs` holds the PATH wrapper and the red proof.
