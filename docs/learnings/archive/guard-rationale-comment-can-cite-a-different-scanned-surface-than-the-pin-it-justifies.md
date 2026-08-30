---
name: guard-rationale-comment-can-cite-a-different-scanned-surface-than-the-pin-it-justifies
description: "A drift-guard test's justifying comment for a new positive/presence pin can claim it is the…"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: guard-rationale-comment-can-cite-a-different-scanned-surface-than-the-pin-it-justifies
  phase: "realized-absorb-rate/phase-3 (tasks 3.1 audit, 3.2 audit)"
  keywords: 
    - guard rationale comment
    - positive twin
    - non-vacuity twin
    - lacks_i vacuous pass
    - wrong surface cited
    - comment accuracy
    - drift-guard test comment
    - war-pipeline-structure.test.sh
    - has_i pin
    - misattributed justification
  tags: 
    - doc-honesty
    - test-design
    - comment-accuracy
    - drift-guard
  created: 2026-08-20
  phase_landed_tip: 4d93459972a4c4c67b5977064b583cbd41265d31
  phase_landed_branch: dev/2026-08-19-realized-absorb-rate
  originSessionId: d1c9bd01-e7da-46af-a12d-d59dbd7a69d1
  modified: 2026-08-20T17:51:22.843Z
---

# A new guard's justifying comment can wrongly claim it covers a DIFFERENT surface's vacuity risk

## The pattern (recorded as a pattern, not a live instance — see below)

During phase 3 of `realized-absorb-rate`, `skills/war-machine/war-pipeline-structure.test.sh` grew
four `lacks_i` OLD-absent arms scanning `$WAR_STRATEGY` (retired rule-count phrases), immediately
followed by two new `has_i` presence pins scanning `$MACHINE` (a different file). The comment
introduced alongside the two new pins justified them as "the positive twin for the retired-count
arms above (a deleted/renamed surface would pass the `lacks_i` vacuously)". Both halves of that
claim were false at the time: (1) `lacks_i`'s own `[ -f ]`-guarded body already fails loudly
("MISSING FILE") on a missing target — it does not pass vacuously (see
[[absence-check-passes-vacuously-on-missing-target-file-needs-paired-positive-assert]] for the
general non-vacuity contract this suite's helpers already implement); (2) even granting the
vacuity framing, the two new pins scan `$MACHINE`, not `$WAR_STRATEGY` — a presence pin on file B
cannot be the "twin" that guards file A's absence arms against deletion. The two new pins are
themselves correct and load-bearing (they are the only coverage of that task's actual slice — a
war-machine drafter-directive addition); only the comment's stated justification was wrong.

Two independent audit passes in the same phase (task 3.1's audit reviewing the sibling task's
diff, and task 3.2's own audit) flagged this identically and both routed `disposition: absorb,
autoFixable: true` — a comment-accuracy defect, not a coverage gap.

## Why this is durable and easy to miss

No test in a shell/node suite asserts comment CONTENT — only assertion behavior. A rationale
comment that names the wrong file, the wrong mechanism (vacuity vs. an already-guarded existence
check), or the wrong arm-set can sit next to perfectly correct, perfectly green assertions
indefinitely. A future maintainer trusting the comment (rather than re-deriving what the pins
actually scan) could believe a different arm-set is covered than really is — the repo's own
"anchor references by named construct" discipline exists precisely because rot like this is
otherwise invisible to a green suite.

## Finding-match note (D3/verify-on-write)

Re-read at the landed tip (`4d93459972a4c4c67b5977064b583cbd41265d31` on
`dev/2026-08-19-realized-absorb-rate`, via the `_refinery22` worktree whose `gitdir` names this
plan's slug): the comment was corrected before land — it now reads "Positive presence pins for
this task's war-machine addition — nothing else guards it (the retired-count arms above scan
`$WAR_STRATEGY` only, whose non-vacuity is held by the `has_i` loop above plus
`war-strategy-structure.test.sh`, and `lacks_i` already fails loudly on a missing file)". This
lesson is recorded as the **generic pattern**, not a live instance — the fix round applied before
land, per the standing finding-match-check protocol.

## How to apply

When reviewing (or authoring) a new presence/absence pin pair in a drift-guard test suite whose
comment claims a "twin"/"pairs with"/"covers the vacuity of" relationship to a DIFFERENT set of
arms: re-derive which file/variable each pin actually targets before trusting the comment's framing
— a correct pin with a false rationale reads as fully covered but silently misinforms the next
maintainer who reasons from the comment rather than the assertion.

## Related

[[absence-check-passes-vacuously-on-missing-target-file-needs-paired-positive-assert]] — the
underlying non-vacuity mechanism this comment misdescribed (this suite's helpers already implement
it via `[ -f ]`, contrary to the comment's claim). [[static-guard-deny-message-misnames-which-rule-fired-for-shared-char-class]],
[[source-comment-lags-emitted-prompt-after-rewrite]] — sibling comment-accuracy-vs-code-truth
defect classes in the same family.

> archived 2026-08-30: resolved — moved to archive
