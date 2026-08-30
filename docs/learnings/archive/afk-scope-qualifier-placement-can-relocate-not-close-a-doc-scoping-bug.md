---
name: afk-scope-qualifier-placement-can-relocate-not-close-a-doc-scoping-bug
description: "An --afk conditional-scope qualifier's syntactic attachment point in a multi-verb…"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: afk-scope-qualifier-placement-can-relocate-not-close-a-doc-scoping-bug
  phase: 2026-08-06-war-strategy-mirror-guards/phase-2 (task 2.1 audit + phase-close polish)
  keywords: 
    - "--afk scoping"
    - ADR 0014
    - drafter charter
    - qualifier placement
    - war-machine SKILL.md
    - parenthetical scoping bug
    - AI-declared markers
    - doc prose fix regression
    - scope creep in a fix
  tags: 
    - doc-authoring
    - adr-0014
    - war-machine
    - gotcha
  created: 2026-08-18
  originSessionId: db0604c4-3009-475d-8db8-5d92ff291ce2
  modified: 2026-08-18T07:59:13.562Z
---

# Fixing a doc-scoping bug can relocate it instead of closing it

## What happened (this phase's own record)

Task 2.1 landed `skills/war-machine/SKILL.md` §2 step-1's drafter-charter parenthetical, which
must scope its `AI-declared` marker duty to `--afk` runs only (ADR 0014 Decision 1: interactive
`/war-machine` still runs the operator echo-back confirm, so its intent is operator-confirmed,
never AI-declared). The task-audit found the clause unconditional — every run, interactive or
`--afk`, was told to stamp the two latitude sub-bullets `(AI-declared)` — and the polish round
applied a fix by inserting `— under `--afk`,` before the marker clause.

The **next** audit round (phase-close gate-audit polish) read the fixed sentence literally and
found the qualifier attaches to the wrong verb phrase: `… offers the intent's two optional
sub-bullets … — under `--afk`, with per-row `AI-declared` markers per ADR 0014)` reads as
scoping the *offering* of the sub-bullets to `--afk` runs (contradicting the ADR 0013 amendment,
which says all three authoring surfaces including this same drafter duty offer the clause
unconditionally, and the interview beat is explicitly "asked always") — not just the markers,
which is what the fix intended to scope. This second finding was routed `disposition:
follow-up` (not `autoFixable`, not absorbed), meaning it most likely shipped unresolved at land.

## The generalizable lesson

A conditional-scope qualifier inserted into an existing multi-clause sentence to fix one
mis-scoped duty must be checked against **every** verb phrase in that sentence, not just the one
it was written for — the same reviewing standard that caught the first bug can miss that the fix
itself created a second, subtler instance of the identical class one clause over. Two consecutive
audit rounds on the *same construct* each independently applied a correct literal-reading
standard and each found a live defect; the first fix's own author did not re-apply that standard
to the sentence's other verb.

## How to apply

When scoping a duty/clause to a conditional branch (e.g. `--afk`, a feature flag, an environment)
inside a sentence that already does more than one thing, either (a) split the sentence so the
qualifier has only one possible attachment point, or (b) attach the qualifier directly to the verb
phrase it must bound (here: "with per-row `AI-declared` markers per ADR 0014 **when the run is
`--afk`**" — right next to the markers, not floated earlier in the sentence next to "offers").
After any such fix, re-read the full sentence against the doctrine it must satisfy (here ADR 0013
Decision 2/ADR 0014 Decision 1) rather than trusting that inserting the qualifier closed the gap.

## Verification note (landed-tip grounding)

Not independently verified against the landed tip: this servitor's working directory was on
`master` (HEAD → `refs/heads/master`, an unrelated recent merge), no live worktree existed for
`dev/2026-08-06-war-strategy-mirror-guards` under `<repo-root>/.git/worktrees/*`, and the branch's
loose/remote refs exist with no live worktree — a dead end for Read with no Bash available. Falling
back to the audit-log record (not `gateEvidence: true`-backed for this specific finding): the
finding is `disposition: follow-up`, which in this repo's routing means it was **not** fixed in
this phase and is filed as a separate issue — treat the drafter-charter parenthetical in
`skills/war-machine/SKILL.md` §2 step 1 as **still carrying this scoping defect** until verified
otherwise; re-Grep the sentence before acting on or citing it as fixed.

> archived 2026-08-30: resolved — moved to archive
