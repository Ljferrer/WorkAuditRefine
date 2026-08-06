---
name: phase-close-polish-revert-can-silently-orphan-a-subset-of-absorbed-findings
description: "A phase-close polish commit that absorbs N queued findings can be reverted wholesale with no recorded rationale; the next polish pass re-derives its queue from the then-current open findings, not from what the reverted commit fixed — it can drain a DIFFERENT subset and permanently orphan the rest unless someone diffs the revert against the redo"
metadata: 
  node_type: memory
  type: project
  promoted: dev/2026-07-28-prompt-surface-simplification@phase-3
  provenance: code-verified
  slug: phase-close-polish-revert-can-silently-orphan-a-subset-of-absorbed-findings
  phase: prompt-surface-simplification/3.1
  keywords: 
    - phase-close
    - polish revert
    - absorb
    - revert without rationale
    - orphaned finding
    - re-land
    - queue drain
    - ADR 0012
    - gate-audit
    - duty 3
    - fix-set comparison
    - loop-breaker
  tags: 
    - war
    - phase-close
    - process
    - audit-findings
  created: 2026-07-28
  originSessionId: 15ea107f-a540-466b-bb69-7ce45fb6e5a4
  modified: 2026-08-06T21:22:19.725Z
---

# Phase-close polish revert can silently orphan a subset of absorbed findings

**Found (code-verified — landed tip `53ef8a7b1eed93a55a7a30dbc9137228f31e5d7b` on
`dev/2026-07-28-prompt-surface-simplification`):** Task 3.1's phase-close queue held two
findings. A polish commit `c6015c4` fixed both — a qualifier-lock comment-lag Minor in
`skills/war/assets/workflow-template.test.mjs` and a dangling `SKILL.md` citation Minor in
`skills/war/references/auditor-teach.md` (line 38, still reading `` `SKILL.md`, submodule
co-source-of-truth `` for content phase 2 had already relocated to
`skills/war/references/submodule-flows.md`). Commit `7e21867` reverted `c6015c4` **wholesale**,
carrying only git's default revert body (no rationale). The redo, task `p3-polish` /
commit `39afb54`, re-derived its own two-finding queue from the audit findings **open at redo
time** — which by then were a tour `.tours/architect-war-system.tour` line-anchor Nit (the
"≈729" stale snapshot fact) plus the *same* qualifier-lock comment-lag Minor — and drained that
pair. The `auditor-teach.md` citation fix was never re-applied. Verified directly: the file at
the landed tip still carries the dangling citation at line 38, with no header caveat.

**Why this happens:** a phase-close polish worker's charter (ADR 0012, `skills/war/SKILL.md`)
scopes it to "fix ONLY the queued findings, no ad-hoc seam hunting" — so it is correctly
mechanical, not investigative. But nothing threads *what the reverted commit used to fix* into
the next round's queue. If the revert's rationale isn't recorded (regression? mis-fix? scope
creep?), the next polish pass has no way to know two findings, not one, need re-examination —
it only sees whatever the auditor re-raises fresh, and a re-raised finding can differ from what
was originally fixed if intervening commits changed which findings are still detectable.

**How to catch it:** when a phase-close/polish commit is followed by a revert with no
substantive rationale, diff the reverted commit's fix-set against the next polish commit's
fix-set (by finding title/file, not just commit count) before treating the queue as drained.
A servitor or Lead auditing phase-close history should specifically check: does every finding
the reverted commit addressed reappear, fixed, in a later commit? If not, re-file it rather
than assuming the redo superseded it.

**Related:** [[verbatim-doc-move-breaks-relative-links-authored-for-old-location]] — the
specific defect that got orphaned here is an instance of that lesson's predicted phase-3
recurrence; this lesson is about the *process* gap (revert/redo bookkeeping), not the doc-link
defect itself.

---

## RECURRENCE — phase 5, same plan, harder failure mode (2026-07-29)

**Second occurrence, code-verified at `bd5faa9c8d60d51d800c6e2528437c36bfd6679b`.** Task 5.1's
polish `a8cbd17` absorbed six findings. Commit `dc72d36` reverted it wholesale with the same
signature as `7e21867`: body was only git's auto-generated `This reverts commit a8cbd17…`. So
the rationale-free-revert shape is **not a one-off** — treat it as a standing hazard of the
phase-close flow, not an incident.

**What made this one worse than phase 3:** the reverted polish had added *assertions*, so the
revert was **green-by-deletion**. It removed two `assert.match(workerMd, …)` pins
(`/own remote, not the superproject/`, `/primary confinement/`) from the mapped acceptance test
while **both pinned sentences stayed live inline** on `agents/war-worker.md`. Test count was
identical before and after (1010/1010) because the polish's assertions live *inside* an existing
test rather than adding cases — so no count-based check could see it. It also re-narrowed two D3
OLD-absent keys from a UNION scan back to a single-surface read (adjudication I), and
re-introduced a rewritten ADR 0002 link over the byte-identical original.

**What caught it:** the post-merge gate-audit (`execution-evidence` lens) filed it **Critical**
and the phase held at `held:escalation` — `landResult: null`, the dev branch never advanced.
Phase 3's instance shipped silently; this one could not. The lens that works is
*delete-and-trace against still-live text*: an assertion whose subject is still present in the
guarded file is guard, never obsolescence.

**The cheap decisive check, before re-applying or accepting a revert:** run the gate at the
**reverted commit itself**. Here `a8cbd17` was fully green (1010/1010 JS + 27/27 shell) — so the
revert had no gate justification of any kind, and re-applying was unambiguous. A revert whose
target is green is a defect until someone records why. Resolution: `git revert <the-revert>` with
the rationale in the body (`bd5faa9`), then land manually — the servitor does **not** run on a
held phase (`servitorResult: null`), so the exactly-once learnings capture falls to the Lead.

**Standing rule this pair establishes:** a phase-close revert with an auto-generated body is
never self-justifying. Before accepting one — (1) gate the reverted commit; (2) diff the revert
against still-live text for green-by-deletion; (3) if it stands, re-land it with a real rationale
naming which findings are being re-opened.

---

## RECURRENCE — phase 4, plan `2026-08-05-precision-chain-and-loop-breaker`, third occurrence,
## correct outcome but duty 3 still skipped (2026-08-06)

**Third occurrence, code-verified.** A revert (auto-generated body, "This reverts commit
`3ef9027`…") wholesale-reverted a phase-close ace-polish commit that had applied three
`absorb`-disposition audit findings on `skills/red-team/SKILL.md` and
`skills/red-team/references/lenses.md` — two Minor (Step 4's gate-invocation literal lacked the
`--rounds=<n> --round-limit=<resolved>` flags Step 5 claims "every gate computation" carries) and
one Nit (a report-template comment's relative `references/loop-budget.md` path resolves from
neither its own file nor an emitted report). The redo pass (`p4-polish`) re-applied all three
correctly — verified directly: at the redo tip, Step 4's literal carries the flags and the
template comment is repo-root-relative — so this instance did **not** repeat phase 5's
green-by-deletion failure mode; the standing rule's step (1)/(2) checks would have passed.

**What is new this time:** even a **correct** redo still skipped standing-rule duty 3. The redo
commit's body records no fix-set comparison against the reverted commit and never names the
revert or which findings were being re-opened — confirmed by reading the actual commit body at
the redo tip. A downstream seat (the phase's own gate-audit, re-run at the integrated tip) had to
reconstruct the comparison itself from `git show` on both commits to confirm nothing was lost.
Three occurrences across three separate phases (3, 5, 4-of-a-later-plan) with the identical
auto-generated-body signature makes this a structural gap in the phase-close-revert flow, not a
worker lapse: **nobody enforces duty 3, so it is skipped even when the worker gets the content
right.** A mechanical check (a follow-up-issue-worthy fix, not yet built) would be: when a
phase-close/polish commit is reverted, require the *next* commit on that surface to either name
the revert SHA in its own body or be flagged for a Lead/servitor fix-set diff before the phase's
absorbed-findings list is trusted.

**Where the underlying findings live (locate-cue, verify before acting):** `skills/red-team/SKILL.md`
Step 4's gate-invocation literal (Step 5, one line below, states the "every gate computation…
carries the flags" rule) and the `## Route upstream` template comment in
`skills/red-team/references/lenses.md`.

**Related:** [[spliced-test-section-orphans-adjacent-explanatory-comment]] — a different #1034-class
adjacency-rot pattern, unrelated mechanism but same "silent regression a diff-based check would
catch and a content-only read misses" family.
