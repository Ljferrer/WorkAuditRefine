---
name: prompt-only-clause-grep-guard-must-tolerate-sentence-case
description: "Prose grep guard: use -i + mid-sentence anchor"
metadata: 
  node_type: memory
  type: project
  keywords: [case-insensitive match, false negative, capitalization drift, anchor token, prose verification, requiresTest false, manual check]
  provenance: agent-unverified
  slug: prompt-only-clause-grep-guard-must-tolerate-sentence-case
  phase: no-test-routing-enum-gate-evidence/Phase4-t4
  tags: 
    - plan-authoring
    - grep-guard
    - requiresTest-false
    - red-team
    - self-verification
  created: 2026-06-30
  originSessionId: 1bd064e5-a8af-4b1f-91d5-638887067351
---

# Prompt-only clause's own grep guard must tolerate sentence case

## What happened

Plan `docs/plans/2026-06-30-no-test-routing-enum-gate-evidence.md`, Phase 4 (#269),
added a `requiresTest:false` (prompt-only) task: append a "do NOT curate/excerpt"
completeness clause to three `gate_output`-population prose sites (`workflow-template.js`
×2, `war-refiner.md`). Because there is no behavioral test for prose, the plan's own
verification step (V4) was a **manual grep**: `grep -rn 'do NOT curate' ...`.

The example clause text given in the plan is sentence-capitalized at its first site
(`*"Do NOT curate or excerpt — ..."*`) but the plan instructs each site to *adapt* the
clause to its surrounding prose form — which can lowercase it mid-sentence at other
sites. A case-sensitive `grep -rn 'do NOT curate'` therefore false-negates against a
correctly-landed but lowercased instance. Red-team probe `executable-proof` caught this
before build (Finding C, Minor/warn) and the fix was applied pre-implementation: switch
to case-insensitive `grep -rin` anchored on a casing-robust token (`curate or excerpt`,
which never occurs at a sentence boundary in either clause form).

## Why this matters generally

Any `requiresTest:false` task whose only verification is a manual/self-authored grep
guard is exposed to this exact trap: the plan writes one canonical (capitalized) example
of the new prose, but real landing sites vary in case/position. A case-sensitive grep
guard silently passes when it should fail closed, giving false confidence that the
clause landed everywhere it should have.

## How to apply

- When a plan step's *own* completeness check is a grep over freshly-authored prose
  (not an automated test), default the grep to case-insensitive (`-i` / `grep -rin`).
- Pick the anchor token from a position that is stable across every planned adaptation
  of the sentence (mid-sentence phrase, not a sentence-initial capitalized word).
- Treat this as a red-team-catchable class: `executable-proof` probes plan-authored
  verification commands, not just the production code — run one before build on any
  `requiresTest:false` prose task with a plan-defined manual grep gate.

Relates to [[gate-output-curated-excerpt-obscures-mapped-test-evidence]] (the underlying
completeness-clause problem this task fixes) and
[[task-prompt-suite-count-stale-after-stacking]] (sibling "self-discovery over literal"
discipline in the same plan).

> archived 2026-07-21: resolved — moved to archive
