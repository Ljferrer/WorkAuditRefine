---
name: source-comment-lags-emitted-prompt-after-rewrite
description: "After a rewrite, fix comments naming the old behavior in the same diff"
metadata:
  node_type: memory
  slug: source-comment-lags-emitted-prompt-after-rewrite
  phase: "F03/p1-t1 + submodule-inc2/T2 + servitor-provenance-gate-robustness/t1 + 2026-08-06-handoff-schemas-contract/p1-polish (recurrence, 2026-08-17)"
  type: project
  keywords: [stale comment, JSDoc drift, code doc mismatch, behavior rewrite sweep, silent documentation debt, old term grep, ONLY delta, exhaustive claim, closed enumeration, staleRemoteClause, worktreeHygieneClause, always-on deltas]
  provenance: agent-unverified
  severity: Minor
  tags:
    - documentation
    - auditor
    - workflow-template
    - baseline-model
    - gate-design
  relates:
    - "[[yaml-extraction-indent-coupling-in-shell-gate]]"
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
  created: 2026-08-05
  modified: 2026-08-17T12:08:37.822Z
---

# Source comment lags emitted prompt after rewrite

**Rule:** when a rewrite changes what a function emits or what a regex/token matches, grep the file header, JSDoc, and the nearby lines for comments naming the old behavior in concrete terms (a literal indent count, a literal value, an old approach). Update them in the same diff. Tests assert emitted output, never comments, so a stale comment survives green and invites a future "fix" back to the old model. Do not rely on an issue's named diff scope to catch a comment just outside it.

Three early instances are fixed: the `auditPrompt` header comment in `skills/war/assets/workflow-template.js` (now states the three-dot model, see [[audit-baseline-must-pin-integration-branch-not-main-checkout]]), the awk-collect comment in `skills/war/assets/assert-no-submodule-mutation.sh` (moved from `hooks/`; "use read with IFS" removed), and the `metadata:` locator comment in `hooks/validate-servitor-provenance.sh` (now "any indent", see [[yaml-extraction-indent-coupling-in-shell-gate]]).

## Closed enumerations reset the clock

A fix that names the new members in a closed list ("X and Y are the only / always-on ...") resets the false-claim clock. The next addition recreates the defect, and the comment looks current, so reviewers suspect it less. Instance (handoff-schemas plan, phase 1): "This is the ONLY delta" above `staleRemoteClause` became "This and the WORKTREE_HYGIENE capture clause below are the always-on deltas", which was already incomplete when it landed. That wording is still live above `staleRemoteClause`.

**Fix:** prefer non-exhaustive wording that survives a future addition ("one of the always-on deltas is X"). If the set is truly closed, point at the one enumeration site instead of restating the members in prose.

**Why:** comment drift is silent documentation debt with zero test coverage.

**How to apply:** after any behavior-changing rewrite, grep the same file for the old behavior's concrete terms before committing.

Related: [[floor-script-header-can-claim-unbacked-downstream-capture]] (a claimed downstream consumer rather than a claimed exhaustive set).
