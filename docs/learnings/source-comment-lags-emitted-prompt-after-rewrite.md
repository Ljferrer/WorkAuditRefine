---
name: source-comment-lags-emitted-prompt-after-rewrite
description: "Comments lag rewritten code; grep old terms same diff. RECURRENCE: fixing a stale 'this is the ONLY delta' comment by naming the new addition in a closed enumeration ('this AND X are the always-on deltas') recreates the same trap for the NEXT addition — prefer open/non-exhaustive wording."
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

**Local recurrence copy** of the repo-root lesson at
`docs/learnings/source-comment-lags-emitted-prompt-after-rewrite.md` (same slug) — the repo
copy carries a nested `metadata.provenance` (agent-unverified) so it is not user-authored,
but it is not directly editable by a servitor outside its own local root (D1); this file
carries the original content plus the new "closed enumeration" bullet below. A future Gate-2
promotion of this file overwrites the same-slug repo file.

# Source comment lags emitted prompt after rewrite

**Rule:** when a rewrite changes what a function emits or what a regex/token matches, grep the file header, JSDoc, and the surrounding ~5 lines for comments naming the old behavior in concrete terms (a literal indent count, a literal value, an old approach) and update them in the same diff. Tests assert emitted output, never comments — a stale comment survives green and invites a future "fix" back to the old model. Do not rely on an issue's named diff scope to catch a comment that fell just outside it.

All 3 recorded instances fixed in the live repo (3 independent recurrences — a real pattern): the `auditPrompt` header in `skills/war/assets/workflow-template.js` (now states the three-dot model, see [[audit-baseline-must-pin-integration-branch-not-main-checkout]]), the awk-collect comment in `skills/war/assets/assert-no-submodule-mutation.sh` ("use read with IFS" removed), and the locator comment in `hooks/validate-servitor-provenance.sh` (now "any leading whitespace", see [[yaml-extraction-indent-coupling-in-shell-gate]]).

**Why:** comment drift is silent documentation debt with zero test coverage.

**How to apply:** after any behavior-changing rewrite, grep the same file for the old behavior's concrete terms before committing.

## Recurrence (2026-08-06-handoff-schemas-contract/phase-1, task 1.1 + its p1-polish
phase-close fix): fixing a stale "ONLY" claim with a closed enumeration recreates the same
trap for the NEXT addition

Two-step sequence, both steps code-verified (task 1.1 at `gateHeadSha`
`28f26105081267f70ef80788c2bbdb8837abaa93`; the polish fix at the pre-land integration tip
`23680df427fb712feb9756ad951d8ee00972ac01`, one merge commit before this plan's landed tip —
no live worktree resolved to the exact landed SHA at capture time, so this is the closest
grounded rung available per the servitor's landed-tip ladder).

1. Task 1.1 added a second always-on clause (`worktreeHygieneClause`, D20/#1381) to the
   provision-barrier prompt in `skills/war/assets/workflow-template.js`, concatenated right
   after the pre-existing `staleRemoteClause`. The comment directly above `staleRemoteClause`
   still read: "This is the ONLY delta between a recovery-absent barrier prompt and today." —
   now false, since a second unconditional clause sits five lines below it. Audit finding:
   Minor, `absorb`, `phaseClose:true`.
2. The phase-close polish task fixed it by *naming the new addition inline*: "This and the
   WORKTREE_HYGIENE capture clause below are the always-on deltas between a recovery-absent
   barrier prompt and today." This reads as fixed and is a real improvement (no longer
   false at the moment it was written) — but the fix kept the **same exhaustive grammatical
   shape** ("are the always-on deltas", a closed two-item enumeration). A follow-up
   gate-audit finding on the polish diff itself caught that the claim was *still*
   under-inclusive at the moment it was written: the barrier's `ok: true` return-shape
   sentence (a few lines further down the same file) also enumerates both `staleRemote` and
   `worktreeHygiene` unconditionally, and is neither of the two named clauses — so "are the
   always-on deltas" was already incomplete the moment it landed, just less obviously wrong
   than the original "ONLY" claim.

**Pattern:** when the *fix* for a stale exhaustive/"ONLY"-style comment is to enumerate the
new member(s) by name in a still-closed form ("X and Y are the only/always-on ..."), the fix
does not remove the fragility — it just resets the false-claim clock. The next addition
anywhere near the same concept (a third clause, a third return field, a third call site)
recreates the identical defect, and because the comment now *looks* current (it mentions the
most recent addition), it is even less likely to draw a reviewer's suspicion than the
original "ONLY" wording did. **Fix:** when correcting a stale absolute/exhaustive-claim
comment, prefer non-exhaustive phrasing that survives a future addition without edits — e.g.
"one of the always-on deltas is X (see also the `ok: true` return-shape sentence below, which
enumerates the full set)" rather than a closed "X and Y are the only/always-on ..." list. If a
truly closed set is intended, point it at the actual enumeration site (a single array/object
literal) rather than re-stating the members in prose at every reference — one canonical
enumeration, N pointers, instead of N independently-decaying enumerations.

Related: [[floor-script-header-can-claim-unbacked-downstream-capture]] (same phase — a
different comment-overclaim shape, a claimed downstream *consumer* rather than a claimed
exhaustive *set*).
