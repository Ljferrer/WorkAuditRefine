---
name: prompt-only-clause-grep-guard-must-tolerate-sentence-case
description: "A grep guard over prose, whether it checks a clause is present or a retired phrase is absent, must match case-insensitively on a mid-sentence anchor"
metadata:
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: prompt-only-clause-grep-guard-must-tolerate-sentence-case
  phase: no-test-routing-enum-gate-evidence/Phase4-t4
  keywords:
    - case-insensitive match
    - false negative
    - capitalization drift
    - anchor token
    - prose verification
    - requiresTest false
    - manual check
    - retirement grep
    - case-sensitive false negative
    - sentence-initial capitalization
    - grep -i
    - OLD-absent guard
    - doc-consistency gate
    - toLowerCase
    - red-team-gate
  tags:
    - plan-authoring
    - grep-guard
    - requiresTest-false
    - red-team
    - self-verification
    - testing
    - gotcha
  created: 2026-06-30
  originSessionId: 1bd064e5-a8af-4b1f-91d5-638887067351
---

# Prompt-only clause's own grep guard must tolerate sentence case

**Rule:** a grep guard over prose must match case-insensitively (`grep -i`, a regex `/i` flag, or a
`.toLowerCase()` comparison) and anchor on a mid-sentence phrase. This holds both ways:
- **Presence:** a check that a new clause landed at every site.
- **Absence:** a check that retired wording is gone (a retirement grep or a drift-guard absence test).

The same prose lands capitalized at a sentence start and lowercased mid-sentence. A case-sensitive
guard false-negates on the other casing and passes when it should fail.

## Presence instance

Plan `docs/plans/2026-06-30-no-test-routing-enum-gate-evidence.md`, Phase 4 (#269), added a
`requiresTest:false` task: append a "do NOT curate/excerpt" clause to three `gate_output` prose
sites. Its only check was a manual `grep -rn 'do NOT curate' ...`. The plan's example was
sentence-capitalized (`"Do NOT curate or excerpt — ..."`), and each site adapted the case. Red-team
probe `executable-proof` caught the false negative before build. The fix: `grep -rin` anchored on
`curate or excerpt`, which never sits at a sentence start.

## Absence instance

A retired phrase like `... is refused by construction ...` can come back as its own sentence:
"Refused by construction: the CLI never reaches the read." A case-sensitive retirement grep reports
zero hits while the retired claim is live. `/red-team` round 1 reproduced this before
red-team-gate-cli/1.2 landed. In `skills/red-team/assets/red-team-gate.test.mjs`, the D8b doc-guard
row compares its retired-wording needles against `text.toLowerCase()`.

## How to apply

- When a plan step's own completeness check is a grep over fresh prose, default to `-i` / `grep -rin`.
- For any "retired wording must be gone" backstop, default to case-insensitive matching unless the
  casing itself is load-bearing.
- Pick the anchor from a position stable across every planned adaptation of the sentence.
- `executable-proof` probes plan-authored check commands, not just production code. Run one before
  build on any `requiresTest:false` prose task with a manual grep gate.

Relates to [[gate-output-curated-excerpt-obscures-mapped-test-evidence]],
[[task-prompt-suite-count-stale-after-stacking]],
[[backstop-retirement-grep-false-reds-on-sanctioned-replacement-substring]] (the mirror image: a
retirement grep false-*reds* on a sanctioned substring), and
[[old-absent-gate-half-relies-on-unrecorded-hand-grep-fails-silently]].

> archived 2026-07-21: resolved — moved to archive
