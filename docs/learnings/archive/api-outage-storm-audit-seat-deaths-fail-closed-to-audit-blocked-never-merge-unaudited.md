---
name: api-outage-storm-audit-seat-deaths-fail-closed-to-audit-blocked-never-merge-unaudited
description: "A sustained provider-API outage (14 dispatches lost to 529 Overloaded) exercised the engine's…"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - 529 Overloaded
    - provider outage
    - audit-blocked
    - env-died
    - dispatchAgent
    - pushed but unmerged
    - never merge unaudited
    - API-free verification
    - local gate run
    - checkpoint evidence
    - backoff
    - sustained outage
    - fail-closed
  provenance: agent-unverified
  slug: api-outage-storm-audit-seat-deaths-fail-closed-to-audit-blocked-never-merge-unaudited
  phase: 2026-08-06-references-pointer-integrity/phase-2
  tags: 
    - war
    - engine
    - resilience
    - escalation
    - infra-death
    - release
  relates: 
    - "[[env-died-classification-wraps-only-impl-and-fix-dispatch-not-provision-or-audit-or-null-return]]"
    - "[[wave-loop-thunk-catch-prevents-null-result-infinite-redispatch]]"
  created: 2026-08-18
  originSessionId: db0604c4-3009-475d-8db8-5d92ff291ce2
  modified: 2026-08-18T18:30:55.189Z
---

# A sustained 529-Overloaded storm exercised the engine's fail-closed paths correctly

**What happened (`2026-08-06-references-pointer-integrity`, phase 2, task #1544, epic #1529):**
across two workflow runs plus one Lead-driven round, fourteen dispatches died on `529 Overloaded`.
Attempt 1 lost the worker before any commit — zero state, so a clean relaunch was correct
(nothing to resume, no repair-toward-git needed; git branch state > issue labels > ledger.json
per this repo's own resume doctrine). Attempt 2's worker succeeded and committed, but all three
audit seats plus the post-merge gate-audit died to the same outage; the engine returned
`audit-blocked` with the release commit **pushed to its task branch but left unmerged** —
consistent with this repo's own execution architecture (Work+Audit happens before the Refine
serial-merge step; a task-branch push is not a merge). No incorrect state was produced at any
point: the engine never merged un-audited work, and the eventual land happened only after real
audit evidence existed.

The Lead used an **API-free verification path** while seats were unavailable: running the full
gate locally in a clean detached worktree to establish gate-log / `pin_status` evidence
independent of any agent dispatch, keeping the checkpoint's evidence complete without waiting on
the provider.

## Durable rule

On a sustained provider outage (repeated `529`/`Overloaded` across multiple dispatch attempts),
back off on a timer rather than immediately re-dispatching, and lean on API-free evidence
channels (local gate runs, direct git reads/greps) to keep run evidence current while seats are
unavailable. The engine's refusal to merge un-audited work — `audit-blocked` is a HARD escalation
regardless of *why* every audit seat died — is exactly what makes this kind of outage safe rather
than merely annoying: a dead audit seat can never silently downgrade to "approved."

**Distinguish from
[[env-died-classification-wraps-only-impl-and-fix-dispatch-not-provision-or-audit-or-null-return]]:**
that lesson records the classification-coverage GAP — audit-seat deaths are routed HARD
(`audit-blocked`) rather than the soft, retryable `env-died` class, because seat dispatches go
through `parallel` and NULL into a dropped seat before any `dispatchAgent`-style tagging can
apply. This lesson is the operational flip side: in this real incident, that same HARD routing
was the *correct, safe* behavior — no task was lost or silently mis-classified, it was just
louder than a soft `env-died` retry would have been. Both are true at once: the coverage gap is
real, and the fail-safe direction it defaults to is the right one.

**Verification caveat:** this is Lead-reported run/operational history (dispatch counts, which
seats died, when) — there is no single code referent to D3-verify a run narrative against. The
general mechanism it relies on is confirmed in code: `audit-blocked` is a real status literal in
both `skills/war/assets/land-decision.mjs` and `skills/war/assets/workflow-template.js`
(`code-verified` — grep-confirmed present in both files at the current checkout), and the
Work-before-Refine ordering is this repo's own documented execution architecture.

Related:
[[env-died-classification-wraps-only-impl-and-fix-dispatch-not-provision-or-audit-or-null-return]]
(the classification-gap lesson this confirms operationally);
[[wave-loop-thunk-catch-prevents-null-result-infinite-redispatch]] (the `parallel`/null mechanics
audit-seat deaths ride).

> archived 2026-08-30: resolved — moved to archive
