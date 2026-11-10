---
name: phase-close-polish-revert-can-silently-orphan-a-subset-of-absorbed-findings
description: "A wholesale revert of a phase-close polish commit can orphan some of its absorbed findings, so diff the reverted fix-set against the redo's fix-set before treating the queue as drained"
metadata: 
  node_type: memory
  type: project
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
    - polish-rejected
    - polish-discarded
    - env-died schemas.md gap
    - stampDrainCause
    - drain-cause comment
    - filed follow-up never fixed
  tags: 
    - war
    - phase-close
    - process
    - audit-findings
  created: 2026-07-28
  originSessionId: 15ea107f-a540-466b-bb69-7ce45fb6e5a4
  modified: 2026-08-26T20:31:49.018Z
---

# Phase-close polish revert can silently orphan a subset of absorbed findings

**Found (code-verified):** Task 3.1's phase-close queue held two findings. A polish commit
fixed both — a qualifier-lock comment-lag Minor in
`skills/war/assets/workflow-template.test.mjs` and a dangling `SKILL.md` citation Minor in
`skills/war/references/auditor-teach.md` (still reading `` `SKILL.md`, submodule
co-source-of-truth `` for content phase 2 had already relocated to
`skills/war/references/submodule-flows.md`). A later commit reverted the polish **wholesale**,
carrying only git's default revert body (no rationale). The redo, task `p3-polish`,
re-derived its own two-finding queue from the audit findings **open at redo time** — which by
then were a tour `.tours/architect-war-system.tour` line-anchor Nit (the "≈729" stale snapshot
fact) plus the *same* qualifier-lock comment-lag Minor — and drained that pair. The
`auditor-teach.md` citation fix was never re-applied. Verified directly: the file at the landed
tip still carried the dangling citation, with no header caveat.

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
signature as the phase-3 revert: body was only git's auto-generated `This reverts commit a8cbd17…`. So
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
the rationale in the body (`bd5faa9`), then land manually. Wrap-up runs on held phases since
#2702, so read `servitorResult` before a manual learnings capture.

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

---

## RECURRENCE — phase 2, plan `2026-08-06-handoff-schemas-contract`, revert caught by its own
## redo's audit but the redo never landed (2026-08-17)

**Fourth occurrence.** Grounded via `.git/refs` and `.git/logs/refs` reads plus the phase's
gate-audit log (`gateEvidence: true`). Commit `f26e1eb` was an ace-absorb during task 2.1 adding
`env-died` beside `env-blocked` to `skills/war/references/schemas.md`'s run-manifest task-status
enumeration. Commit `71ddc08` reverted it wholesale with git's bare auto-generated body — no
rationale — and **71ddc08 is itself the confirmed phase-2 integration tip** (matches
`gateHeadSha`/`auditSha` for both task 2.1 and 2.2's gate-audits).

**What's new this time — the mitigation partially fired, then lost anyway.** The terminal
phase-close task `p2-polish` had its own diff audited, and that audit correctly re-derived the
orphaned absorb as a **Major**, `disposition: absorb, phaseClose: true` finding — i.e. it *did*
catch the gap the revert created, matching this lesson's "how to catch it" guidance almost exactly
(grounded the claim in `git log -Senv-died` against the pinned blob, cited the revert SHA and its
bare body, and named the redo-vs-revert fix-set comparison this lesson's duty 3 mandates). That
audit's verdict was `polish-rejected` — the diff did not merge. The task's SECOND recorded outcome
was `verdict: polish-discarded` with an **empty** findings array and `blocked: null`, i.e. no
further redo commit landed. Per this repo's `phase-close coherence sweep (fail-open polish of
absorb findings)` architecture, a discarded/rejected polish is fail-open: the phase proceeds to
Land regardless, without those fixes. **Net effect:** the same env-died/schemas.md gap this
lesson's core mechanism describes was re-orphaned a fourth time, despite one audit pass correctly
diagnosing it using language that echoes this very lesson's guidance. Whether `schemas.md`
carries `env-died` at the true landed tip was not independently re-confirmed; check with `grep -c
env-died skills/war/references/schemas.md`.

**Related:** [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] — the
sibling lesson this recurrence also instantiates (a fresh absorb+phaseClose:true finding on the
polish task's OWN diff, with no further round); read both together for this incident.

---

**Fifth occurrence (2026-08-26, plan `2026-08-25-engine-reliability-and-filing-fidelity`
phase 6):** a wholesale revert of a three-Nit polish in `skills/war/assets/workflow-template.js`
left the `stampDrainCause` block comment's over-attribution unqueued; the redo's audit diagnosed
the orphaning but disposed it `follow-up` with no further round, so the false comment shipped —
fold such a fix into the next phase that touches the same file instead of trusting the issue queue.

> archived 2026-08-30: resolved — moved to archive
