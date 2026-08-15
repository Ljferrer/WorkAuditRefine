---
name: hard-trigger-narrowing-leaves-contradictory-clause-and-early-abort-truncation-residual
description: "Narrowing a mechanical HARD anti-cheat trigger via an adjudication note can leave a nearby unchanged clause contradicting the new rule, and the log format the new rule tests can itself be truncated by an early-abort discovery loop"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - D7
    - mappedTests
    - gate-audit
    - HARD trigger
    - enumeration-conditional
    - resolveGate
    - adjudication
    - land-blocking
    - contradictory clause
    - exit 1
    - early abort
  provenance: code-verified
  slug: hard-trigger-narrowing-leaves-contradictory-clause-and-early-abort-truncation-residual
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

precision-chain-and-loop-breaker/phase-3 task 3.2 (round-3, Lead-adjudicated) narrowed the D7
`mappedTests` HARD "provably unrun" trigger in the gate-audit seat prompt: absence of a mapped
test path from the captured gate log is HARD only when the log **enumerates** test file paths
for that suite half (the bash half's `== gate(bash): <path> ==` per-file headers); a piped
`node --test` run reports titles + an aggregate summary only, so a zero-hit `.mjs` grep is now
SOFT cannot-confirm. Landed and code-verified at
`skills/war/assets/workflow-template.js` (`mappedTestsLine`, ~line 1792-1796) and
`skills/war/assets/workflow-template.test.mjs`.

Two residuals the narrowing round did NOT close (both confirmed at the landed tip, both
recorded as `follow-up` disposition — i.e. real unresolved work, not resolved-before-land):

1. **Stale conjunctive clause 3 lines away.** The SAME seat prompt still carries the
   pre-existing sentence (unchanged by this diff, `skills/war/assets/workflow-template.js`
   ~line 1819-1821): "record a HARD gate-evidence finding ONLY when the mapped test is
   genuinely absent AT THE CONFIRMED INTEGRATION TIP and the captured artifact confirms it
   did not run." A present-but-unrun path satisfies the new `mappedTestsLine` rule but fails
   this older universal-restriction clause — a seat reading both gets contradictory
   instruction on the one path where the HARD trigger can still fire (a `.test.sh` present in
   the tree but missing from the bash half's enumeration). Direction is fail-open
   (under-trigger only), so it is a Minor follow-up, not a hold.

2. **The discovery loop that PRODUCES the "enumerating" log truncates on first red suite.**
   `resolveGate` in `skills/war/assets/war-config.mjs` composes the bash half as
   `for f in $(find . ... -name '*.test.sh' | sort); do printf '\n== gate(bash): %s ==\n' "$f"
   && bash "$f" || exit 1; done` — the `|| exit 1` aborts the WHOLE loop at the first red
   suite. On a baseline-proceed merge (a red gate consciously merged over classified `baseline`
   debt), every alphabetically-later `.test.sh` never prints its header, so the captured log
   IS enumerating (earlier headers present) yet a later mapped bash path reads absent — the
   new rule's condition is satisfied and the seat reads a false HARD land-hold, although the
   absence is caused by the abort, not by a fake/unrun test.

**Pattern for future work on this class of change:** when narrowing a land-blocking mechanical
trigger via a prompt-text adjudication note, (a) grep the WHOLE enclosing seat prompt for other
clauses touching the same trigger — not just the line the adjudication names — and (b) check
whether the underlying producer of the artifact the new condition tests can itself be
short-circuited (an early-abort loop, a truncated capture, a size cap) in a way that satisfies
the new condition's premise without satisfying its intent.

See also [[old-absent-gate-half-relies-on-unrecorded-hand-grep-fails-silently]] for the sibling
NEW-present/OLD-absent doc-gate asymmetry pattern.

> archived 2026-08-15: resolved — moved to archive
