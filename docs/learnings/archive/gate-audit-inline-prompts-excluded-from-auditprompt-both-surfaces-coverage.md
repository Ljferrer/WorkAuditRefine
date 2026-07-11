---
name: gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage
description: "Gate-audit inline-prompt seats miss auditPrompt() clauses; reached only via war-auditor.md file"
metadata:
  type: project
  keywords: [gate-audit, auditPrompt, inline prompt, execution-evidence, end-state, calibration rule, cost-claim rule, both-surfaces coverage, standing instruction, SOFT evidence review]
  provenance: agent-unverified
  slug: gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage
  phase: audit-calibration-and-graduation/t1
  tags:
    - war
    - auditor
    - prompt-architecture
    - workflow-template
    - gate-audit
    - coverage-gap
  files:
    - skills/war/assets/workflow-template.js
    - agents/war-auditor.md
  relates:
    - "[[standing-instruction-vs-dispatched-prompt-coverage-split]]"
    - "[[verbatim-mirror-directive-context-mismatch-at-destination]]"
  created: 2026-07-06
---

# Gate-audit seats get new base-prompt clauses only through the standing surface, never the dispatched one

**What (audit-calibration-and-graduation/t1, deliberate design decision, not a defect):** the phase
added a CALIBRATION RULE (anti-softening) and COST-CLAIM RULE (unquantifiable cost caps a finding
at Minor) to the shared LATITUDE/DISPOSITION rules block inside `auditPrompt()` in
`skills/war/assets/workflow-template.js` (referent not re-confirmed in this checkout — the phase
landed on `dev/2026-07-06-audit-calibration-and-graduation`, absent here; verify present before
acting). Because `auditPrompt()` is rebuilt for every seat dispatch, the clause mechanically covers
the initial round, the REBUTTAL ROUND branch, and the post-fix re-audit — all three re-judgment
moments — for free.

**The gap:** the two gate-audit dispatches (`execution-evidence` lens, `end-state` lens) build
their prompts **inline**, not through `auditPrompt()`. They therefore do NOT receive the new
clauses via the dispatched-prompt path at all — only via the standing `agents/war-auditor.md`
surface, since gate-audit spawns as the same `auditor` agent type and reads its standing file at
session start.

**Why this is accepted, not a bug:** gate-audit is SOFT-by-default evidence review (execution
evidence downgrades to SOFT rather than hard-blocking on a stale worktree tip; see
[[gate-evidence-severity-not-verdict-gates-hard-path]]), not severity-graded diff judgment. The
design spec (`docs/specs/2026-07-06-audit-calibration-and-graduation-design.md` §4.1) explicitly
scopes this as accepted and leaves the inline prompts untouched.

**Durable pattern:** when a base-prompt rule is added to a shared prompt-builder function, enumerate
every call site that builds a *different* prompt for the same agent type — a standing-file mirror
covers those sites only if the standing file is actually read at spawn (true for `auditor`), and the
coverage is "prompt drift risk" not "the rule is entirely missing." This is the same two-layer split
as [[standing-instruction-vs-dispatched-prompt-coverage-split]], applied to a *within-agent-type*
seat-shape split rather than a standing-vs-dispatched split.

**How to apply:** before asserting a new auditor rule is universally live, grep every prompt-building
call site for that agent type (not just the primary `auditPrompt()` one) and classify each as
"covered via shared function" or "covered via standing file only" — document the latter explicitly,
as this phase's spec did.

> archived 2026-07-11: resolved — moved to archive
