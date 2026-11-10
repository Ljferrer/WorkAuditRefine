---
name: narrowing-a-prompt-trigger-needs-a-whole-prompt-grep-for-contradicting-clauses
description: "Narrowing a HARD trigger can leave a nearby conjunctive clause that contradicts it; grep the whole seat prompt"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - HARD trigger
    - mappedTestsLine
    - contradictory clause
    - seat prompt
    - adjudication narrowing
  provenance: code-verified
  slug: narrowing-a-prompt-trigger-needs-a-whole-prompt-grep-for-contradicting-clauses
  phase: precision-chain-and-loop-breaker/phase-3 task 3.2
  tags: 
    - gate-audit
    - workflow-template
    - prompt-surface
    - follow-up
  created: 2026-08-06
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-08-06T18:54:09.715Z
---

After narrowing a prompt trigger, grep the whole prompt for clauses that still state the old, wider condition.

**Instance:** precision-chain-and-loop-breaker/phase-3 task 3.2 (Lead-adjudicated) narrowed the D7
`mappedTests` HARD "provably unrun" trigger in the gate-audit seat prompt (`mappedTestsLine` in
`skills/war/assets/workflow-template.js`): absence of a mapped test path from the captured gate log
is HARD only when the log **enumerates** test file paths for that suite half (the bash half's
`== gate(bash): <path> ==` per-file headers); a piped `node --test` run reports titles and an
aggregate summary only, so a zero-hit `.mjs` grep is SOFT cannot-confirm.

**Why:** the SAME seat prompt still carried a pre-existing sentence a few lines away, unchanged by
that diff: "record a HARD gate-evidence finding ONLY when the mapped test is genuinely absent AT THE
CONFIRMED INTEGRATION TIP and the captured artifact confirms it did not run." A present-but-unrun
path satisfies the new `mappedTestsLine` rule but fails this older universal-restriction clause, so
a seat reading both got contradictory instruction on the one path where the HARD trigger can still
fire (a `.test.sh` present in the tree but missing from the bash half's enumeration). The direction
was fail-open (under-trigger only), so it was a Minor `follow-up`, not a hold.

**How to apply:** when narrowing a land-blocking mechanical trigger via a prompt-text adjudication
note, grep the WHOLE enclosing seat prompt for other clauses touching the same trigger — not just
the line the adjudication names — and reconcile each one in the same diff.

RESOLVED (gate-audit-finding-routing, #1377/#1372, 2026-08-15).

See also [[resolvegate-bash-discovery-loop-aborts-at-first-red-suite-so-later-test-headers-never-print]]
(the other residual of the same narrowing round) and
[[old-absent-gate-half-relies-on-unrecorded-hand-grep-fails-silently]].

> archived 2026-08-15: resolved — moved to archive
