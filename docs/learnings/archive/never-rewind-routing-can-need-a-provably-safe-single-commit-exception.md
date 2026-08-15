---
name: never-rewind-routing-can-need-a-provably-safe-single-commit-exception
description: "A plan's binary undo-routing partition ('condemned commit is HEAD and the only one -> reset --hard; otherwise -> git revert, never rewind') can still need a narrow rewind exception for one specific commit that is provably safe to discard (unpushed, sits at HEAD, nothing built on it) when reverting it would produce a worse outcome (here: unpublishing a promotion while the flow still pushes and stamps it as published) — implement the exception, self-flag it in the commit body as widening the plan's literal, and let the Lead ratify it rather than silently landing a plan-literal violation"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: never-rewind-routing-can-need-a-provably-safe-single-commit-exception
  phase: 2026-08-02-war-engine-and-standing-doc-truth/1.4
  keywords: 
    - never rewind
    - reset --hard HEAD~1
    - docs-commit shield
    - undo routing
    - Lead ratification
    - FIX_NEEDED
    - plan literal violation
    - carve-out
    - false publication
  tags: 
    - land-path
    - gate-2
    - deviation
    - adjudication
    - design-pattern
  created: 2026-08-03
  originSessionId: 4095ea62-efc7-4ed1-8045-8de0cd2f76bb
  modified: 2026-08-03T16:56:00.036Z
---

# A "never rewind" routing partition can need one provably-safe rewind exception

**The shape (code-verified at `skills/war/SKILL.md`'s Gate-2 undo routing, landed tip
`8f0d1009d1727e020d830f98debe91df09cd205d`; verify still present before acting):** the plan's End
state partitioned undo routing binarily — condemned commit is `HEAD` **and** the only one condemned
→ `git reset --hard HEAD~1`; not `HEAD`, **or** multiple condemned → `git revert` each, **never
rewind**. A fix round added a third route inside the "never rewind" arm: when the just-authored
`docs(learnings): phase N` commit is among **several** condemned commits, it is never `git revert`ed
— it takes the `reset --hard HEAD~1` carve-out **first** (it is provably at `HEAD` and unpushed),
and the revert routing then applies only to whatever is condemned beneath it.

**Why the literal-violating shape is actually correct:** reverting the docs commit under the plan's
literal routing would leave the promotion out of the pushed tree while the flow still proceeds to
`ensure-origin` and then stamps `metadata.promoted:` on the local originals — a successful push that
**falsely claims publication** (the exact outcome the copy-with-marker doctrine rejects). The
rewind's safety precondition ("unpushed, at `HEAD`, nothing built on top") holds by the flow's own
step ordering (the docs commit is authored immediately before this check runs, nothing commits
after it in the normal pass), so "never rewind published or built-upon history" is not actually
violated — only the plan's narrower binary wording is.

**Handling pattern to reuse:** when a fix round finds that a plan's routing partition — phrased as
if it were exhaustive ("X or Y → always Z") — needs a narrow exception for one commit/case that is
independently provably safe by a different invariant (unpushed + no descendants, here), (1)
implement the exception on its own merits rather than contorting into the letter of the existing
partition, (2) name in the commit body exactly which End-state/plan clause it widens and why the
safety invariant holds, and (3) explicitly ask for Lead ratification rather than letting a
literal-vs-candidate mismatch pass silently through gate-audit — a HARD End-state check reading the
plan's literal wording at the pinned tip would otherwise score it unmet even though the candidate is
the more correct implementation.

**Cross-links:** [[prepush-condemnation-check-must-scope-full-unpushed-range-not-head-only]] and
[[git-revert-on-widened-unpushed-range-needs-neutralized-pair-exemption]] — the same Gate-2 undo
routing, same phase, adjacent defects.

> archived 2026-08-15: resolved — moved to archive
